import { describe, it, expect, vi, beforeEach } from "vitest";
import { OAuth2TokenManager } from "../../src/auth.js";

describe("OAuth2TokenManager", () => {
  const config = {
    tokenEndpoint: "https://id.winks.io/ids/connect/token",
    clientId: "test-client",
    clientSecret: "test-secret",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns access token when set directly", async () => {
    const mgr = new OAuth2TokenManager(config);
    mgr.setAccessToken("direct-token", 3600);
    expect(await mgr.getAccessToken()).toBe("direct-token");
  });

  it("refreshes token when expired", async () => {
    const mgr = new OAuth2TokenManager(config);
    mgr.setRefreshToken("my-refresh");
    mgr.setAccessToken("old-token", -1); // already expired

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ access_token: "new-token", expires_in: 3600 }),
      }),
    );

    const token = await mgr.getAccessToken();
    expect(token).toBe("new-token");
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("coalesces concurrent refresh calls", async () => {
    const mgr = new OAuth2TokenManager(config);
    mgr.setRefreshToken("my-refresh");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ access_token: "shared-token", expires_in: 3600 }),
      }),
    );

    const [t1, t2, t3] = await Promise.all([
      mgr.getAccessToken(),
      mgr.getAccessToken(),
      mgr.getAccessToken(),
    ]);

    expect(t1).toBe("shared-token");
    expect(t2).toBe("shared-token");
    expect(t3).toBe("shared-token");
    expect(fetch).toHaveBeenCalledOnce(); // only one actual request
  });

  it("throws on refresh failure", async () => {
    const mgr = new OAuth2TokenManager(config);
    mgr.setRefreshToken("bad-refresh");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve("invalid_grant"),
      }),
    );

    await expect(mgr.getAccessToken()).rejects.toThrow("Token refresh failed");
  });
});
