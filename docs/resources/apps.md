# Apps

Apps are the page-level data attached to a header — BOM, design details,
sample requests, etc. Five header entities (style, material, color, image,
block) inherit the same `appList` / `appGet` / `appGetTyped` / update
methods from `BaseResource`.

For the typed-data deep dive (which `appType` maps to which TypeScript
shape) see [../typed-apps.md](../typed-apps.md).

## Listing the apps on a header

```ts
const apps = await bp.style.appList(headerId);
// → AppPage[]
//   each: { id, title, type, marketId, ... }
```

Use `apps[i].id` as `appId` in subsequent calls. `apps[i].type` matches
the typed-app union exactly (`"Form" | "Grid" | "BOM" | …`).

## Fetching one app

Three flavours, picking based on what you have at hand and how typed you
need the response:

```ts
// (a) by app id, untyped
const page = await bp.style.appGet(headerId, appId);
// → { id, title, type, data: unknown, ... }

// (b) by app id, typed
const formPage = await bp.style.appGetTyped(headerId, appId, "Form");
formPage.data[0].id;     // ← FormItem typed

// (c) by app title (looks up id via appList first)
const page2 = await bp.style.appGetByName(headerId, "Bill of Material");

// (d) by app title, typed
const bom = await bp.style.appGetByNameTyped(headerId, "Bill of Material", "BOM");
bom.data.data?.[0].rowId;
```

`appGetByName` raises `Error("App \"...\" not found")` when no app on the
header has that title.

## Schema of an app

```ts
const schema = await bp.style.appSchema(appId);
// → unknown — the field definitions for this app type / market
```

The returned shape varies by app type. For Form/Grid it's a list of
`{ id, label, type, ... }` field defs; for BOM it includes section
groupings. Useful when building UI dynamically — you typically don't
need it for plain reads.

## Updating apps

The API has separate endpoints per app shape; the SDK mirrors them with
typed methods:

```ts
// Form / FormGrid form portion:
await bp.style.appFormUpdate(headerId, appId, {
  designer: "Alice",
  dropDate: "2024-09-01",
});
//
// Either a Record<string, unknown> (shorthand) or UpdateItem[] (native).

// Grid:
await bp.style.appGridUpdate(headerId, appId, [
  { rowId: "row-1", values: { /* ... */ } },
  { rowId: "row-2", values: { /* ... */ } },
]);

// List (text list / list app):
await bp.style.appListUpdate(headerId, appId, listUpdates);

// BOM rows:
await bp.style.bomUpdate(headerId, appId, [
  { rowId, group: "Body", materialHeaderId, quantity: 2.5, ... },
]);
await bp.style.bomItemDelete(headerId, appId, rowId);
await bp.style.bomReset(headerId, appId);
await bp.style.bomDetailsUpdate(headerId, appId, materialDetails);

// Multi-region measurements:
await bp.style.multiMeasurementsUpdate(headerId, appId, data);
await bp.style.multiMeasurementsReset(headerId, appId);

// SKU app:
await bp.style.skuGenerate(headerId, appId);
await bp.style.skuUpdate(headerId, appId, items);

// Sets / link-pages:
await bp.style.setsUpdate(headerId, appId, items);
await bp.style.linkPagesUpdate(headerId, appId, items);

// Text-list:
await bp.style.textListUpdate(headerId, appId, items);
await bp.style.textListEditorUpdate(headerId, appId, htmlString);
```

Most of these are `Promise<unknown>` since the response contains the
new state of the page (which you can re-fetch with `appGet` if you
care). For mutation flows in production code, fetch + diff + update is
the standard pattern — most "update" endpoints are full replacements
within their scope, not partial patches.

## Resetting an app to defaults

```ts
await bp.style.appReset(headerId, appId);     // any app type
```

Returns the schema-default state; useful for clearing entire BOMs or
setting a sample-request flow back to "not started" without deleting
the page itself.

## Attachments

Each app page can carry attachments (PDFs, spec docs, etc.):

```ts
import { type FileInput } from "beproduct";

const file: FileInput = { filepath: "/spec.pdf", filename: "spec.pdf" };
await bp.style.appAttachmentsUpload(headerId, appId, file);

await bp.style.appAttachmentsDelete(headerId, appId, [attachmentId1, attachmentId2]);
```

See [../file-uploads.md](../file-uploads.md) for the `FileInput` shape
and the async-processing pattern.

## App image uploads (List / ImagesForm / ImagesGrid / Artboard)

```ts
// List app — one image per row (target the row by its id):
await bp.style.appListUpload(headerId, appId, listItemId, file);

// ImagesForm app:
await bp.style.appImageFormUpload(headerId, appId, file);

// ImagesGrid app (same server endpoint as the form variant):
await bp.style.appImageGridUpload(headerId, appId, file);

// Artboard new version:
await bp.style.artboardVersionUpload(headerId, file);
```

Each returns a `string | null` image id; poll
[`imageProcessingStatus`](../file-uploads.md#the-async-processing-dance)
if the asset needs server-side processing.

## Comments and revisions on the app

```ts
const comments = await bp.style.appCommentList(headerId, appId);
await bp.style.appCommentAdd(headerId, appId, "Tolerance bumped to 0.5cm");

const revs = await bp.style.appRevisionList(headerId, appId);
await bp.style.appRevisionAdd(headerId, appId, "v2 — added panel");
```

## Sharing an app with partners

```ts
await bp.style.appShare(headerId, appId, [partnerId1, partnerId2]);
const sharedWith = await bp.style.appSharedWith(headerId, appId);
await bp.style.appUnshare(headerId, appId, [partnerId1]);
```

`partnerId` comes from `bp.directory` — see [directory.md](directory.md).

## Sample requests

The sample-request app has its own multi-add / submit endpoints:

```ts
await bp.style.sampleRequestMultiAddSubmit(headerId, appId, body, timelineId);
```

The structure of `body` matches the upstream's sample-request schema —
inspect `appGet` first to see the existing rows and copy the shape.
