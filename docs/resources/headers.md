# Headers (shared surface)

Style, material, color, image, and block all extend `BaseResource` and
share the same set of CRUD + folder + app + comment + revision + tag
methods. This page covers the shared shape; entity-specific extras are in
each resource's own guide.

```ts
// All five expose the same surface. Examples below use bp.style;
// bp.material / bp.color / bp.image / bp.block work identically.
```

## Listing

```ts
for await (const s of bp.style.list({
  pageSize: 50,
  filters: [{ field: "Status", operator: "Eq", value: "Active" }],
  showDeleted: false,
})) {
  console.log(s.id, s.headerName);
}
```

| Option | Default | Notes |
|---|---|---|
| `pageSize` | `20` | Max per page; bump for bulk |
| `filters` | `[]` | See [filters.md](../filters.md) |
| `colorwayFilters` | `[]` | Narrows colorways embedded in the response (style/material only) |
| `folderId` | — | Restricts the search to a folder |
| `showDeleted` | `false` | Include soft-deleted headers (with `deleted: true`) |

The iterator yields one entity at a time and stops when the last page is
shorter than `pageSize`. `break` cleanly cancels further fetches.

## Get / Create / Update / Delete

```ts
const header = await bp.style.get(headerId);            // by GUID
const created = await bp.style.create(folderId, {
  headerName: "Tee — Round Neck",
  headerNumber: "T-101",
  // any folder schema fields go here as a flat dict
});
await bp.style.update(headerId, { status: "Active" });
await bp.style.deleteHeader(headerId);   // soft delete
```

`update` accepts either a `Record<string, unknown>` (key-value shorthand)
or an `UpdateItem[]` (the API's native `{ id, value }` shape). The
shorthand is converted via `fieldsToUpdateItems`.

> **Autonumbering gotcha.** If the folder has **auto-generate header
> number** turned on, the `headerNumber` you pass on `create` is **ignored**
> — the server assigns its own (e.g. `HL26-0001`). To import your own style
> numbers, ask the tenant admin to disable autonumbering on the folder
> first (and, if numbers repeat across seasons/variants, enable "allow
> duplicate numbers"). The create still succeeds either way; the number is
> just silently overwritten, so verify one record after a bulk import.

### Looking up by header number

When you have the human-facing header **number** (e.g. `"T-101"`) rather
than the GUID, use `getByNumber`. It resolves to the first match, or
`null` if none:

```ts
const style = await bp.style.getByNumber("T-101");
if (style) console.log(style.id);

// scope to one folder when numbers aren't unique tenant-wide:
const inFolder = await bp.style.getByNumber("T-101", { folderId });
```

It's a thin convenience over `list()` with a `header_number` Eq filter —
reach for `list()` directly if you need more than the first hit.

> **Caveat:** this only works if `header_number` is **filterable** in the
> folder's search schema (check `folderSearchSchema(folderId)`). Some
> folders don't index it, in which case the filter returns nothing — fall
> back to iterating `list()` and matching client-side.

## Sizes and size classes

`create` and `update` take an optional `sizes` array. **Sizes are
replaced wholesale** — you can't patch a single size; always pass the full
range. Only `name` is required:

```ts
await bp.style.create(folderId, fields, {
  sizes: [
    { name: "XS", isSampleSize: true },   // mark the sample size
    { name: "S" },
    { name: "M" },
    { name: "L" },
    // optional per-size fields:
    // { name: "XL", price: 1.1, currency: "USD", unitOfMeasure: "inch", comments: "..." },
  ],
});
```

| Field | Notes |
|---|---|
| `name` | **required** — the size label (`"XS"`, `"M"`, …) |
| `isSampleSize` | marks this entry as the sample size |
| `price` / `currency` / `unitOfMeasure` / `comments` | optional per-size metadata |

For block-style **size classes** (a size *set* rather than a flat list),
pass `sizeClasses` instead — see [block.md](block.md).

## Folders

```ts
const folders = await bp.style.folders();
// → FolderItem[] — one entry per folder configured for this entity type

const schema = await bp.style.folderSchema(folderId);
// → SchemaField[] — definition of every header field for that folder

const searchSchema = await bp.style.folderSearchSchema(folderId);
// → SchemaField[] — fields that can be filtered on
```

Folders determine which header fields and which app pages exist. Querying
the schema once per folder gives you the field IDs you need for
`update()` and the operators allowed in `filters`.

## Apps (list, get, update)

Apps are the page-level data attached to a header — BOM, design details,
sample requests, etc. See [apps.md](apps.md) for the typed-app deep dive.
The five header resources all expose:

```ts
const apps = await bp.style.appList(headerId);
const page = await bp.style.appGet(headerId, appId);              // unknown-typed
const typed = await bp.style.appGetTyped(headerId, appId, "Form"); // typed
const byName = await bp.style.appGetByName(headerId, "Bill of Material");

await bp.style.appFormUpdate(headerId, appId, { designer: "Alice" });
await bp.style.appGridUpdate(headerId, appId, gridUpdates);
await bp.style.appListUpdate(headerId, appId, listUpdates);
await bp.style.appReset(headerId, appId);    // wipe all values
```

## Comments

```ts
const comments = await bp.style.commentList(headerId);
await bp.style.commentAdd(headerId, "Spec is final");
await bp.style.commentEdit(headerId, commentId, "Spec is final (revised)");
await bp.style.commentDelete(headerId, commentId);

// Per-app comments (live on the app page rather than the header):
const appComments = await bp.style.appCommentList(headerId, appId);
await bp.style.appCommentAdd(headerId, appId, "Updated tolerances");
```

## Revisions

Revision history snapshots, scoped either to the header or to an app:

```ts
const revs = await bp.style.revisionList(headerId);
await bp.style.revisionAdd(headerId, "v1.2 — fit corrected");

const appRevs = await bp.style.appRevisionList(headerId, appId);
await bp.style.appRevisionAdd(headerId, appId, "BOM revised — added trims");
```

## Tags

Tags are a tenant-wide vocabulary; assign them to headers:

```ts
const tags = await bp.style.tagList();
const t = await bp.style.tagCreate("Spring 25", { integration: "Linnworks" });
await bp.style.tagAssign(headerId, [t.id]);
await bp.style.tagUnassign(headerId, [t.id]);
await bp.style.tagDelete(t.id);
```

## Sharing

Apps can be shared with directory partners (vendors, suppliers):

```ts
await bp.style.appShare(headerId, appId, [partnerId1, partnerId2]);
const shared = await bp.style.appSharedWith(headerId, appId);   // SharedPartner[]
await bp.style.appUnshare(headerId, appId, [partnerId1]);
```

## Where the entity-specific bits live

| Concern | Where to look |
|---|---|
| Style colorways, BOM, sets, sample requests, POMs, 3D | [style.md](style.md) |
| Material colorways, request pages, 3D textures | [material.md](material.md) |
| Color library, chips | [color.md](color.md) |
| Image versions | [image.md](image.md) |
| Block size-class 3D | [block.md](block.md) |
