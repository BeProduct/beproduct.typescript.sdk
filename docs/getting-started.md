# Getting started

This guide walks from a fresh install to your first authenticated request.

## 1. Install

In a sibling repo using the workspace pattern:

```json
// package.json
{
  "dependencies": {
    "beproduct": "file:../beproduct.typescript.sdk"
  }
}
```

Or via the internal npm registry:

```bash
npm install beproduct
```

The SDK is **ESM-first** but ships a CJS build for older toolchains. Type
defs live next to both. Node 18+ is required (the SDK relies on the
built-in `fetch` / `undici`).

## 2. Get credentials

You need four things before the SDK will work:

| Variable | Where it comes from |
|---|---|
| `clientId` | The "Client ID" of your BeProduct integration (Settings → Integrations) |
| `clientSecret` | The matching client secret (only shown at creation; copy it then) |
| `refreshToken` | Issued during the OAuth2 flow when an end-user authorises your integration |
| `companyDomain` | The slug in your BeProduct subdomain — `bebrands` if your URL is `bebrands.beproduct.com` |

Stash them in `.env`:

```ini
BEPRODUCT_CLIENT_ID=...
BEPRODUCT_CLIENT_SECRET=...
BEPRODUCT_REFRESH_TOKEN=...
BEPRODUCT_COMPANY_DOMAIN=bebrands
```

## 3. First call

```ts
import { BeProduct } from "beproduct";

const bp = new BeProduct({
  clientId: process.env.BEPRODUCT_CLIENT_ID!,
  clientSecret: process.env.BEPRODUCT_CLIENT_SECRET!,
  refreshToken: process.env.BEPRODUCT_REFRESH_TOKEN!,
  companyDomain: process.env.BEPRODUCT_COMPANY_DOMAIN!,
});

// Hit a cheap endpoint to verify auth + connectivity
const folders = await bp.style.folders();
console.log(`${folders.length} style folders`);
```

If the call returns folders, you're set. If you get a `BeProductError` with
status `401`, recheck the credentials. If it's `0` with a network cause
chain, the host is unreachable from this machine.

## 4. List + iterate

Most listing endpoints return a paged async iterator — pass `pageSize` and
optional `filters`, then loop:

```ts
for await (const style of bp.style.list({
  pageSize: 50,
  filters: [
    { field: "ModifiedAt", operator: "Gt", value: "2024-01-01T00:00:00Z" },
  ],
})) {
  console.log(style.id, style.headerName);
}
```

The iterator stops cleanly when the last page is shorter than `pageSize`.
See [Pagination](pagination.md) for the underlying helpers.

## 5. Where to next

- [Configuration](configuration.md) — every option of the constructor explained
- [Resources overview](resources/index.md) — what `bp.*` exposes
- [Filters](filters.md) — operators and the `dictToFilters` shorthand
- [Errors & retries](errors-and-retries.md) — what to catch and what the SDK already retries
