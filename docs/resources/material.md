# Material

`bp.material` exposes the same shared header surface as style (see
[headers.md](headers.md) and [apps.md](apps.md)) plus material-specific
extras: per-material colorways, request pages, and 3D textures for fabric
swatches.

## Schema lookups

```ts
const colorways = await bp.material.colorwaySchema(folderId);
// → SchemaField[] — colorway field defs for this material folder

const sizes = await bp.material.sizeRangeSchema(folderId);
// → SchemaField[] — size range, when the material has size variants

const pages = await bp.material.folderPages(folderId);
// → AppPage[] — every app page configured for this folder
```

## Colorways

```ts
// Upload a swatch image (file → image id)
const imageId = await bp.material.colorwayUpload(headerId, file, {
  colorwayId,             // existing colorway
  // or:
  colorNumber: "PMS-Orange",  // create a new colorway
});

// Delete a colorway
await bp.material.colorwayDelete(headerId, colorwayId);

// Bulk delete
await bp.material.colorwaysDelete(headerId, [c1, c2, c3]);
```

When you pass `colorNumber` instead of `colorwayId`, the API creates a new
colorway with that color reference and uploads the swatch in one call.

## Move

```ts
await bp.material.move(headerId, targetFolderId, /* generateNewHeaderNumber */ false);
```

## Artboards

```ts
const imageId = await bp.material.artboardVersionUpload(headerId, file);
const status  = await bp.material.imageProcessingStatus(imageId);
```

Material headers can carry an artboard the same way styles do; useful for
tech-pack-style swatch sheets.

## Request pages

Same shape as the style request-page family — used for material request
flows (color labs, dye lots, strike-offs):

```ts
const pages  = await bp.material.requestPageList(headerId);
const page   = await bp.material.requestPageGet(headerId, appId, timelineId);

await bp.material.requestPageFormUpdate(headerId, appId, timelineId, {
  field1: value1,
  field2: value2,
});
```

`timelineId` ties the request back to a tracking timeline — see
[tracking.md](tracking.md).

## 3D

Materials store separate front / back textures plus a render preview:

```ts
// Working file (the source 3D asset)
const wfId = await bp.material.material3dAssetUpload(headerId, appId, colorwayId, file);

// Render preview (for the UI thumbnail)
const previewId = await bp.material.material3dPreviewUpload(headerId, appId, colorwayId, file);

// Per-side texture (front / back)
const txId = await bp.material.material3dTextureUpload(headerId, appId, colorwayId, "front", file);
//                                                                                       "back"

// Generic 3D-app data update
await bp.material.material3dAppUpdate(headerId, appId, data);
```

For the upload + poll pattern (waiting for the server to finish
processing the asset), see [../file-uploads.md](../file-uploads.md).

## Read patterns

For typed reads, use the shared `appGetTyped`:

```ts
const constructionPage = await bp.material.appGetTyped(headerId, appId, "Form");
constructionPage.data[0].id;   // typed FormItem
```

The `bp.style.list({ filters })` iterator works identically on
`bp.material.list({ filters })`.
