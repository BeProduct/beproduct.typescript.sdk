import { OAuth2TokenManager } from "./auth.js";
import {
  BeProductError,
  BeProductThrottleError,
  BeProductValidationError,
} from "./errors.js";

export interface RateLimitState {
  limit: number;
  remaining: number;
  resetAt: Date;
}

export interface FileInput {
  filepath?: string;
  fileUrl?: string;
  buffer?: Buffer;
  filename?: string;
  size?: number;
}

const FALLBACK_BACKOFF = [1, 3, 5, 15, 30];

/**
 * Walk the `cause` chain on a fetch error and produce a readable summary.
 * undici's `TypeError("fetch failed")` carries the real cause (system error
 * code like ECONNRESET / EAI_AGAIN / UND_ERR_SOCKET) inside `error.cause`.
 */
function describeNetworkError(err: unknown): string {
  const parts: string[] = [];
  let current: unknown = err;
  let depth = 0;
  while (current && depth < 5) {
    const e = current as { name?: string; message?: string; code?: string; cause?: unknown };
    const tag = e.code ? `${e.code}` : e.name ?? "Error";
    parts.push(`${tag}${e.message ? ": " + e.message : ""}`);
    if (!e.cause || e.cause === current) break;
    current = e.cause;
    depth++;
  }
  return parts.join(" → ");
}

