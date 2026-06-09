# Style

`bp.style` is the largest resource — it wraps everything you'd touch on a
style header: colorways, BOM, sets, sample requests, points-of-measure,
3D, artboards, and the full shared header surface.

The shared CRUD/folder/app/comment/revision/tag/sharing methods are
documented in [headers.md](headers.md) and [apps.md](apps.md). This page
covers the style-specific extras.

## Create a style end-to-end (with sizes + front/back images)

The common bulk-import flow: create the header with its fields and size
range, then upload the front/back attribute images and wait for the server
to finish processing each one.

```ts
// 1) resolve the target folder once
const folder = (await bp.style.folders()).find((f) => f.name === "01 APPAREL");

// 2) create the header — fields are a flat dict of folder field ids
const style = await bp.style.create(folder!.id, {
  header_number: "BB-FW26-060",          // ignored if the folder auto-numbers!
  header_name:   "Strapless Embellished Maxi Dress",
  season: "FALL", year: "2026", brand: "BRONX BANCO", category: "APPAREL",
}, {
  sizes: [                                // full size range (see headers.md)
    { name: "XS", isSampleSize: true },
    { name: "S" }, { name: "M" }, { name: "L" },
  ],
});

// 3) upload the attribute images, positioned (typed: "front" | "side" | "back")
const frontId = await bp.style.upload(style.id, { filepath: "/img/front.jpg" }, "front");
const backId  = await bp.style.upload(style.id, { filepath: "/img/back.jpg" },  "back");

// 4) wait for server-side processing of each image
for (const id of [frontId, backId]) {
  if (!id) continue;
  while (true) {
    const s = await bp.style.uploadStatus(id);
    if (s.finished && !s.errorOccurred) break;
    if (s.finished && s.errorOccurred) throw new Error(`processing failed: ${s.message}`);
    await new Promise((r) => setTimeout(r, 2_000));
  }
}
```

Notes:
- `create` returns the created header — `style.id` is the new GUID.
- **Verify the number stuck** — see the [autonumbering gotcha](headers.md#get--create--update--delete).
- A missing image file is your call to handle — resolve the path first and
  skip the `upload` if it doesn't exist (the server won't invent one).
- `bp.style.upload(headerId, file, position?)` is the attribute image; it's
  distinct from `artboardVersionUpload` (Artboard app versions, below).

## Schema lookups

```ts
const schema = await bp.style.colorwaySchema(folderId);
// → SchemaField[] — colorway-level field definitions for this folder

const sizes = await bp.style.sizeRangeSchema(folderId);
// → SchemaField[] — size-range field definitions

const pages = await bp.style.folderPages(folderId);
// → AppPage[] — every app page configured for this folder
```

`folderPages` works for any master folder despite living on `bp.style`
— the underlying server route is folder-agnostic.

## Attribute image (front / side / back)

Set the style header image — the picture shown on the style itself. The
slot is typed `StyleImagePosition` (`"front" | "side" | "back"`); omit it
for the default (front) upload.

```ts
const imageId = await bp.style.upload(headerId, file, "front");
const status  = await bp.style.imageProcessingStatus(imageId);
```

