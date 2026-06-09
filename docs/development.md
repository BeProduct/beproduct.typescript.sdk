# Development

## Build

```bash
npm install
npm run typecheck    # tsc --noEmit
npm test             # vitest unit tests
npm run build        # tsup → dist/{index.js,index.cjs,index.d.ts}
```

## Unit tests

`npm test` runs the Vitest unit suite — fully mocked (`fetch` is stubbed),
no network. Layout under `tests/unit/`:

| File | Covers |
|---|---|
| `http.test.ts` | `HttpClient` — URL building, auth header, error mapping, rate-limit parsing, 429 retry/backoff, and **request-timeout abort** (a hung request rejects instead of hanging) |
| `auth.test.ts` | token refresh + caching |
| `pagination.test.ts` | `paginate` / `paginateArray` |
| `helpers.test.ts` | `dictToFilters`, `fieldsToUpdateItems`, parsers |
| `schemas.test.ts` / `field-values.test.ts` | Zod schema parsing |
| `resources/style-writes.test.ts` | style create/update/BOM/3D/sample-request endpoints + bodies |
| `resources/material-writes.test.ts` | material create/update/3D endpoints |
| `resources/other-writes.test.ts` | color/image/block/etc write endpoints |
| `resources/uploads-and-lookup.test.ts` | **typed `position` upload** (front/side/back, main/detail), **`appImageGridUpload`**, and **`getByNumber`** (match + null) |

Write tests as `(method) → (URL, HTTP method, body)` assertions against the
stubbed fetch — see the existing `*-writes.test.ts` files for the pattern.
Upload tests assert the request URL only (the body is `FormData`).

## Integration tests

```bash
BEPRODUCT_INTEGRATION=1 npm run test:integration
```

Requires real credentials in `.env` at repo root:

```ini
BEPRODUCT_CLIENT_ID=...
BEPRODUCT_CLIENT_SECRET=...
BEPRODUCT_REFRESH_TOKEN=...
BEPRODUCT_COMPANY_DOMAIN=bebrands
```

The integration suite hits real endpoints — read-only by design but mind
the rate limit if you run it in a tight loop.

## Source layout

```
src/
├── client.ts          # public BeProduct class — wires resources to the HttpClient
├── http.ts            # HttpClient — auth, rate limit, retries, multipart, body-read recovery
├── auth.ts            # OAuth2TokenManager — refresh-token exchange + caching
├── pagination.ts      # paginate / paginateArray / collectAll
├── helpers.ts         # parseHeader / parseStyle / parseMaterial / parseAppList / dictToFilters / fieldsToUpdateItems
├── errors.ts          # BeProductError + BeProductValidationError + BeProductThrottleError
├── resources/         # one file per resource family
│   ├── base.ts        # BaseResource — list/get/create/update + AppsMixin + comments + revisions + tags
│   ├── style.ts       # StyleResource — colorways, BOM, sets, sample requests, POMs, 3D, artboards
│   ├── material.ts    # MaterialResource — colorways, request pages, 3D textures
│   ├── color.ts       # ColorResource — color library, swatches, cores
│   ├── image.ts       # ImageResource — image library, version uploads
│   ├── block.ts       # BlockResource — block library, size-class assets
│   ├── tracking.ts    # TrackingResource — folders, plans, timelines, milestones, views
│   ├── directory.ts   # DirectoryResource — companies + contacts
│   ├── users.ts       # UserResource — internal user roster + roles
│   ├── data-tables.ts # DataTableResource — reference tables
│   ├── master-data.ts # MasterDataResource — field definitions
│   ├── inbox.ts       # InboxResource — tasks + messages
│   ├── linesheets.ts  # LinesheetsResource — linesheet folders + sheets
│   └── reports.ts     # ReportsResource — report list + data + flat-BOM
└── schemas/           # Zod schemas for response/request bodies
    ├── apps/          # one file per app type (form, grid, bom, measurements, three-d, …)
    ├── style.ts       # style header / colorway / size-range
    ├── material.ts    # material header / colorway
    ├── color.ts       # color / chip
    ├── image.ts       # image header / version
    ├── block.ts       # block header
    ├── tracking.ts    # tracking folder / plan / timeline / view / item
    ├── directory.ts   # company / contact
    ├── users.ts       # user / role
    ├── data-tables.ts # data-table row / schema field
    ├── master-data.ts # master-data field / folder field
    ├── tags.ts        # tag
    └── share.ts       # shared-with partner
```

## Adding a resource

1. Drop `src/resources/<thing>.ts` exporting a class with constructor
   `(http: HttpClient)`. If it exposes apps / comments / revisions /
   tags, extend `BaseResource` and set `entityType` to whatever the
   server route prefix is (`"Style"`, `"Material"`, etc.). Otherwise
   extend nothing and just take `http`.
2. Wire it into `src/client.ts` as a public field on `BeProduct`.
3. Re-export the class from `src/index.ts`.
4. Optional but encouraged: add Zod schemas under `src/schemas/<thing>.ts`
   for typed input/output. If the resource has app shapes, also drop
   schemas under `src/schemas/apps/<shape>.ts` and register them in
   `src/schemas/apps/index.ts` so `appGetTyped` picks them up.
5. Add at least one unit test under `tests/unit/resources/<thing>.test.ts`
   exercising the happy path against a stubbed `HttpClient`.

## Adding a method to an existing resource

1. Find the right resource file. Add the method there.
2. If it's a list endpoint with `{ result, total }`, return
   `AsyncGenerator<T>` via `paginate(pageSize, fetchPage)`.
3. If it's a flat-array list, use `paginateArray`.
4. If it returns a typed shape, declare the return as the schema's
   `z.infer<typeof Schema>`.
5. Add a JSDoc summary if behaviour isn't obvious from the name. Hover
   tooltips in the IDE are the SDK's primary developer-facing docs.
6. Add a unit test stubbing the HttpClient response.

## Schema parsing in tests

```ts
import { StyleHeaderSchema } from "../../src/schemas/style.js";
const parsed = StyleHeaderSchema.parse(fixture);
```

Most schemas use `.passthrough()` so unrecognised fields don't fail —
useful when the server adds new fields between releases. If a field is
load-bearing for downstream code, omit `passthrough()` so a missing
field is caught at parse time.

## Releases

The SDK is workspace-distributed today (file-path dependency in
`package.json`). When a real release is needed:

1. Bump the version in `package.json`.
2. `npm run build`.
3. Tag the release: `git tag sdk-v0.X.0 && git push --tags`.
4. (If publishing to a registry) `npm publish --access restricted`.

There's no changelog file yet — write release notes in the GitHub
release description until we add one.