export class HttpClient {
  rateLimitState: RateLimitState | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly tokenManager: OAuth2TokenManager,
    private readonly additionalHeaders?: Record<string, string>,
  ) {}

  async get<T = unknown>(
    url: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    return this.request<T>("GET", url, undefined, params);
  }

  async post<T = unknown>(
    url: string,
    body: unknown,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    return this.request<T>("POST", url, body, params);
  }

  async delete<T = unknown>(
    url: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    return this.request<T>("DELETE", url, undefined, params);
  }

  async uploadFile(
    url: string,
    file: FileInput,
    params?: Record<string, string | number | boolean | undefined>,
    additionalFields?: Record<string, string>,
  ): Promise<string | null> {
    const fullUrl = this.buildUrl(url, params);
    const token = await this.tokenManager.getAccessToken();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      ...this.additionalHeaders,
    };

    const form = new FormData();

    if (additionalFields) {
      for (const [k, v] of Object.entries(additionalFields)) {
        form.append(k, v);
      }
    }

    if (file.buffer && file.filename) {
      form.append("file", new Blob([new Uint8Array(file.buffer)]), file.filename);
    } else if (file.filepath) {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const buf = fs.readFileSync(file.filepath);
      form.append("file", new Blob([new Uint8Array(buf)]), path.basename(file.filepath));
    } else if (file.fileUrl) {
      const fileRes = await fetch(file.fileUrl);
      if (!fileRes.ok) throw new Error(`Failed to fetch file: ${file.fileUrl}`);
      const ab = await fileRes.arrayBuffer();
      const filename =
        file.filename ?? new URL(file.fileUrl).pathname.split("/").pop() ?? "file";
      form.append("file", new Blob([ab]), filename);
    } else {
      throw new Error("FileInput must provide filepath, fileUrl, or buffer+filename");
    }

    for (let attempt = 0; ; attempt++) {
      await this.preemptiveThrottle();

      const res = await fetch(fullUrl, { method: "POST", headers, body: form });
      this.updateRateLimitState(res.headers);

      if (res.status === 429) {
        if (await this.handleThrottle(res, attempt, fullUrl)) continue;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new BeProductError(
          `Upload failed: ${res.status}`,
          res.status,
          fullUrl,
          text,
        );
      }

      const data = (await res.json()) as Record<string, unknown>;
      return (data.imageId as string) ?? null;
    }
  }

  async uploadStatus(
    fileId: string,
  ): Promise<{ finished: boolean; errorOccurred: boolean; message: string }> {
    const data = await this.get<Record<string, unknown>>(
      `Style/GetImageProcessingStatus/${fileId}`,
    );
    return {
      finished: data.finished as boolean,
      errorOccurred: data.errorOccured as boolean, // API typo
      message: (data.message as string) ?? "",
    };
  }

  async getRateLimitStatus(): Promise<unknown> {
    return this.get("ratelimit/status");
  }

  // --- internals ---

  private async request<T>(
    method: string,
    url: string,
    body: unknown,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    const fullUrl = this.buildUrl(url, params);
    // Snapshot the request body once so we can attach it to any thrown error
    // — operators replay failed calls from the run-detail logs and need the
    // exact (method, url, body) tuple to reproduce against curl/Postman.
    const requestBodyStr = body !== undefined ? JSON.stringify(body) : undefined;

    const MAX_NETWORK_RETRIES = 3;
    const TRANSIENT_HTTP_STATUS = new Set([502, 503, 504]);
    let networkAttempts = 0;
    let httpRetries = 0;

    for (let attempt = 0; ; attempt++) {
      await this.preemptiveThrottle();

      const token = await this.tokenManager.getAccessToken();
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...this.additionalHeaders,
      };

      let res: Response;
      try {
        res = await fetch(fullUrl, {
          method,
          headers,
          body: requestBodyStr,
        });
      } catch (err) {
        // undici throws TypeError("fetch failed") for transport-layer errors
        // (DNS, ECONNRESET, socket drop, TLS, read timeout). Retry a handful
        // of times with exponential backoff; on final failure surface the
        // cause chain so the run-detail page tells the operator what
        // actually died instead of just "fetch failed".
        if (networkAttempts < MAX_NETWORK_RETRIES) {
          networkAttempts++;
          const delayMs = 500 * Math.pow(2, networkAttempts - 1); // 500, 1000, 2000
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        throw new BeProductError(
          `network error after ${MAX_NETWORK_RETRIES + 1} attempts: ${describeNetworkError(err)}`,
          0,
          fullUrl,
          err instanceof Error ? err.stack ?? err.message : String(err),
          method,
          requestBodyStr,
        );
      }

      this.updateRateLimitState(res.headers);

      if (res.status === 429) {
        if (await this.handleThrottle(res, attempt, fullUrl)) continue;
      }

      if (!res.ok) {
        // 5xx gateway errors are typically transient on the BeProduct side.
        // Retry up to MAX_NETWORK_RETRIES with the same backoff schedule so
        // the operator doesn't see a single 502 as a hard failure.
        if (TRANSIENT_HTTP_STATUS.has(res.status) && httpRetries < MAX_NETWORK_RETRIES) {
          httpRetries++;
          const delayMs = 500 * Math.pow(2, httpRetries - 1);
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        const text = await res.text();
        if (res.status === 400) {
          throw new BeProductValidationError(fullUrl, text, method, requestBodyStr);
        }
        throw new BeProductError(
          `API error ${res.status}: ${text}`,
          res.status,
          fullUrl,
          text,
          method,
          requestBodyStr,
        );
      }

      // 200: API contract is JSON. If the chunked stream gets reset mid-read
      // undici raises `TypeError("terminated")` — treat that the same as a
      // transport-layer error and retry. We don't try to salvage a partial
      // body for a 200 response: it isn't an authoritative payload, and
      // partials that happen to parse (e.g. `{"result":[]}` missing `total`)
      // can silently break pagination.
      try {
        return (await res.json()) as T;
      } catch (err) {
        if (networkAttempts < MAX_NETWORK_RETRIES) {
          networkAttempts++;
          const delayMs = 500 * Math.pow(2, networkAttempts - 1);
          if (process.env.BP_HTTP_DEBUG) {
            const cl = res.headers.get("content-length");
            const enc = res.headers.get("transfer-encoding");
            const conn = res.headers.get("connection");
            // eslint-disable-next-line no-console
            console.error(`[bp-http] body-read fail attempt ${networkAttempts} ${fullUrl} status=${res.status} cl=${cl} te=${enc} conn=${conn} err=${describeNetworkError(err)}`);
          }
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        throw new BeProductError(
          `body read error after ${MAX_NETWORK_RETRIES + 1} attempts: ${describeNetworkError(err)}`,
          res.status,
          fullUrl,
          undefined, // no authoritative body for a reset 200 response
          method,
          requestBodyStr,
        );
      }
    }
  }

  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): string {
    let url = `${this.baseUrl}/${path}`;
    if (params) {
      const filtered = Object.entries(params).filter(
        ([, v]) => v !== undefined,
      );
      if (filtered.length) {
        const sep = url.includes("?") ? "&" : "?";
        url += sep + new URLSearchParams(
          filtered.map(([k, v]) => [k, String(v)]),
        ).toString();
      }
    }
    return url;
  }

  private updateRateLimitState(headers: Headers): void {
    const limit = headers.get("X-RateLimit-Limit");
    const remaining = headers.get("X-RateLimit-Remaining");
    const reset = headers.get("X-RateLimit-Reset");

    if (limit && remaining && reset) {
      this.rateLimitState = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        resetAt: new Date(parseInt(reset, 10) * 1000),
      };
    }
  }

  private async preemptiveThrottle(): Promise<void> {
    if (
      this.rateLimitState &&
      this.rateLimitState.remaining <= 0 &&
      this.rateLimitState.resetAt.getTime() > Date.now()
    ) {
      const waitMs = this.rateLimitState.resetAt.getTime() - Date.now();
      if (waitMs > 0 && waitMs < 120_000) {
        await sleep(waitMs);
      }
    }
  }

  /** Returns true if should retry, throws if exhausted */
  private async handleThrottle(
    res: Response,
    attempt: number,
    url: string,
  ): Promise<boolean> {
    // Try header first
    let waitSeconds: number | undefined;
    const retryAfter = res.headers.get("Retry-After");
    if (retryAfter) {
      waitSeconds = parseInt(retryAfter, 10);
    }

    // Try body
    let window: string | undefined;
    let limit: number | undefined;
    try {
      const body = (await res.json()) as Record<string, unknown>;
      waitSeconds ??= body.retryAfterSeconds as number | undefined;
      window = body.window as string | undefined;
      limit = body.limit as number | undefined;
    } catch {
      // body may not be JSON
    }

    // Fallback to exponential backoff
    if (waitSeconds == null) {
      if (attempt >= FALLBACK_BACKOFF.length) {
        throw new BeProductThrottleError(url, undefined, window, limit);
      }
      waitSeconds = FALLBACK_BACKOFF[attempt];
    } else if (attempt >= 5) {
      throw new BeProductThrottleError(url, waitSeconds, window, limit);
    }

    await sleep(waitSeconds * 1000);
    return true;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
