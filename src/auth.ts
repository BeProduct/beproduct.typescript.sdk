export interface TokenManagerConfig {
  tokenEndpoint: string;
  clientId: string;
  clientSecret: string;
  /** Abort the token request if it stalls past this many ms. Default 60_000. */
  timeoutMs?: number;
}

export class OAuth2TokenManager {
  private accessToken: string | null = null;
  private tokenExpires = -1;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor(private readonly config: TokenManagerConfig) {}

  setRefreshToken(token: string): void {
    this.refreshToken = token;
  }

  setAccessToken(token: string, expiresInSeconds?: number): void {
    this.accessToken = token;
    this.tokenExpires = expiresInSeconds
      ? Date.now() + expiresInSeconds * 1000
      : Date.now() + 86_400_000; // 24h default
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpires > Date.now()) {
      return this.accessToken;
    }
    // Coalesce concurrent refresh calls
    if (!this.refreshPromise) {
      this.refreshPromise = this.doRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  private async doRefresh(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.refreshToken,
      grant_type: "refresh_token",
    });

    const timeoutMs = this.config.timeoutMs ?? 60_000;
    const controller = new AbortController();
    const timer = timeoutMs > 0
      ? setTimeout(() => controller.abort(new DOMException(`token request timed out after ${timeoutMs}ms`, "TimeoutError")), timeoutMs)
      : undefined;
    let res: Response;
    try {
      res = await fetch(this.config.tokenEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: controller.signal,
      });
    } finally {
      if (timer) clearTimeout(timer);
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Token refresh failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as Record<string, unknown>;

    this.accessToken = data.access_token as string;

    if (typeof data.expires_in === "number") {
      // 5 min buffer before actual expiry
      this.tokenExpires = Date.now() + (data.expires_in - 300) * 1000;
    }

    if (typeof data.refresh_token === "string") {
      this.refreshToken = data.refresh_token;
    }

    return this.accessToken;
  }
}
