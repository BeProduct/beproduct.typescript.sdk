# Typed apps

Apps (BOM, Form, Grid, Measurements, ImagesForm, ImagesGrid, FormGrid,
ThreeD, SampleRequest, Artboard, TextList, List) all live behind the same
two endpoints — `Pages` to list and `Page` to fetch — but their `data`
payloads have wildly different shapes. The SDK bundles a Zod schema per
shape and exposes typed accessors so you don't have to cast `unknown`.

## `appGetTyped(headerId, appId, type)`

```ts
const page = await bp.style.appGetTyped(headerId, appId, "Form");
page.data[0].id;          // FormItem.id — typed
page.data[0].fields;      // typed
```

The third argument constrains the response type. Allowed values are the
`TypedAppType` union:

```
"Form" | "Grid" | "BOM" | "Measurements" |
"ImagesForm" | "ImagesGrid" | "FormGrid" |
"ThreeD" | "SampleRequest" | "Artboard" |
"TextList" | "List"
```

Internally the call:

1. Hits `Style/Page?headerId=X&pageId=Y` (or `Material/`, `Color/`,
   `Image/`, depending on the resource you call it on).
2. Pulls `AppDataSchemas[type]` — the Zod schema for that shape.
3. `schema.parse(raw.data)` — throws if the shape disagrees.
4. Returns `{ ...raw, data }` with `data` as the inferred TS type.

## `appGetByNameTyped(headerId, name, type)`

When you only have the human-readable app title:

```ts
const bom = await bp.style.appGetByNameTyped(headerId, "Bill of Material", "BOM");
bom.data.data?.[0].rowId;      // typed BomRow
bom.data.data?.[0].group;
```

Internally calls `appList(headerId)`, finds the page where `title === name`,
then does the typed get. Throws `Error("App \"X\" not found")` if there's
no match.

## Per-shape data structures

| `appType` | `data` shape (abridged) |
|---|---|
| `Form` | `FormItem[]` — array of `{ id, label, fieldType, value, … }` |
| `Grid` | `{ gridData: { fields: GridField[] }[] }` — array of rows; each row has typed fields |
| `BOM` | `{ data: BomRow[] }` — `BomRow` has `rowId`, `group`, `materialHeaderId`, `quantity`, … |
| `Measurements` | `{ groups: MeasurementGroup[] }` — POMs grouped by region |
| `ImagesForm` | nested `{ form: FormItem[]; images: { ... }[] }` |
| `ImagesGrid` | `{ grid: { ... }; images: { ... } }` |
| `FormGrid` | `{ form: FormItem[]; grid: { rows: ... } }` |
| `ThreeD` | `{ versions: ThreeDVersion[] }` |
| `SampleRequest` | sample-request data with submits and forms |
| `Artboard` | artboard meta + image versions |
| `TextList` | `{ items: TextListItem[]; editor?: string }` |
| `List` | `{ items: ListItem[] }` — each item has its own image |

For exact field types, look at `src/schemas/apps/<type>.ts` — every public
shape exported there matches what you'll see in `data`.

## When to use raw `appGet` instead

`appGet` returns `data: unknown`. Pick that when:

- You don't yet know the app type at compile time.
- You're prototyping and don't want a parse error to interrupt you.
- The schema is intentionally relaxed (the upstream sometimes ships
  unrecognised fields; `appGetTyped` will fail validation on shape drift).

If a `appGetTyped` call starts failing after a server-side change, the
zod error tells you exactly which key is wrong — useful for catching
breaking changes early. To unblock production, fall back to `appGet`,
log the diff, and update the schema.

## Shared endpoints across entity types

Every entity that has apps (style / material / color / image / block)
exposes the same `appList` / `appGet` / `appGetTyped` / `appGetByName` /
`appGetByNameTyped`. The implementation lives in `src/resources/base.ts`
and is re-used via inheritance.

```ts
const styleApps    = await bp.style.appList(styleHeaderId);
const materialApps = await bp.material.appList(materialHeaderId);
const colorApps    = await bp.color.appList(colorHeaderId);
```

## Mutations

The "update" side of apps is also typed-ish:

```ts
await bp.style.appFormUpdate(headerId, appId, {
  fieldId: "designer", value: "Alice",
});
await bp.style.appGridUpdate(headerId, appId, gridUpdates);
await bp.style.appListUpdate(headerId, appId, listUpdates);
```

`appFormUpdate` accepts either a `Record<string, unknown>` (key-value
shorthand) or an `UpdateItem[]` (the API's native shape). The shorthand
is converted via `fieldsToUpdateItems` before going on the wire.

For other shapes (BOM, Measurements, 3D), use the entity-specific
methods (`bomUpdate`, `multiMeasurementsUpdate`, `style3dVersionUpdate`,
etc.) that match the upstream's specialised endpoints.
