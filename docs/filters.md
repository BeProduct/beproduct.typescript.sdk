# Filtering

Every list endpoint accepts `filters: SearchFilter[]`. Each filter is
`{ field, operator, value }`, mirroring BeProduct's server-side filter DSL.

```ts
import type { SearchFilter } from "beproduct";

const filters: SearchFilter[] = [
  { field: "ModifiedAt",    operator: "Gt", value: "2024-09-01T00:00:00Z" },
  { field: "header_number", operator: "Eq", value: "STYLE-001" },
];
for await (const s of bp.style.list({ filters, pageSize: 50 })) { /* … */ }
```

Filters within an array are AND-ed. The SDK doesn't enforce the operator
set — that's a server-side decision — but the table below covers the
operators that work in practice across every endpoint.

## Operators

| Operator | Meaning | Example |
|---|---|---|
| `Eq` | equal | `{ field: "header_number", operator: "Eq", value: "STYLE-001" }` |
| `Neq` | not equal | `{ field: "active", operator: "Neq", value: "No" }` |
| `Gt` | greater than | `{ field: "ModifiedAt", operator: "Gt", value: "2024-01-01T00:00:00Z" }` |
| `Gte` | greater-or-equal | `{ field: "ModifiedAt", operator: "Gte", value: since.toISOString() }` |
| `Lt` | less than | `{ field: "ModifiedAt", operator: "Lt", value: "2023-01-01T00:00:00Z" }` |
| `Lte` | less-or-equal | |
| `Contains` | substring match (text) | `{ field: "header_name", operator: "Contains", value: "tee" }` |

Every operator takes a **scalar** `value`. There is no `In` operator that
accepts an array — see [Multiple values for one field](#multiple-values-for-one-field-or)
below for how to match a set.

## Multiple values for one field (OR)

Filters in the array are AND-ed, and the server does **not** support OR
*across* different fields. To OR *within a single field* (e.g. "any of these
header numbers"), BeProduct uses a multi-value convention: join the values
with the `■` separator (Unicode BLACK SQUARE, `U+25A0`) and keep the operator
as `Eq`:

```ts
const SEP = "■"; // ■

const filters: SearchFilter[] = [
  { field: "header_number", operator: "Eq", value: ["FI-00016", "FI-00017", "STYLE-001"].join(SEP) },
];
for await (const s of bp.style.list({ filters, pageSize: 100 })) { /* … */ }
```

> ⚠️ Passing a raw array as `value` (`value: ["a", "b"]`) does **not** work —
> the SDK sends filters through untouched, and the server expects the joined
> string. Either join it yourself as above, or let `dictToFilters` (below) do
> it for you.

## Field names

Field names are **case-sensitive**, and BeProduct uses two naming styles
depending on the kind of field:

- **Attribute / schema fields** use lowercase snake_case ids:
  `header_number`, `header_name`, `active`, `version`, `created_by`,
  `modified_by`, `color_number`, `color_name`. Custom attribute fields use
  their own schema id (e.g. `combobox999`) — query it once via
  `folderSchema(folderId)` (or `folderSearchSchema(folderId)`) to see the
  exact ids.
- **Record-metadata sort fields** use PascalCase: `ModifiedAt` (attributes
  modified date) and `FolderModifiedAt` (modified date of attributes *and*
  app pages). These are the fields to use for incremental sync.

## `dictToFilters` — shorthand for plain objects

When your filter set is built from a config / query string, the dict form is
more convenient than constructing the array by hand. `dictToFilters` mirrors
the Python SDK's `dict_to_eq_filter_parser` and handles the `■` multi-value
join for you:

```ts
import { dictToFilters } from "beproduct";

const filters = dictToFilters({
  header_number: ["FI-00016", "FI-00017"],   // array → ■-joined, Eq
  active: "Yes",                             // scalar → Eq
  season: ["*Fall*", "*Spring*"],            // array with * → Contains, ■-joined
  price: { operator: "Gt", value: 100 },     // nested form → explicit operator
});
// → [
//     { field: "header_number", operator: "Eq",       value: "FI-00016■FI-00017" },
//     { field: "active",        operator: "Eq",       value: "Yes" },
//     { field: "season",        operator: "Contains", value: "Fall■Spring" },
//     { field: "price",         operator: "Gt",       value: 100 },
//   ]
```

The value of each entry is interpreted as follows (`src/helpers.ts`):

| Value shape | Result |
|---|---|
| scalar (`"Yes"`, `100`) | `operator: "Eq"` with that value |
| string containing `*` | `*` stripped, `operator` stays `Eq` (a lone `*` string does **not** become `Contains`) |
| array (`["a", "b"]`) | values joined with `■`, `operator: "Eq"` — the OR-within-a-field form |
| array where any item has `*` | `*` stripped from each, joined with `■`, `operator: "Contains"` |
| `{ operator, value }` | passed through with that explicit operator |

> **No equivalent of Python's `parse_array_as_or_filter`.** The Python SDK
> also ships a helper that normalizes an already-built *array* of filter
> objects (joining any array `value` with `■`). The TS SDK only offers the
> dict form above — if you build `SearchFilter[]` by hand, join multi-value
> fields yourself (`values.join("■")`).

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
  filters: [{ field: "active", operator: "Eq", value: "Yes" }],
  colorwayFilters: [{ field: "color_number", operator: "Contains", value: "Pantone" }],
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
