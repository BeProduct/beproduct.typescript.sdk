# Block

`bp.block` covers the block library — reusable block specs (size set
defaults, base patterns) that styles can link to. Inherits the shared
header surface (see [headers.md](headers.md)) for `list` / `get` /
folders / apps / comments / revisions / tags.

## Create / update

```ts
const b = await bp.block.create(folderId, {
  headerName: "Round-neck Tee Block",
  headerNumber: "RN-001",
  // folder schema fields
});

await bp.block.update(b.id, { status: "Active" });
```

## Size-class 3D assets

Blocks can carry 3D renderings per size class:

```ts
const imageId = await bp.block.sizeClass3dAssetUpload(
  headerId,
  sizeClassIdOrName,    // e.g. "M" or the schema field id
  file,
);

// Read all assets stored against a size class
const assets = await bp.block.getSizeClassAssets(headerId, sizeClassId);

// Poll while the asset processes
const status = await bp.block.imageProcessingStatus(imageId!);
```

See [../file-uploads.md](../file-uploads.md) for the `FileInput` shape
and the async-processing pattern.

## Linking blocks to styles

Blocks become useful when a style is `blockLink`-ed to one — see
[style.md#lifecycle-helpers](style.md#lifecycle-helpers):

```ts
await bp.style.blockLink(headerId, blockHeaderId, sizeClasses);
await bp.style.blockUnlink(headerId);
```

Once linked, the style inherits the block's POMs, size set defaults, and
3D assets unless overridden.
