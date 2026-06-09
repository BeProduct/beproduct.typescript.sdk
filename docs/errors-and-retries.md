# Errors and retries

The SDK surfaces three error classes plus has built-in retry behaviour for
transport blips and 5xx gateway errors. Network/5xx errors are retried for
you; **rate-limit (429) responses are not** — they throw
`BeProductThrottleError` immediately so the caller decides how to back off.
Business retries (idempotent ops the customer might want to repeat) are still
on you.

## Error classes

| Class | When it's thrown |
|---|---|
| `BeProductError` | Any non-2xx that isn't 400/429, plus exhausted network/body retries |
| `BeProductValidationError` | 400 with a JSON validation body |
| `BeProductThrottleError` | a `429` rate-limit response — thrown immediately (the SDK does **not** retry or sleep) |

All three carry replay context:

```ts
class BeProductError extends Error {
  statusCode: number;     // HTTP status, or 0 for transport-layer failures
  url: string;            // full URL with query string
  responseBody?: string;  // server's response body (truncated nowhere)
  method?: string;        // "GET" / "POST" / etc.
  requestBody?: string;   // JSON-stringified body we sent
}
```

Replaying a failed call with curl is `(method, url, requestBody)` plus
the bearer token.

## Catching

```ts
import { BeProductError, BeProductValidationError } from "beproduct";

try {
  await bp.style.create(folderId, { headerName: "..." });
} catch (err) {
  if (err instanceof BeProductValidationError) {
    console.error("invalid input:", err.responseBody);
    return;
  }
  if (err instanceof BeProductError) {
    console.error(`API error ${err.statusCode} on ${err.url}: ${err.responseBody}`);
    return;
  }
  throw err;     // unknown — re-raise so observability sees it
}
```

## Network-level failures

`fetch()` itself throws `TypeError("fetch failed")` for DNS / ECONNRESET /
connect-timeout / TLS errors. The SDK retries transport errors **3 times**
with a 0.5 / 1 / 2 s backoff, then surfaces a `BeProductError` whose:

- `statusCode` is `0`
- `responseBody` contains the cause chain (e.g. `UND_ERR_CONNECT_TIMEOUT:
  Connect Timeout Error (attempted address: developers.beproduct.com:443,
  timeout: 10000ms)`)
- `message` is `network error after 4 attempts: <chain>`

Retries happen for the initial connect and for body-read errors mid-stream
(some BeProduct endpoints commit `200 OK` then reset the chunked body —
indistinguishable from a transport reset from the client).

## Request timeout

Each request is aborted if the server hasn't responded within
`requestTimeoutMs` (default **5 minutes**; `uploadTimeoutMs` covers multipart
uploads and defaults to the same value). A timeout aborts the underlying
`fetch`, which is then treated as a transport error — retried up to 3×, then
surfaced as a `BeProductError` with `statusCode: 0`. Override per client, or
set to `0` to disable:

```ts
const bp = new BeProduct({ companyDomain, /* … */ requestTimeoutMs: 30_000 });
```

## Transient HTTP statuses

`502`, `503`, `504` are retried with the same 3-attempt 0.5 / 1 / 2 s
backoff. The retried request lands as a fresh attempt on the
load-balancer, which usually picks a different healthy backend.

`401` triggers a token refresh + one retry — the SDK assumes the cached
access token expired between the rate-limit check and the wire. Repeated
401s after refresh surface as a `BeProductError`.

## Throttling

Every response carries `X-RateLimit-Limit` / `X-RateLimit-Remaining` /
`X-RateLimit-Reset` (Unix-seconds reset time). The SDK tracks them on the
`HttpClient` and:

- **Pre-emptively** sleeps before a request when the last response reported
  `remaining === 0` and `resetAt` is in the future — capped at 120 s; longer
  waits are skipped so the caller isn't blocked.
- On a `429`, **throws `BeProductThrottleError` immediately** — it does *not*
  sleep on `Retry-After` and does *not* retry. (Honouring an arbitrarily large
  `Retry-After` could otherwise block the process for minutes or hours.) The
  error carries `retryAfterSeconds` / `window` / `limit` (parsed from the
  `Retry-After` header or the response body) so you can schedule your own
  backoff.

```ts
import { BeProductThrottleError } from "beproduct";
try { /* ... */ }
catch (err) {
  if (err instanceof BeProductThrottleError) {
    console.warn(`throttled — retry after ${err.retryAfterSeconds}s, window=${err.window}, limit=${err.limit}`);
    // back off the whole pipeline, or schedule a retry past the reset
  }
}
```

A live snapshot of all rate-limit windows is available via
`bp.raw.getRateLimitStatus()` (`GET ratelimit/status`), which returns the
`per_minute` / `per_hour` / `per_day` policies with `limit` / `remaining` /
`used` / `resetAt`.

The current rate-limit snapshot is on `bp.raw.rateLimitState`:

```ts
console.log(bp.raw.rateLimitState);
// { limit: 10000, remaining: 9743, resetAt: 2024-09-12T12:00:00.000Z } | null
```

Useful for adaptive scheduling — if you're running multiple workers, share
this state and stop pulling fresh work when `remaining` drops below a
safety floor.

## Pre-flight cancellation

The SDK doesn't take an `AbortSignal` today. If you need to cancel a
long-running iterator, `break` out of the `for await` loop — the next
fetch won't fire.

## Logging the failed call

For triage in the run-detail page or in pino logs, log the replay tuple:

```ts
this.logger.warn(
  {
    err: `${err.name}: ${err.message}`,
    method: err.method,
    url: err.url,
    requestBody: err.requestBody,
    statusCode: err.statusCode,
    responseBody: err.responseBody?.slice(0, 500),
  },
  "request failed",
);
```

That's enough to reproduce the call with `curl -X $method '$url' -H
'Authorization: Bearer …' -H 'Content-Type: application/json' -d $requestBody`.
