import { describe, it, expect, vi, beforeEach } from "vitest";
import { HttpClient } from "../../src/http.js";
import { OAuth2TokenManager } from "../../src/auth.js";
import { BeProductError, BeProductThrottleError } from "../../src/errors.js";

function makeTokenManager() {
  const mgr = new OAuth2TokenManager({
    tokenEndpoint: "https://id.winks.io/ids/connect/token",
    clientId: "test",
    clientSecret: "test",
  });
  mgr.setAccessToken("test-token", 3600);
  return mgr;
}

function mockFetch(response: Partial<Response>) {
  const fn = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    headers: new Headers(),
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    ...response,
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("HttpClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("builds correct URL with params", async () => {
    const fetchFn = mockFetch({ json: () => Promise.resolve({ ok: true }) });
    const client = new HttpClient("https://api.test.com/api/co", makeTokenManager());

    await client.get("Style/Folders", { folderId: "abc" });
    expect(fetchFn).toHaveBeenCalledOnce();
    const url = fetchFn.mock.calls[0][0] as string;
    expect(url).toBe("https://api.test.com/api/co/Style/Folders?folderId=abc");
  });

  it("sends auth header", async () => {
    const fetchFn = mockFetch({ json: () => Promise.resolve({}) });
    const client = new HttpClient("https://api.test.com/api/co", makeTokenManager());

    await client.get("Test");
    const opts = fetchFn.mock.calls[0][1] as RequestInit;
    expect(opts.headers).toHaveProperty("Authorization", "Bearer test-token");
  });

  it("throws BeProductError on non-200", async () => {
    mockFetch({ ok: false, status: 404, text: () => Promise.resolve("Not found") });
    const client = new HttpClient("https://api.test.com/api/co", makeTokenManager());

    await expect(client.get("Missing")).rejects.toThrow(BeProductError);
  });

  it("parses rate limit headers", async () => {
    const headers = new Headers({
      "X-RateLimit-Limit": "60",
      "X-RateLimit-Remaining": "55",
      "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 60),
    });
    mockFetch({ headers, json: () => Promise.resolve({}) });

    const client = new HttpClient("https://api.test.com/api/co", makeTokenManager());
    await client.get("Test");

    expect(client.rateLimitState).not.toBeNull();
    expect(client.rateLimitState!.limit).toBe(60);
    expect(client.rateLimitState!.remaining).toBe(55);
  });

  it("handles missing rate limit headers gracefully", async () => {
    mockFetch({ json: () => Promise.resolve({}) });
    const client = new HttpClient("https://api.test.com/api/co", makeTokenManager());

    await client.get("Test");
    expect(client.rateLimitState).toBeNull();
  });

  it("throws BeProductThrottleError immediately on 429 (no retry/sleep)", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      // A large Retry-After must NOT cause the client to sleep — it surfaces as an error.
      headers: new Headers({ "Retry-After": "54000" }),
      json: () => Promise.resolve({ retryAfterSeconds: 54000, window: "1 hour", limit: 1000 }),
    });
    vi.stubGlobal("fetch", fetchFn);

    const client = new HttpClient("https://api.test.com/api/co", makeTokenManager());
    const err = await client.get("Test").catch((e) => e);

    expect(err).toBeInstanceOf(BeProductThrottleError);
    expect(err.retryAfterSeconds).toBe(54000);
    expect(err.window).toBe("1 hour");
    expect(err.limit).toBe(1000);
    // exactly one call — no retry loop
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("aborts a hung request after requestTimeoutMs and rejects", { timeout: 3000 }, async () => {
    vi.useFakeTimers();
    // fetch that never resolves on its own, but rejects when its signal aborts
    const fetchFn = vi.fn().mockImplementation((_url, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () =>
          reject((init.signal as AbortSignal).reason ?? new Error("aborted")),
        );
      });
    });
    vi.stubGlobal("fetch", fetchFn);

    const client = new HttpClient("https://api.test.com/api/co", makeTokenManager(), undefined, {
      requestTimeoutMs: 100,
    });
    const p = client.get("Slow");
    const assertion = expect(p).rejects.toThrow(BeProductError);
    await vi.runAllTimersAsync(); // drive the abort timeout + retry backoffs to completion
    await assertion;
    expect(fetchFn).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("passes a signal to fetch when a timeout is configured", async () => {
    const fetchFn = mockFetch({ json: () => Promise.resolve({}) });
    const client = new HttpClient("https://api.test.com/api/co", makeTokenManager(), undefined, {
      requestTimeoutMs: 5_000,
    });
    await client.get("Test");
    const opts = fetchFn.mock.calls[0][1] as RequestInit;
    expect(opts.signal).toBeInstanceOf(AbortSignal);
  });

  it("throws BeProductThrottleError on 429 without a Retry-After header", async () => {
    let calls = 0;
    const fetchFn = vi.fn().mockImplementation(() => {
      calls++;
      return Promise.resolve({
        ok: false,
        status: 429,
        headers: new Headers(),
        json: () => Promise.resolve({ window: "1 minute", limit: 60 }),
      });
    });
    vi.stubGlobal("fetch", fetchFn);

    const client = new HttpClient("https://api.test.com/api/co", makeTokenManager());
    await expect(client.get("Test")).rejects.toThrow(BeProductThrottleError);
    // throws on the first 429 — no retry loop
    expect(calls).toBe(1);
  });
});
