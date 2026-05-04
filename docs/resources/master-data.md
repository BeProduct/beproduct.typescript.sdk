# Master data

`bp.masterData` covers field definitions — the schema rows that drive
what fields appear on forms / grids / lists, their data types, and which
folders they apply to.

## Field-level operations

```ts
const field = await bp.masterData.get(fieldId);
// → MasterDataResult — { id, label, type, options, ... }

await bp.masterData.create({
  label: "Tolerance",
  type: "Number",
  // type-specific options
});

await bp.masterData.update(fieldId, {
  label: "Tolerance (cm)",
  options: { ... },
});
```

The exact shape of `options` varies per field type. Inspect a working
field with `get` first to copy the shape.

## Per-folder field overrides

Some fields have folder-specific overrides (different default values,
required-ness, visibility):

```ts
const ff = await bp.masterData.folderFieldGet(folderId, fieldId);
// → FolderFieldResult — the field as seen in that folder

await bp.masterData.folderFieldUpdate(folderId, fieldId, {
  required: true,
  defaultValue: "Active",
});
```

## When to use master data

- The field appears on every header in the entity (style / material /…)
  — that's a *master* field, edit via `update(fieldId, …)`.
- The field needs different rules per folder — fetch / update via the
  `folderField*` family.
- The data the field references is itself a list of rows — that's a
  data table, see [data-tables.md](data-tables.md).

## Rare in production

Most production code reads master data via `folderSchema(folderId)` on
the relevant resource (style/material/etc.) — that returns the resolved
field definitions a header in that folder will see. The
`bp.masterData.*` family is for configuring the master data itself,
typically used by admin / setup flows rather than day-to-day pipelines.
