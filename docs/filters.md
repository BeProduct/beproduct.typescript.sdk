# Filtering

Every list endpoint accepts `filters: SearchFilter[]`. Each filter is
`{ field, operator, value }`, mirroring BeProduct's server-side filter DSL.

```ts
import type { SearchFilter } from "beproduct";

const filters: SearchFilter[] = [
  { field: "ModifiedAt", operator: "Gt", value: "2024-09-01T00:00:00Z" },
  { field: "Status",     operator: "Eq", value: "Active" },
];
for await (const s of bp.style.list({ filters, pageSize: 50 })) { /* … */ }
```

Filters within an array are AND-ed. The SDK doesn't enforce the operator
set — that's a server-side decision — but the table below covers the
operators that work in practice across every endpoint.

## Operators

| Operator | Meaning | Example |
|---|---|---|
| `Eq` | equal | `{ field: "Status", operator: "Eq", value: "Active" }` |
| `NotEq` | not equal | `{ field: "Status", operator: "NotEq", value: "Archived" }` |
| `Gt` | greater than | `{ field: "ModifiedAt", operator: "Gt", value: "2024-01-01T00:00:00Z" }` |
| `Gte` | greater-or-equal | `{ field: "ModifiedAt", operator: "Gte", value: since.toISOString() }` |
| `Lt` | less than | `{ field: "CreatedAt", operator: "Lt", value: "2023-01-01T00:00:00Z" }` |
| `Lte` | less-or-equal | |
| `Contains` | substring match (text) | `{ field: "HeaderName", operator: "Contains", value: "tee" }` |
| `In` | value in a set | `{ field: "Id", operator: "In", value: [id1, id2, id3] }` |
| `NotIn` | value not in a set | |

`In` / `NotIn` take an array `value`; everything else takes a scalar.

## Field names

Field names are **case-sensitive** and match the upstream API's PascalCase:
`ModifiedAt`, `CreatedAt`, `HeaderName`, `HeaderNumber`, `Status`,
`Folder` (for folder id), etc. Custom attribute fields use their schema id
(usually a sanitized lowercase form — query the schema once via
`folderSchema(folderId)` to see exact ids).

## `dictToFilters` — shorthand for plain objects

When your filter set is built from a config / query string, the dict form
is more convenient than constructing the array by hand:

```ts
import { dictToFilters } from "beproduct";

const filters = dictToFilters({
  Status: "Active",
  ModifiedAt_Gt: "2024-01-01T00:00:00Z",
  HeaderName_Contains: "tee",
});
//
// → [
//     { field: "Status",     operator: "Eq",       value: "Active" },
//     { field: "ModifiedAt", operator: "Gt",       value: "2024-01-01T00:00:00Z" },
//     { field: "HeaderName", operator: "Contains", value: "tee" },
//   ]
```

The convention is `<Field>_<Operator>` for non-`Eq` filters; bare keys are
treated as `Eq`.

## Typical patterns

### Cursor-based incremental sync

```ts
const since = lastSyncedAt;     // ISO date string from your store
const filters: SearchFilter[] = since
  ? [{ field: "ModifiedAt", operator: "Gte", value: since }]
  : [];
for await (const s of bp.style.list({ filters, pageSize: 100 })) {
  // process; advance lastSyncedAt to max(s.modifiedAt) when done
}
```

### Surviving deleted rows

```ts
for await (const s of bp.style.list({ showDeleted: true, pageSize: 100 })) {
  if (s.deleted) {
    /* tombstone — soft delete from your warehouse */
  }
}
```

### Filtering colorways inside a style list

The style list endpoint additionally accepts `colorwayFilters` to narrow
the colorways returned per header:

```ts
for await (const s of bp.style.list({
  filters: [{ field: "Status", operator: "Eq", value: "Active" }],
  colorwayFilters: [{ field: "ColorNumber", operator: "Contains", value: "Pantone" }],
  pageSize: 50,
})) { /* … */ }
```

## Server gotchas

- The API quietly ignores filters on fields it doesn't recognise — a
  typo in the field name silently returns the unfiltered set. Verify
  filter behaviour with a known-narrow query before relying on it.
- Date filters expect ISO-8601 with `Z` suffix. Local-time strings will
  be misparsed.
- `Contains` is case-insensitive on most string fields but case-sensitive
  on a handful of legacy ones — test before depending on either.
