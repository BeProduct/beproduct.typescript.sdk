# File uploads

Multipart endpoints (artwork, swatches, 3D assets, attachments, list-row
images) accept a `FileInput`. Pick **one** of `filepath` / `fileUrl` /
`buffer`:

```ts
import { type FileInput } from "beproduct";

// from disk
const fromDisk: FileInput = {
  filepath: "/abs/path/to/swatch.png",
  filename: "swatch.png",   // optional — derived from path if omitted
};

// from a URL (the SDK fetches it)
const fromUrl: FileInput = {
  fileUrl: "https://cdn.example.com/render.png",
  filename: "render.png",   // optional — derived from the URL path
};

// from an in-memory buffer
const fromBuffer: FileInput = {
  buffer: Buffer.from(bytes),
  filename: "swatch.png",   // required for buffer — no path to infer from
  size: bytes.length,        // optional but lets the server pre-allocate
};
```

The internal upload helper streams from disk, fetches the URL, or accepts
the buffer as-is — multipart body construction is handled for you.

## Picking the right method

Each entity has its own upload methods because the underlying endpoint and
multipart fields differ. Common ones:

| Method | What it uploads |
|---|---|
| `bp.style.upload(headerId, file, position?)` | The style attribute image — see [Attribute images](#attribute-images-frontsideback) below |
| `bp.material.upload(headerId, file, position?)` | The material attribute image (`position`: `"main"` \| `"detail"`) |
| `bp.style.colorwayUpload(headerId, colorwayId, file)` | A swatch image for a colorway |
| `bp.material.colorwayUpload(headerId, file, { colorwayId })` | A swatch image for a material colorway |
| `bp.style.artboardVersionUpload(headerId, file)` | A new artboard version |
| `bp.style.turntableUpload(headerId, file, options?)` | Style turntable (3D) assets |
| `bp.style.style3dWorkingFileUpload(...)` / `bp.style.style3dPreviewUpload(...)` | 3D working file / preview render |
| `bp.material.material3dAssetUpload(...)` / `material3dPreviewUpload` / `material3dTextureUpload` | Material 3D assets |
| `bp.image.imageVersionUpload(headerId, file)` | New image version |
| `bp.block.sizeClass3dAssetUpload(headerId, sizeClass, file)` | Block 3D asset per size class |
| `bp.style.appAttachmentsUpload(headerId, appId, file)` (and `.material`, etc.) | Attach file to an app page |
| `bp.style.appListUpload(headerId, appId, listItemId, file)` | Image inside a list-row (List / List-Form / List-Grid app) |
| `bp.style.appImageFormUpload(headerId, appId, file)` | Image inside an ImagesForm app |
| `bp.style.appImageGridUpload(headerId, appId, file)` | Image inside an ImagesGrid app (same endpoint as the form variant) |
| `bp.inbox.messageAttachmentsUpload(messageId, file)` | Attach file to an inbox message |

All return either a `string | null` image id (for entity-level uploads
that produce a tracked image) or `unknown` (for attachments that don't).

## Attribute images (front/side/back)

`bp.style.upload` / `bp.material.upload` set the header's **attribute
image** — the picture you see on the style/material header itself. The
optional third argument picks the slot; omit it to upload the default
(front, for styles) image.

```ts
// Style — front / side / back are the three views
await bp.style.upload(headerId, { filepath: "/front.png" }, "front");
await bp.style.upload(headerId, { filepath: "/side.png" },  "side");
await bp.style.upload(headerId, { filepath: "/back.png" },  "back");

// no position → default upload
await bp.style.upload(headerId, { fileUrl: "https://cdn/render.png" });

// Material — the slots are 'main' and 'detail'
await bp.material.upload(headerId, { filepath: "/swatch.png" }, "main");
```

The `position` argument is **typed per entity** — `StyleImagePosition`
(`"front" | "side" | "back"`) and `MaterialImagePosition` (`"main" |
"detail"`) — so an invalid slot is a compile error, not a runtime 400.
Like every attribute-image upload it returns an image id that you then
poll (see [below](#the-async-processing-dance)).

## The async-processing dance

For asset uploads that need server-side processing (3D renders, large
artwork, etc.) the upload returns immediately with an image id while the
server still works on it. Poll `imageProcessingStatus(imageId)` until
`finished: true`:

```ts
const imageId = await bp.style.artboardVersionUpload(headerId, { filepath, filename });
if (!imageId) throw new Error("upload returned no id");

while (true) {
  const status = await bp.style.imageProcessingStatus(imageId);
  if ((status as { finished?: boolean }).finished) break;
  if ((status as { errorOccured?: boolean }).errorOccured) {
    throw new Error(`processing failed: ${(status as { message?: string }).message ?? "unknown"}`);
  }
  await new Promise((r) => setTimeout(r, 2_000));
}
```

(Note the `errorOccured` typo — that's how the API spells it. The SDK
exposes a `errorOccurred`-spelled wrapper via `http.uploadStatus(fileId)`
for paths where the typo matters.)

## Common pitfalls

- **Buffer + missing filename** — buffers don't have a path to infer from.
  Set `filename` explicitly or you'll get a server-side 400.
- **`fileUrl` from a private host** — the SDK fetches the URL with no
  auth. If your URL needs an auth header, fetch it yourself and pass the
  bytes via `buffer`.
- **Concurrent uploads to the same entity** — most endpoints serialise
  per-entity on the server. Parallel uploads to the same `(headerId,
  appId)` may produce undefined ordering on the resulting image-version
  list. Serialise on the client when ordering matters.
- **Very large files** — there's no automatic chunking. Single-request
  uploads have a tenant-level size limit (commonly 50 MB); ask BeProduct
  support for the actual cap if you're hitting it.
