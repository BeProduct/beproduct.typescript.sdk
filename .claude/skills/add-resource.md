---
name: add-resource
description: Add a new resource class wrapping a BeProduct Partner API controller (or a new method on an existing one). Use when the user asks to "add support for the X controller", "wrap the Y endpoint", or wants SDK coverage of a previously-undocumented endpoint surfaced by the swagger.
---

A resource = one BeProduct API controller. Adding one is mostly a
file-creation + registration exercise; the patterns are stable.

Steps:

1. **Confirm the endpoint exists in swagger**. Fetch and grep:
   ```bash
   curl -fsSL https://developers.beproduct.com/swagger/v1/swagger.json \
     | jq -r '.paths | keys[]' | grep -i <controller>
   ```
   Note the HTTP method, path, request/response shape.

2. **Pick the closest existing resource as a template**.
   - Simple CRUD (`bp.users`): see `src/resources/users.ts` + `src/schemas/users.ts`
   - Paginated list with filters (`bp.style`, `bp.material`): see `src/resources/style.ts`
   - Resource with sub-collections (`bp.tracking`): see `src/resources/tracking.ts`

3. **Write the zod schema** in `src/schemas/<resource>.ts`. Match the
   exact shape swagger says — `nullable()`, `optional()` etc. matter.
   Re-use shared types from `schemas/common.ts` (`UserSchema`,
   `CompanySchema`, etc.).

4. **Write the resource class** in `src/resources/<resource>.ts`. Each
   method:
   ```ts
   async someAction(args: SomeArgs): Promise<SomeShape> {
     const raw = await this.http.get/post(`<path>`, args);
     return SomeShapeSchema.parse(raw);
   }
   ```
   Use `this.http.paginated(...)` for `{result, total}` endpoints when
   adding an iterator method.

5. **Wire it into the client** in `src/client.ts`:
   ```ts
   import { NewResource } from "./resources/new-resource.js";
   export class BeProduct {
     readonly newResource: NewResource;
     constructor(...) {
       this.newResource = new NewResource(this.raw);
     }
   }
   ```
   Use camelCase for the property; match existing names (`bp.user`,
   `bp.dataTable`, etc.).

6. **Tests**:
   - **Unit** in `tests/unit/<resource>.test.ts`: mock the HttpClient,
     verify the method calls the right path + parses the response.
   - **Integration** in `tests/integration/<resource>.test.ts` (only if
     the endpoint is safe to call read-only — never anything that
     creates/mutates upstream data).

7. **Update docs** in `../docs/api/<chapter>.md` if the SDK covers a
   new endpoint that wasn't documented yet. The API docs are
   discovery-driven; new endpoints should be added when they're
   wrapped.

Conventions:
- One method per swagger operation. No "convenience" wrappers that
  hide the underlying call shape.
- All paths are relative to the Partner API base; HttpClient prepends
  `{company}` automatically.
- Public method names are lowerCamelCase verbs (`list`, `get`,
  `update`, `roleList`, `roleGet` — never `getList`).
- If swagger says `optional`, your zod schema uses `.optional()` not
  `.nullable()` (unless the API actually returns `null`).
