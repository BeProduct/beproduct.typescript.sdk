# BeProduct TypeScript SDK

Typed, ESM-first client for the [BeProduct Public API](https://developers.beproduct.com).
Wraps OAuth2, paginated endpoints, schema parsing, and the long tail of
resource-specific helpers (BOM, colorways, data tables, sample requests,
tracking plans, …).

> **Status:** internal — distributed via workspace path / private registry.
> Used in production by [`beproduct.dataflow.etl`](../beproduct.dataflow.etl) and
> [`beproduct.dataflow.app`](../beproduct.dataflow.app).

```bash
# workspace setup
"beproduct": "file:../beproduct.typescript.sdk"
# or via internal npm registry
npm install beproduct
```

ESM-first, ships a CJS build for legacy callers. Requires Node 18+ (uses
native `fetch` / `undici`).

```ts
import { BeProduct } from "beproduct";

const bp = new BeProduct({
  clientId: process.env.BEPRODUCT_CLIENT_ID!,
  clientSecret: process.env.BEPRODUCT_CLIENT_SECRET!,
  refreshToken: process.env.BEPRODUCT_REFRESH_TOKEN!,
  companyDomain: "bebrands",     // your tenant slug
});

// Iterate every style modified since some date
for await (const s of bp.style.list({
  pageSize: 50,
  filters: [{ field: "ModifiedAt", operator: "Gt", value: "2024-01-01T00:00:00Z" }],
})) {
  console.log(s.id, s.headerName);
}
```

---

## Documentation

### Getting started
- [Getting started](docs/getting-started.md) — install, first call, environment setup
- [Configuration](docs/configuration.md) — auth modes, tenant domain, headers, custom token endpoint
- [Resources overview](docs/resources/index.md) — what each `bp.*` exposes

### Per-resource guides
- [Headers (style / material / color / image / block)](docs/resources/headers.md) — the shared `BaseResource` surface: `list`, `get`, `create`, `update`, `folders`, comments, revisions, tags
- [Style](docs/resources/style.md) — colorways, BOM, sets, sample requests, points-of-measure, 3D, artboards
- [Material](docs/resources/material.md) — colorways, request pages, 3D textures
- [Color](docs/resources/color.md) — color library, color chips, company colors
- [Image](docs/resources/image.md) — image library, version uploads
- [Block](docs/resources/block.md) — block library, size-class assets
- [Apps](docs/resources/apps.md) — `appList`, `appGet`, `appGetTyped`, `appFormUpdate`, `appGridUpdate`, attachments
- [Tracking](docs/resources/tracking.md) — folders, plans, timelines, milestones, views
- [Directory](docs/resources/directory.md) — companies + contacts
- [Users](docs/resources/users.md) — internal user roster + roles
- [Data tables](docs/resources/data-tables.md) — reference tables, schema, rows, updates
- [Master data](docs/resources/master-data.md) — field definitions for forms/grids/lists
- [Inbox](docs/resources/inbox.md) — tasks + messages
- [Linesheets](docs/resources/linesheets.md) — linesheet folders + sheets
- [Reports](docs/resources/reports.md) — report list + data + flat-BOM

### Cross-cutting concerns
- [Pagination](docs/pagination.md) — `paginate`, `paginateArray`, `collectAll`, page-size strategy
- [Filtering](docs/filters.md) — `SearchFilter` shape, operators, `dictToFilters`
- [Typed apps](docs/typed-apps.md) — Zod schemas for `Form` / `Grid` / `BOM` / `Measurements` / `ImagesForm` / etc.
- [Errors & retries](docs/errors-and-retries.md) — error classes, network retries, throttling, rate-limit headers
- [File uploads](docs/file-uploads.md) — `FileInput`, `filepath` / `fileUrl` / `buffer`
- [Raw escape hatch](docs/raw.md) — `bp.raw` for endpoints not yet wrapped
- [Development](docs/development.md) — build, typecheck, integration tests, adding a resource

---

## License

MIT.
