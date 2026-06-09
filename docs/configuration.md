# Configuration

```ts
new BeProduct({
  // Authentication — pick one mode:
  //   (a) OAuth2 refresh-token flow (production):
  clientId: "...",
  clientSecret: "...",
  refreshToken: "...",
  //   (b) bring-your-own access token (test rigs / short-lived ops):
  // accessToken: "Bearer-eligible JWT",

  companyDomain: "bebrands",                                  // required
  publicApiUrl: "https://developers.beproduct.com",           // optional
  tokenEndpoint: "https://id.winks.io/ids/connect/token",     // optional
  additionalHeaders: { "X-Trace-Id": "abc-123" },             // optional
  requestTimeoutMs: 60_000,                                   // optional (default 60s)
  uploadTimeoutMs: 120_000,                                   // optional (default = requestTimeoutMs)
});
```

## Auth modes

### (a) Refresh-token flow — recommended

Long-lived integrations should use `clientId` + `clientSecret` +
`refreshToken`. The SDK lazily exchanges the refresh token for a short-lived
access token on the first request, caches it, and refreshes again either
when the cached token nears expiry or when a request comes back `401`.

Refresh is **happens-before-once**: a single in-flight refresh promise is
shared across concurrent requests, so a burst of parallel calls during a
token expiry produces exactly one round-trip to the auth server, not N.

The refresh token itself **rotates** on every successful exchange. The SDK
keeps the new one in memory; if your process restarts and the original
refresh token has been rotated server-side, you'll need to reissue a fresh
one. Persist the refresh token alongside the integration record if your
client lives across restarts.

### (b) Bring-your-own access token

Useful for test rigs, debugging from the dev tools, or short-lived
operations where an access token is already in hand:

```ts
const bp = new BeProduct({
  accessToken: "eyJ0eXAiOiJKV1QiLCJh...",
  companyDomain: "bebrands",
});
```

The token is sent as `Authorization: Bearer <token>` on every request.
There's no refresh logic, so once the token expires every call returns
`401`.

### Switching auth at runtime

```ts
import { OAuth2TokenManager } from "beproduct";

const tm = new OAuth2TokenManager({
  tokenEndpoint: "https://id.winks.io/ids/connect/token",
  clientId, clientSecret,
});
tm.setRefreshToken("...");
const accessToken = await tm.getAccessToken();
```

## Required options

### `companyDomain`

Your BeProduct tenant slug. The base URL becomes
`${publicApiUrl}/api/${companyDomain}`. If your BeProduct UI is at
`https://bebrands.beproduct.com`, use `"bebrands"`.

A wrong domain produces `404` on every endpoint with no error body — the
gateway routes by host before the API can validate anything.

## Optional overrides

### `publicApiUrl`

Defaults to `https://developers.beproduct.com`. Override for staging or for
running against a self-hosted environment.

### `tokenEndpoint`

Defaults to `https://id.winks.io/ids/connect/token`. Only needs an override
if your tenant uses a non-standard identity provider.

### `additionalHeaders`

Merged into every request after `Authorization` and `Content-Type`. Useful
for `X-Trace-Id`, internal feature flags, or any custom header your gateway
expects. Auth and content-type headers always win on conflict.

```ts
const bp = new BeProduct({
  // ...
  additionalHeaders: {
    "X-Trace-Id": req.headers["x-trace-id"] ?? randomUUID(),
    "X-App-Version": pkg.version,
  },
});
```

### `requestTimeoutMs` / `uploadTimeoutMs`

A single request that stalls past `requestTimeoutMs` is aborted (via
`AbortController`) and surfaced as a transport error — which the retry
machinery treats like any other network failure (see
[Errors & retries](errors-and-retries.md)). Without this a dead/half-open
connection would hang the call **forever**, since `fetch` has no built-in
timeout.

- **`requestTimeoutMs`** — applies to regular GET/POST/DELETE **and** the
  OAuth token refresh. Default **`60_000`** (1 min). Set to `0` to disable.
- **`uploadTimeoutMs`** — applies to multipart uploads (images, 3D assets).
  Defaults to `requestTimeoutMs`; bump it when uploading large files.

```ts
const bp = new BeProduct({
  // ...
  requestTimeoutMs: 60_000,    // abort a hung request after 1 min
  uploadTimeoutMs: 120_000,    // allow longer for big image/3D uploads
});
```

> Both are **optional and backward-compatible** — existing code needs no
> change. The only behavioral shift on upgrade is that a request which used
> to hang indefinitely now aborts (and retries) after 60s.

## Inspecting auth state

You usually don't need this, but the manager is exposed:

```ts
const tm = bp.raw.tokenManager;          // OAuth2TokenManager
const at = await tm.getAccessToken();    // forces a refresh if needed
```

## Rate-limit state

Read-only snapshot of the latest rate-limit headers we saw:

```ts
console.log(bp.raw.rateLimitState);
// → { limit: 10000, remaining: 9743, resetAt: 2024-09-12T12:00:00.000Z } | null
```

Useful for adaptive scheduling. See
[Errors & retries](errors-and-retries.md#throttling) for how the SDK uses
this internally.
