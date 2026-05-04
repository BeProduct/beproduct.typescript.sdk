# Directory

`bp.directory` covers the directory of companies (vendors, factories,
suppliers, customers) and their contacts. The endpoint family uses
**flat-array pagination** rather than the `{ result, total }` envelope —
the SDK's iterators handle this for you.

## Companies

```ts
// Fixed-page list (no pagination)
const page = await bp.directory.list({ pageSize: 100, pageNumber: 0 });
// → DirectoryCompany[]

// Stream every company with optional filters
for await (const c of bp.directory.search({
  pageSize: 100,
  filters: [{ field: "PartnerType", operator: "Eq", value: "VENDOR" }],
})) {
  console.log(c.id, c.name, c.country);
}

// Get one
const c = await bp.directory.get(directoryId);

// Create / update
const created = await bp.directory.add({ name: "Acme Knits", country: "VN", partnerType: "VENDOR" });
await bp.directory.update(created.id, { country: "BD" });
```

## Contacts

```ts
// Stream contacts on a company
for await (const ct of bp.directory.contactList(directoryId, { pageSize: 50 })) {
  console.log(ct.id, ct.email);
}

// Get one
const ct = await bp.directory.contactGet(contactId);

// Create / update
const created = await bp.directory.contactAdd(directoryId, {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@acme.example",
});
await bp.directory.contactUpdate(directoryId, created.id, { phone: "+84-..." });
```

## Pagination model

`bp.directory.search` and `bp.directory.contactList` use `paginateArray`
internally — they keep fetching pages until a short page (`< pageSize`)
signals the end. If you wrap the same endpoint via `bp.raw.post`, do the
same:

```ts
import { paginateArray } from "beproduct";

for await (const c of paginateArray<DirectoryCompany>(100, (size, page) =>
  bp.raw.post(`Directory/Companies`, { filters: [] }, { pageSize: size, pageNumber: page }),
)) { /* … */ }
```

See [../pagination.md](../pagination.md) for the helpers' guarantees.

## Common usage

Directory entries are most often referenced *from* other entities —
suppliers on tracking timelines, partners shared on apps, etc. The
typical flow:

1. Look up the company by name with `search` + a `Name Contains` filter.
2. Cache the `id` on the local side.
3. Reference the id in `bp.style.appShare(headerId, appId, [partnerId])`,
   tracking timeline `supplier`, etc.

## Filters

Common fields:

- `Name` — company name
- `Country` — ISO country
- `PartnerType` — `VENDOR` / `FACTORY` / `CUSTOMER` / `MILL` / etc.
- `Active` — boolean for soft-deleted entries
- `ModifiedAt` — for incremental syncs

Operators are the standard set — see [../filters.md](../filters.md).
