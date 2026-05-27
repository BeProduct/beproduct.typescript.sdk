# beproduct.typescript.sdk

Typed TypeScript client for the BeProduct Partner API
(`https://developers.beproduct.com/api/{company}`). Consumed as
`beproduct` workspace dep by `beproduct.dataflow.etl`. Has a public
GitHub remote (`github.com/BeProduct/beproduct.typescript.sdk`).

## Stack

- TypeScript, plain ESM library — no framework
- `zod` for response validation
- `vitest` for tests (integration tests gated by `BEPRODUCT_INTEGRATION=1`)
- `tsup` for the build

## Repo map

```
src/
  client.ts                    BeProduct class — top-level surface, wires every resource
  http.ts                      HttpClient — retry, OAuth token refresh, ratelimit handling
  auth.ts                      OAuth-refresh-token flow → access_token
  pagination.ts                Pageable iterator helper
  helpers.ts                   Misc shared helpers
  errors.ts                    Typed error classes
  resources/
    base.ts                      BaseResource — shared methods
    block.ts, color.ts, ...      One per controller. Constructor takes HttpClient,
                                methods call this.http.get/post/etc.
  schemas/
    <resource>.ts               zod schemas matching API responses
    common.ts                   shared zod types (User, Company, etc.)
tests/
  unit/                        Mocked HttpClient
  integration/                 Hits live API; needs BEPRODUCT_INTEGRATION=1 + .env
```

## Conventions

- **One resource = one controller**. The Partner API has ~18 controllers; the SDK exposes one resource per controller (`bp.users`, `bp.style`, `bp.material`, etc.). Resources are constructed once on `new BeProduct(...)` and exposed via getters.
- **Methods are thin**. A method on a resource typically maps 1:1 to an endpoint — no caching, no batching, no business logic. The shape is `async methodName(args): Promise<TypedResponse> { return this.http.get/post(path, args); }`.
- **Responses validated with zod**. Every method that returns a typed shape parses through `<ResourceSchema>.parse(raw)` before returning. This catches upstream schema drift early and gives consumers a real type, not `any`.
- **Pagination via the helper**. Endpoints returning `{ result, total }` should expose both an eager `list(...)` method and a `listIter(...)` returning the async iterator from `pagination.ts`.
- **No hidden state**. Resources have no mutable state; everything is `readonly`. The HttpClient owns the access-token refresh state.

## Local dev

```bash
npm install
npm run typecheck
npm run test                                    # unit only
BEPRODUCT_INTEGRATION=1 npm run test:integration  # hits live ltd3
```

`tests/integration/setup.ts` reads `.env` for `BEPRODUCT_CLIENT_ID` /
`BEPRODUCT_CLIENT_SECRET` / `BEPRODUCT_REFRESH_TOKEN` / `BEPRODUCT_COMPANY_DOMAIN`.

## Things to avoid

- **Don't add business logic.** This is a thin client. Anything tenant-specific or batched belongs in `beproduct.dataflow.etl` or the consumer.
- **Don't bake hidden retries beyond `http.ts`'s policy**. One retry config, one place.
- **Don't widen response types to `any`**. If the upstream returns something the schema rejects, fix the schema — don't downcast.
- **Don't commit `.env`**. The integration tests use real refresh tokens.

## Cross-references

- Upstream API reference: `../docs/api/00-overview.md` through `17-schemas-reference.md`
- Live swagger: `https://developers.beproduct.com/swagger/v1/swagger.json`
- SDK design notes: `../docs/sdk/requirements.md`
