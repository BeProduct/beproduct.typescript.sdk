# Image

`bp.image` covers the image library — independent image entities (as
opposed to images attached to other entities). Inherits the shared
header surface (see [headers.md](headers.md)) for `list` / `get` /
folders / apps / comments / revisions / tags.

## Create / update

```ts
const img = await bp.image.create(folderId, {
  headerName: "Front Print",
  headerNumber: "FP-2024-001",
  // folder-schema fields
});

await bp.image.update(img.id, { status: "Active" });
```

## Image versions

The defining feature of an image entity is its versioned image content.

```ts
const newVersionId = await bp.image.imageVersionUpload(headerId, file);

// Poll until processing finishes (large/3D assets need time):
while (true) {
  const status = await bp.image.imageProcessingStatus(newVersionId!);
  if ((status as { finished?: boolean }).finished) break;
  await new Promise((r) => setTimeout(r, 2_000));
}
```

See [../file-uploads.md](../file-uploads.md) for `FileInput` and the
upload-and-poll lifecycle.

## Listing

```ts
for await (const img of bp.image.list({
  pageSize: 100,
  filters: [{ field: "Status", operator: "Eq", value: "Active" }],
})) {
  console.log(img.id, img.headerName);
}
```

The `list` iterator returns image headers; image versions live behind
`appList` / `appGet` calls on each header.

## When to use image entities vs. per-page images

Images can live in three places:

| Where | What it is | Endpoint |
|---|---|---|
| Image entity | Standalone, versioned, library-managed | `bp.image.*` |
| App page form image field | Embedded in a Form/ImagesForm app | `bp.style.appImageFormUpload` |
| List app row image | One image per row of a List app | `bp.style.appListUpload` |
| Style colorway swatch | Per-colorway preview | `bp.style.colorwayUpload` |
| Material colorway swatch | Per-colorway preview | `bp.material.colorwayUpload` |
| Block size-class 3D | 3D rendering for a size class | `bp.block.sizeClass3dAssetUpload` |

If the image needs its own lifecycle (versions, sharing, comments) it
belongs in the image library; otherwise embed it where it's used.