This is distinct from `artboardVersionUpload` (which adds a *version* to
the Artboard app, see [below](#3d--artboards)). See
[../file-uploads.md](../file-uploads.md#attribute-images-frontsideback)
for the upload + poll pattern.

## Colorways

Style headers carry colorways inline in `style.list()` results, so
fetching is read-via-list. Mutations live on `bp.style`:

```ts
// Upload a swatch image for a colorway (target by colorway id or color number)
const imageId = await bp.style.colorwayUpload(headerId, file, { colorwayId });

// Delete one
await bp.style.colorwayDelete(headerId, colorwayId);

// Bulk delete
await bp.style.colorwaysDelete(headerId, [c1, c2, c3]);
```

Add or update colorways through the `colorways` option on `create` / `update`.
Each colorway is `{ id, fields }` — `id` is `null` to create a new colorway (or
the colorway id to update), and `fields` is a plain dict of the colorway field
ids from `colorwaySchema(folderId)` (`color_number` and `color_name` are
required for a new colorway):

```ts
await bp.style.update(headerId, undefined, {
  colorways: [
    { id: null, fields: { color_number: "#1", color_name: "Navy", primary: "000080" } },
  ],
});
```

The SDK unwinds that `fields` dict into the `[{ id, value }]` array the API
expects — you just pass `{ fieldId: value }`.

## BOM

```ts
// Update / replace BOM rows
await bp.style.bomUpdate(headerId, appId, [
  { rowId, group: "Body", materialHeaderId, quantity: 2.5, ... },
]);

// Wipe the BOM
await bp.style.bomReset(headerId, appId);

// Delete a single row
await bp.style.bomItemDelete(headerId, appId, rowId);

// Update material details (per-row settings)
await bp.style.bomDetailsUpdate(headerId, appId, materialDetails);
```

For typed BOM data on read, use [`appGetTyped(headerId, appId, "BOM")`](apps.md#fetching-one-app).

## Sets

`Sets` is an app type that links a parent style to one or more child
styles (size-set runs, colorway sets, etc.):

```ts
await bp.style.setsUpdate(headerId, appId, items);
```

`items` is an array describing the new set members — inspect
`appGetTyped(headerId, appId, "FormGrid")` first to see the existing
shape.

## Sample requests

Sample-request flows have a dedicated `requestPage*` family that mirrors
the regular `appPage*` but routes through `RequestPage` server-side:

```ts
const pages = await bp.style.requestPageList(headerId);
const page = await bp.style.requestPageGet(headerId, appId, timelineId);
const schema = await bp.style.requestPageSchema(pageId);

await bp.style.requestPageFormUpdate(headerId, appId, timelineId, {
  sampleQty: 3,
  notes: "...",
});

// Multi-add submit (creates several requests at once)
await bp.style.sampleRequestMultiAddSubmit(headerId, appId, body, timelineId);
```

`timelineId` ties the request back to a tracking timeline — see
[tracking.md](tracking.md).

## Points of Measure (POMs)

Multi-region measurements are stored on a Measurements app:

```ts
await bp.style.multiMeasurementsUpdate(headerId, appId, data);
await bp.style.multiMeasurementsReset(headerId, appId);
```

Read via `appGetTyped(headerId, appId, "Measurements")` to get the typed
`groups[]` shape.

## 3D + artboards

```ts
// New artboard version (returns an image id once processing finishes)
const imageId = await bp.style.artboardVersionUpload(headerId, file);

// Turntable upload (style-level 3D orbit asset)
await bp.style.turntableUpload(headerId, file);

// Reassign artboard to another image entity
await bp.style.artboardAssign(body);

// 3D-app version lifecycle
const v = await bp.style.style3dVersionCreate(headerId, appId, "v1");
await bp.style.style3dVersionCopy(headerId, appId, sourceVersionId, "v1-fork");
await bp.style.style3dVersionUpdate(headerId, appId, versionId, data);
await bp.style.style3dVersionDelete(headerId, appId, versionId);

// Files on a 3D version
await bp.style.style3dWorkingFileUpload(headerId, appId, versionId, file);
await bp.style.style3dPreviewUpload(headerId, appId, versionId, colorwayId, file);

// Async processing status
const status = await bp.style.imageProcessingStatus(imageId);
```

See [../file-uploads.md](../file-uploads.md) for the upload-and-poll
pattern.

## Lifecycle helpers

```ts
// Move a header to another folder
await bp.style.move(headerId, targetFolderId, /* generateNewHeaderNumber */ false);

// Carry over (clone with optional colorway copy)
const { id: newHeaderId } = await bp.style.carryOver(headerId, /* skipColorways */ false);

// Block linking (associate a style with a block library entry)
await bp.style.blockLink(headerId, blockHeaderId, sizeClasses);
await bp.style.blockUnlink(headerId);

// Where-used probe
const usage = await bp.style.whereUsedInSets(headerId);
```

## SKU generation

```ts
await bp.style.skuGenerate(headerId, appId);
await bp.style.skuUpdate(headerId, appId, items);
```

`skuGenerate` runs the tenant's SKU formula against the colorway × size
matrix and writes the result; `skuUpdate` lets you overwrite specific
SKUs after the fact.

## Text lists

```ts
await bp.style.textListUpdate(headerId, appId, items);
await bp.style.textListEditorUpdate(headerId, appId, htmlString);
```

The `editorUpdate` form takes a rich-text HTML string for free-form
sections (care label, packaging notes).

## Linked pages

```ts
await bp.style.linkPagesUpdate(headerId, appId, items);
```

`Sets` and "linked pages" overlap conceptually — use `setsUpdate` when
the parent–child relationship is the primary axis, `linkPagesUpdate` when
you're linking app pages directly without set semantics.
