# `beproduct` — TypeScript SDK for the BeProduct PLM Public API

Typed, ESM-first client for the [BeProduct Public API](https://developers.beproduct.com).
Wraps the OAuth2 refresh-token flow, paginated endpoints, schema parsing, and
the long tail of resource-specific helpers (BOM, colorways, data tables,
sample requests, tracking plans, …).

> **Status:** internal — distributed via workspace path / private registry.
> Used in production by [`sidekick.typescript`](../sidekick.typescript) and
> [`dataflow-typescript`](../dataflow-typescript).

---

## Install

```bash
# in a sibling repo (workspace setup)
"beproduct": "file:../beproduct.sdk"

# or via internal npm registry
npm install beproduct
```

The package is ESM-only by default but ships a CJS build for legacy callers.
Requires Node 18+ (uses native `fetch` / `undici`).

---

## Quick start

```ts
import { BeProduct } from "beproduct";

const bp = new BeProduct({
  clientId: process.env.BEPRODUCT_CLIENT_ID!,
  clientSecret: process.env.BEPRODUCT_CLIENT_SECRET!,
  refreshToken: process.env.BEPRODUCT_REFRESH_TOKEN!,
  companyDomain: "bebrands",            // required — your tenant domain
});

// 1. List the first page of styles
const styles = await bp.style.list({ pageSize: 50 }).next();
console.log(styles.value);              // first page

// 2. Iterate every style modified since some date
for await (const raw of bp.style.list({
  pageSize: 50,
  filters: [{ field: "ModifiedAt", operator: "Gt", value: "2024-01-01T00:00:00Z" }],
  showDeleted: false,
})) {
  console.log(raw.id, raw.headerName);
}

// 3. Reach a typed resource directly
const folders = await bp.style.folders();
const userPage = await bp.user.list();

// 4. Drop down to the raw HTTP layer for unsupported endpoints
const data = await bp.raw.post("sync/syncpages",
  { headerIds: [...], applicationIds: [...], template: "Form", since: "2024-01-01T00:00:00Z" },
  { take: 100, skip: 0, folder: "Material" },
);
```

---

## Configuration

```ts
new BeProduct({
  // Authentication — pick one mode:
  //   (a) OAuth2 refresh-token flow:
  clientId: "...",
  clientSecret: "...",
  refreshToken: "...",
  //   (b) bring-your-own access token (test rigs, short-lived ops):
  // accessToken: "Bearer-eligible JWT",

  // Required:
  companyDomain: "bebrands",            // your BeProduct tenant slug

  // Optional overrides — defaults work for almost every deployment:
  publicApiUrl: "https://developers.beproduct.com",
  tokenEndpoint: "https://id.winks.io/ids/connect/token",
  additionalHeaders: { "X-Trace-Id": "..." },
});
```

### How auth works

`OAuth2TokenManager` lazily exchanges the refresh token for a short-lived
access token on the first request, caches it, and refreshes on the next 401
or when the cached token nears expiry. Refresh is happens-before-once: a
single in-flight refresh promise is shared across concurrent requests.

You generally don't need to touch the manager directly. If you do (e.g. tests):

```ts
import { OAuth2TokenManager } from "beproduct";
const tm = new OAuth2TokenManager({ tokenEndpoint, clientId, clientSecret });
tm.setRefreshToken("...");
await tm.getAccessToken();
```

---

## Resources

The `BeProduct` instance exposes one resource per top-level area of the API:

| Property        | Class                  | Covers                                                    |
| --------------- | ---------------------- | --------------------------------------------------------- |
| `bp.style`      | `StyleResource`        | Styles, colorways, BOM, sets, sample requests, points-of-measure |
| `bp.material`   | `MaterialResource`     | Materials, colorways, attribute schema                    |
| `bp.color`      | `ColorResource`        | Color library, swatches, cores                            |
| `bp.block`      | `BlockResource`        | Block library                                             |
| `bp.image`      | `ImageResource`        | Image entities                                            |
| `bp.tracking`   | `TrackingResource`     | Tracking plans, timelines, requests, views                |
| `bp.directory`  | `DirectoryResource`    | Companies + contacts (the directory)                      |
| `bp.user`       | `UserResource`         | Internal user roster                                      |
| `bp.dataTables` | `DataTableResource`    | Reference data tables                                     |
| `bp.masterData` | `MasterDataResource`   | Master-data field definitions (form/grid/list)            |
| `bp.raw`        | `HttpClient`           | Escape hatch for endpoints not covered by a resource      |

Every resource constructor takes the shared `HttpClient`, so pagination,
auth refresh, throttling, and rate-limit tracking are uniform across them.

---

## Pagination

Most list endpoints return paged results. The SDK offers three flavours:

### 1. Per-resource async iterators (preferred)

```ts
for await (const style of bp.style.list({ pageSize: 50, filters: [...] })) {
  // each iteration yields one entity, even though the SDK fetches a page at a time
}
```

This is what 95% of code uses. Pass `pageSize`, `filters`, `showDeleted`, etc.;
the iterator handles the page boundary for you and stops cleanly when the
last page is shorter than `pageSize`.

### 2. `paginate(pageSize, fetchPage)` — for `{ result, total }` envelopes

The standard BeProduct list response shape is `{ result: T[], total: number }`.
For callers that want to wrap a custom URL, `paginate()` keeps fetching pages
until the cumulative count covers `total`.

```ts
import { paginate } from "beproduct";

for await (const item of paginate<MyItem>(100, async (size, page) => {
  return bp.raw.post<{ result: MyItem[]; total: number }>(
    "Some/Endpoint",
    { /* body */ },
    { pageSize: size, pageNumber: page },
  );
})) {
  // ...
}
```

### 3. `paginateArray(pageSize, fetchPage)` — for plain `T[]` responses

Some endpoints (notably directory search and the contacts list) return a
flat array, not the `{ result, total }` envelope. `paginateArray` keeps
calling until a short page (`< pageSize`) signals the end.

```ts
import { paginateArray } from "beproduct";

for await (const company of paginateArray<DirectoryCompany>(100, (size, page) =>
  bp.raw.post(`Directory/Companies`, { filters: [] }, { pageSize: size, pageNumber: page }),
)) { /* ... */ }
```

### 4. `collectAll(generator)` — drain to an array

```ts
import { collectAll } from "beproduct";
const allUsers = await collectAll(bp.user.list());
```

---

## Filtering

`filters: SearchFilter[]` is supported on every list endpoint. The shape is
`{ field, operator, value }` matching BeProduct's server-side filter DSL:

```ts
import type { SearchFilter } from "beproduct";

const filters: SearchFilter[] = [
  { field: "ModifiedAt", operator: "Gt", value: "2024-09-01T00:00:00Z" },
  { field: "Status",     operator: "Eq", value: "Active" },
];
for await (const s of bp.style.list({ filters, pageSize: 50 })) { /* … */ }
```

The `dictToFilters(obj)` helper converts a plain object into the array form:

```ts
import { dictToFilters } from "beproduct";
const filters = dictToFilters({ Status: "Active", ModifiedAt_Gt: "..." });
```

---

## Schema parsing

Header data comes from BeProduct as nested objects with mixed casing
(`headerName`, `header_name`, `Folder`, `folder`, …). Resources expose a
parser-friendly shape but if you go through `bp.raw`, normalize via:

```ts
import { parseHeader, parseStyle, parseMaterial, parseAppList } from "beproduct";

const flat = parseHeader(rawHeader);   // common header fields
const style = parseStyle(rawStyle);     // style-specific (colorways, default size range, …)
const mat   = parseMaterial(rawMat);
```

`parseAppList` is the helper for paged app data inside style/material
endpoints (sets, requests, etc.).

---

## Raw escape hatch

`bp.raw` is the underlying `HttpClient` keyed against `${publicApiUrl}/api/${companyDomain}`.
Use it when an endpoint isn't covered by a resource (yet), for one-off probes,
or for endpoints with non-standard signatures (`/sync/syncpages`,
`Style/Apps/Form/{appId}/{headerId}`, etc.).

```ts
// GET — params become query string
const r = await bp.raw.get<MyResp>("Style/Folders");
const r2 = await bp.raw.get<MyResp>("Style/Search", { skip: 0, take: 100 });

// POST — body + optional query string
const r3 = await bp.raw.post<MyResp>(
  "sync/syncpages",
  { headerIds, applicationIds, template: "Form", since },
  { take: 100, skip: 0, folder: "Material" },   // ← becomes ?take=100&skip=0&folder=Material
);

// PUT / DELETE / PATCH — same shape
await bp.raw.delete(`Style/${headerId}`);
```

The 4th argument to `post()` (and 2nd to `get()`) is **always the query
string**. Body fields go in the 3rd position. Mixing those up is the most
common mistake — see the comment in
`sidekick.typescript/src/modules/sync-apps.ts` where `folder=Material` had
to be moved out of the body before BeProduct started returning material
app data.

---

## Errors

Three error classes carry the upstream context:

| Class                       | When it's thrown                           |
| --------------------------- | ------------------------------------------ |
| `BeProductError`            | Any non-2xx that isn't 400/429              |
| `BeProductValidationError`  | 400 with a JSON validation body             |
| `BeProductThrottleError`    | 429 after the SDK exhausts its built-in retries |

```ts
import { BeProductError, BeProductValidationError } from "beproduct";

try {
  await bp.style.create(folderId, { ... });
} catch (err) {
  if (err instanceof BeProductValidationError) {
    console.error("invalid input:", err.responseBody);
  } else if (err instanceof BeProductError) {
    console.error(`API error ${err.statusCode} on ${err.url}: ${err.responseBody}`);
  } else {
    throw err;   // unknown — likely a transport-level network error
  }
}
```

### Network-level failures

`fetch()` itself can throw `TypeError("fetch failed")` for DNS/ECONNRESET/connect
timeouts. The SDK retries these up to 3 times with 0.5/1/2 s exponential
backoff and then throws a `BeProductError` with status `0` whose `responseBody`
contains the underlying cause chain (e.g. `UND_ERR_CONNECT_TIMEOUT: Connect
Timeout Error (attempted address: developers.beproduct.com:443, timeout: 10000ms)`).
Callers don't need to retry network errors themselves; bake business retry
into idempotent operations only.

### Throttling

The HTTP client tracks the rate-limit headers on every response (`X-RateLimit-Limit`,
`X-RateLimit-Remaining`, `X-RateLimit-Reset`) and pre-emptively backs off
when the bucket is nearly empty. On a 429 it honours `Retry-After` (or falls
back to a `[1, 3, 5, 15, 30]` second ladder) up to a few attempts before
surfacing `BeProductThrottleError`. You can read the current state via
`bp.raw.rateLimitState`.

---

## File uploads

For multipart endpoints the SDK accepts a `FileInput` shape:

```ts
import { type FileInput } from "beproduct";

const file: FileInput = {
  filepath: "/abs/path/to/swatch.png",   // or
  // fileUrl: "https://…",                // or
  // buffer: Buffer.from(bytes),
  filename: "swatch.png",
  size: 1024,
};
await bp.style.colorwayUpload(headerId, colorwayId, file);
```

The internal upload helper streams from disk / fetches the URL / accepts a
buffer; one of `filepath` / `fileUrl` / `buffer` is required.

---

## Compatibility & paths

Common gotchas:

- **Tenant domain matters**: `companyDomain` must match the slug in your
  BeProduct subdomain. The base URL becomes `${publicApiUrl}/api/${companyDomain}`.
- **Master folder param on `/sync/syncpages`**: defaults to `Style` server-side.
  Pass `folder=Material` / `Image` / `Color` in the **query string** when
  syncing those.
- **`/Style/folderPages/{folderId}`**: works for any master folder — the
  server route is folder-agnostic. Use `bp.style.folderPages(folderId)`
  even for material/color.
- **Paginated endpoints with flat-array responses** (Directory/Companies,
  Directory/Contacts) need `paginateArray`, not `paginate`.

---

## Development

```bash
# install deps
npm install

# typecheck
npm run typecheck

# run unit tests
npm test

# integration tests (requires real credentials in .env)
BEPRODUCT_INTEGRATION=1 npm run test:integration

# build dist/{index.js,index.cjs,index.d.ts}
npm run build
```

Source layout:

```
src/
├── client.ts          # public BeProduct class
├── http.ts            # HttpClient — auth, rate limit, retry, multipart
├── auth.ts            # OAuth2TokenManager
├── pagination.ts      # paginate / paginateArray / collectAll
├── helpers.ts         # parseHeader / parseStyle / dictToFilters
├── errors.ts          # BeProductError + Validation + Throttle
├── resources/         # one file per resource (style, material, …)
└── schemas/           # Zod schemas for response/request bodies
```

Adding a new resource:

1. Drop `src/resources/<thing>.ts` exporting a class with constructor `(http: HttpClient)`.
2. Wire it into `src/client.ts` as a public field on `BeProduct`.
3. Re-export the class from `src/index.ts`.
4. (Optional) Add Zod schemas under `src/schemas/<thing>.ts` for typed input/output.

---

## License

MIT.
