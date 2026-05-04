# Resources overview

The `BeProduct` instance exposes one resource per top-level area of the
API. Every resource shares the same `HttpClient`, so auth refresh,
pagination, throttling, and rate-limit tracking are uniform.

| Property | Class | Covers | Guide |
|---|---|---|---|
| `bp.style` | `StyleResource` | Styles, colorways, BOM, sets, sample requests, POMs, 3D, artboards | [style.md](style.md) |
| `bp.material` | `MaterialResource` | Materials, colorways, attribute schema, request pages, 3D | [material.md](material.md) |
| `bp.color` | `ColorResource` | Color library, color chips, company colors | [color.md](color.md) |
| `bp.image` | `ImageResource` | Image entities, version uploads | [image.md](image.md) |
| `bp.block` | `BlockResource` | Block library, size-class 3D assets | [block.md](block.md) |
| `bp.tracking` | `TrackingResource` | Tracking folders, plans, timelines, milestones, views | [tracking.md](tracking.md) |
| `bp.directory` | `DirectoryResource` | Companies + contacts | [directory.md](directory.md) |
| `bp.user` | `UserResource` | Internal user roster + roles | [users.md](users.md) |
| `bp.dataTables` | `DataTableResource` | Reference data tables | [data-tables.md](data-tables.md) |
| `bp.masterData` | `MasterDataResource` | Master-data field definitions | [master-data.md](master-data.md) |
| `bp.inbox` | `InboxResource` | Tasks + messages | [inbox.md](inbox.md) |
| `bp.linesheets` | `LinesheetsResource` | Linesheet folders + sheets | [linesheets.md](linesheets.md) |
| `bp.reports` | `ReportsResource` | Report list + data + flat-BOM | [reports.md](reports.md) |
| `bp.raw` | `HttpClient` | Escape hatch for endpoints not yet wrapped | [../raw.md](../raw.md) |

## Shared header surface

The "header" entities — **style, material, color, image, block** — all
extend `BaseResource` and inherit a uniform set of methods for the parts
that don't differ per entity:

- **List + filter + paginate** — `list({ filters, pageSize, showDeleted })`
- **Get / create / update / delete** — `get(id)`, `create(folderId, fields)`, `update(id, fields)`, `deleteHeader(id)`
- **Folders** — `folders()`, `folderSchema(folderId)`, `folderSearchSchema(folderId)`
- **Apps** — `appList`, `appGet`, `appGetTyped`, `appGetByName`, `appGetByNameTyped`, `appFormUpdate`, `appGridUpdate`, `appListUpdate`, `appReset`, `appAttachmentsUpload`, etc.
- **Comments** — `commentList`, `commentAdd`, `commentEdit`, `commentDelete` + per-app variants
- **Revisions** — `revisionList`, `revisionAdd`, `revisionEdit`, `revisionDelete` + per-app variants
- **Tags** — `tagList`, `tagCreate`, `tagUpdate`, `tagDelete`, `tagAssign`, `tagUnassign`
- **Sharing** — `appShare`, `appUnshare`, `appSharedWith`

These are documented once in [headers.md](headers.md) and the
[apps.md](apps.md) guide; per-entity guides cover the shape-specific
extras (style colorways + BOM, material 3D textures, image versions, etc.).

## Specialised resources

The non-header resources have their own surface area:

- **`bp.tracking`** — folders, plans, milestones, timelines, views,
  per-master-folder timeline lists with filtering. See [tracking.md](tracking.md).
- **`bp.directory`** — companies + contacts. List/search/get + add/update.
  Pagination is flat-array (`paginateArray`), not `{ result, total }`.
- **`bp.user`** — user roster + role assignments. No pagination — full
  list returned at once.
- **`bp.dataTables`** — reference tables: `list`, `schema(id)`,
  `data(id, { filters, pageSize })` (paginated), `update(id, rows)`,
  `reset(id)`.
- **`bp.masterData`** — field definitions across the tenant. Get / create
  / update at the global level plus per-folder overrides.
- **`bp.inbox`** — task + message threads. Search, get, create, update,
  delete; messages, message edits, message attachments.
- **`bp.linesheets`** — folder list, linesheet list per folder, sheet
  detail.
- **`bp.reports`** — list reports, fetch a report by id with parameters,
  flat-BOM rollup.

Pick a guide on the right per resource.
