# Pagination

BeProduct list endpoints are paged, and the SDK gives you four ways to
consume them.

## 1. Per-resource async iterators (preferred)

Every resource that lists entities exposes an async generator. You pass
`pageSize` and optional `filters`; the generator fetches a page, yields
each row, then fetches the next page automatically. Stops cleanly when the
last page is shorter than `pageSize`.

```ts
for await (const style of bp.style.list({
  pageSize: 50,
  filters: [{ field: "Status", operator: "Eq", value: "Active" }],
})) {
  console.log(style.id, style.headerName);
}
```

This works the same for `bp.material.list`, `bp.color.list`,
`bp.image.list`, `bp.block.list`, `bp.tracking.planList`,
`bp.tracking.styleTimelineList`, `bp.directory.search`,
`bp.dataTables.list`, etc.

### Stopping early

The iterator is just an async generator — `break` works, and the SDK won't
fetch additional pages after you exit the loop:

```ts
for await (const s of bp.style.list({ pageSize: 50 })) {
  if (s.headerNumber === target) {
    found = s;
    break;          // no further requests fired
  }
}
```

### Page-size tuning

The default is usually `20` — fine for interactive code, slow for bulk.
For long sweeps push `pageSize` up (`100`–`200`) but keep an eye on
response sizes — some endpoints (notably tracking views) return chunked
responses that the upstream gateway may reset on large payloads.

## 2. `paginate(pageSize, fetchPage)` — `{ result, total }` envelopes

The standard BeProduct list response shape is `{ result: T[], total: number }`.
For callers wrapping a custom URL via [`bp.raw`](raw.md), `paginate()` keeps
fetching pages until cumulative count covers `total`:

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

Includes a built-in safety: if `total > 0` but a page comes back empty,
the loop breaks instead of hammering a misbehaving endpoint forever.

## 3. `paginateArray(pageSize, fetchPage)` — flat-array responses

Some endpoints (notably `Directory/Companies` and `Directory/Contacts`)
return a plain `T[]` rather than `{ result, total }`. `paginateArray`
keeps calling until a short page (`< pageSize`) signals the end:

```ts
import { paginateArray, type DirectoryCompany } from "beproduct";

for await (const company of paginateArray<DirectoryCompany>(100, (size, page) =>
  bp.raw.post(`Directory/Companies`, { filters: [] }, { pageSize: size, pageNumber: page }),
)) {
  // ...
}
```

If you're using `bp.directory.search` or `bp.directory.contactList`, those
already wrap `paginateArray` for you.

## 4. `collectAll(generator)` — drain to an array

```ts
import { collectAll } from "beproduct";
const allUsers = await collectAll(bp.user.list());        // small, fits in memory
const folders   = await collectAll(bp.style.folders());   // already an array, but works for any iterator
```

Don't `collectAll` an unbounded list — at 50k+ rows you'll OOM. Use the
async iterator and stream-process instead.

## When to use which

| Scenario | Helper |
|---|---|
| Loop one entity at a time | per-resource iterator |
| Wrap a `{result, total}` endpoint with `bp.raw` | `paginate` |
| Wrap a flat-array endpoint (`Directory/*`) | `paginateArray` |
| Need an array of everything (small) | `collectAll(iterator)` |
| Need just the first page | `await iterator.next()` |
