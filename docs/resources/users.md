# Users

`bp.user` covers the internal user roster — staff with logins to the
tenant. Smaller surface than the headers; no pagination because the user
roster is typically small.

## List + lookups

```ts
const users = await bp.user.list();
// → UserModel[]   (full roster, no paging)

const u1 = await bp.user.getByEmail("alice@example.com");
const u2 = await bp.user.getById(userId);
```

## Create / update

```ts
const u = await bp.user.create({
  firstName: "Alice",
  lastName: "Doe",
  email: "alice@example.com",
  // any user fields the tenant exposes
});

await bp.user.update(u.id, { firstName: "Alicia" });
```

The user creation flow does **not** auto-issue credentials — that's
handled in the BeProduct admin UI.

## Roles

Roles are a separate, smaller list:

```ts
const roles = await bp.user.roleList();
// → UserRole[]

const role = await bp.user.roleGet(userId);
// → UserRole — the role currently assigned to this user
```

There's no SDK method to assign a role today; create / change role in
the BeProduct UI or via `bp.raw` if needed.

## Where users surface elsewhere

User ids appear on a lot of audit fields:

- `modifiedBy` / `createdBy` on every header and most apps
- `assignedTo[]` on tracking timeline items
- `shareWith[]` on tracking items shared with internal users
- comment + revision authors

If you're enriching log output with names, fetch `bp.user.list()` once at
startup and cache by id.
