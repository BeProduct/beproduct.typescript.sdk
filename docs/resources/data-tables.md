# Data tables

`bp.dataTables` covers reference tables — tenant-defined lookups (size
sets, fabric grades, fit types, …) that other entities reference by row
id.

## List + schema

```ts
// Stream every data table (paginated)
for await (const dt of bp.dataTables.list({ pageSize: 50 })) {
  console.log(dt.id, dt.name);
}

// Schema of a specific table — column definitions
const schema = await bp.dataTables.schema(dataTableId);
// → SchemaField[]
```

## Reading rows

```ts
for await (const row of bp.dataTables.data(dataTableId, {
  filters: [{ field: "Active", operator: "Eq", value: true }],
  pageSize: 100,
})) {
  console.log(row.id, row.fields);
}
```

Each row carries its `id` and a `fields` map (id → value) keyed by the
schema's field ids.

## Mutations

```ts
// Update / insert / delete in one batch
const result = await bp.dataTables.update(dataTableId, [
  // existing row — partial update
  { id: rowId, fields: { name: "Updated" } },
  // new row — omit id
  { fields: { name: "New" } },
  // delete — set deleted: true
  { id: rowToDelete, deleted: true },
]);
// → { updated: number, added: number, deleted: number }

// Wipe every row
await bp.dataTables.reset(dataTableId);
```

`update` is one round-trip for all changes. The server handles ordering
internally so deletes don't race against inserts.

## Filtering on data-table rows

Same `SearchFilter` shape as everything else — filter by any column the
schema defines. The field ids are whatever you see in the schema (often
sanitised lowercase-with-underscores).

## When to use data tables vs. master data

- **Data tables** — domain-specific reference tables your internal
  business owns (fit types, factory tiers, etc.).
- **Master data** — field-level configuration (which fields appear on a
  form / grid / list app, what their valid values are). See
  [master-data.md](master-data.md).

If your data is *referenced by id from many places*, it's probably a
data table. If it's *configuring how forms render*, it's master data.
