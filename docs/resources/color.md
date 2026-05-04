# Color

`bp.color` covers the color library — color entities, color chips, and
the company-color palette. Inherits the shared header surface (see
[headers.md](headers.md)) for `list` / `get` / `create` / `update` /
folders / apps / comments / revisions / tags.

## Schema lookups

```ts
const chipSchema = await bp.color.colorChipSchema(folderId);
// → SchemaField[] — chip-level field definitions for this folder

const pageSchema = await bp.color.pageSchema(pageId);
// → unknown — schema of a specific app page on a color
```

`pageSchema` is the page-level schema (every header type has it via
`appSchema(pageId)` too — `pageSchema` is the legacy alias kept for
clarity).

## Create / update

Same as the other header resources:

```ts
const c = await bp.color.create(folderId, {
  headerName: "Hot Pink",
  headerNumber: "PMS-806",
  // any folder schema fields
});

await bp.color.update(c.id, {
  status: "Active",
  hex: "#FF1493",
});
```

## Company colors

```ts
for await (const cc of bp.color.companyColors({ pageSize: 100 })) {
  console.log(cc);
}
```

The "company colors" endpoint returns the brand's standardised palette —
distinct from individual color entities but linked by reference. The
shape is intentionally `unknown` because the returned fields differ per
tenant; `console.log` it once and pick the keys you need.

## Colors as referenceable entities

Colors are most useful as references from other entities — colorway
swatches on styles, color values on fabric materials, etc. The typical
flow:

1. List or search the color library to get an `id` + `headerNumber`.
2. Reference it from another resource's update payload (e.g.
   `bp.style.update(headerId, { colorwayColor: colorId })`).

For typed reads of color app pages, use `appGetTyped(headerId, appId, "Form")`
or whatever shape applies to your tenant's color apps.
