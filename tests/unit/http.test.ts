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

  it("retries on 429 with Retry-After header", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ "Retry-After": "0" }),
        json: () => Promise.resolve({ error: "Rate limit exceeded", retryAfterSeconds: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ data: "success" }),
      });
    vi.stubGlobal("fetch", fetchFn);

    const client = new HttpClient("https://api.test.com/api/co", makeTokenManager());
    const result = await client.get("Test");

    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: "success" });
  });

  it("throws BeProductThrottleError after exhausting retries", async () => {
    // Use Retry-After: 0 so sleep is instant, but exhaust after 6 attempts
    let calls = 0;
    const fetchFn = vi.fn().mockImplementation(() => {
      calls++;
      return Promise.resolve({
        ok: false,
        status: 429,
        headers: new Headers({ "Retry-After": "0" }),
        json: () => Promise.resolve({ error: "Rate limit exceeded", retryAfterSeconds: 0, window: "1 minute", limit: 60 }),
      });
    });
    vi.stubGlobal("fetch", fetchFn);

    const client = new HttpClient("https://api.test.com/api/co", makeTokenManager());
    await expect(client.get("Test")).rejects.toThrow(BeProductThrottleError);
    // Should have retried 6 times (initial + 5 retries) before throwing
    expect(calls).toBe(6);
  });
});
