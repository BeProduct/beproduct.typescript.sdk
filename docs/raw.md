# Raw escape hatch

`bp.raw` is the underlying `HttpClient`, keyed against
`${publicApiUrl}/api/${companyDomain}`. Use it when an endpoint isn't
covered by a typed resource yet, for one-off probes, or to call something
the API exposes but the SDK hasn't wrapped.

```ts
// GET — params become query string
const r1 = await bp.raw.get<MyResp>("Style/Folders");
const r2 = await bp.raw.get<MyResp>("Style/Search", { skip: 0, take: 100 });

// POST — body + optional query string
const r3 = await bp.raw.post<MyResp>(
  "Style/Search",
  { filters: [{ field: "ModifiedAt", operator: "Gt", value: "2024-01-01T00:00:00Z" }] },
  { take: 100, skip: 0 },   // ← becomes ?take=100&skip=0
);

// PUT / DELETE
await bp.raw.delete(`Style/${headerId}`);
```

## The argument order trap

The 4th argument to `post()` (and 2nd to `get()`) is **always the query
string**. Body fields go in the 3rd position. Mixing those up is the most
common mistake — some BeProduct endpoints quietly default a missing query
parameter rather than rejecting the call, so a body field placed in the
wrong slot can return wrong-but-shaped-ok data.

| Method | 1st arg | 2nd arg | 3rd arg |
|---|---|---|---|
| `get(path, params?)` | URL path | query string | — |
| `post(path, body?, params?)` | URL path | JSON body | query string |
| `put(path, body?, params?)` | URL path | JSON body | query string |
| `delete(path, params?)` | URL path | query string | — |

## Path style

Paths are **relative** to the tenant base URL (the SDK joins them).

- ✅ `"Style/Folders"`
- ✅ `"Style/Search"`
- ✅ `"Tracking/Plan/${planId}/Style/Timeline"`
- ❌ `"/api/bebrands/Style/Folders"` (don't double up the prefix)
- ❌ `"https://developers.beproduct.com/..."` (raw won't go to a different host)

## Pagination

`bp.raw` returns whatever the server returns. To stream a paginated
endpoint via raw, wrap it in [`paginate`](pagination.md#2-paginatepagesize-fetchpage--result-total-envelopes)
or `paginateArray`:

```ts
import { paginate } from "beproduct";

for await (const item of paginate<MyItem>(100, async (size, page) => {
  return bp.raw.post<{ result: MyItem[]; total: number }>(
    "Some/Endpoint",
    { /* body */ },
    { pageSize: size, pageNumber: page },
  );
})) { /* … */ }
```

## Error handling

`bp.raw` participates in the same retry / throttle / refresh logic as the
typed resources. Errors thrown are the same three classes documented in
[Errors & retries](errors-and-retries.md).

## When NOT to use raw

If a typed resource exists for what you're trying to do, prefer it — you
get the response shape, the iterator, and the schema-validated payloads
for free. Reach for `bp.raw` only when:

- The endpoint isn't wrapped (most are)
- You're prototyping an integration and want fast iteration
- You're hitting a custom internal endpoint your tenant exposes
- The typed resource exists but doesn't yet take the parameter you need
  (file an issue and use raw in the meantime)
