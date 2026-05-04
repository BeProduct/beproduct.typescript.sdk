# Linesheets

`bp.linesheets` covers the linesheet feature — visual grids of styles
laid out for buyer presentations.

## Folders + listing

```ts
const folders = await bp.linesheets.listFolders();
// → [{ id, name }]

const sheets = await bp.linesheets.list(folderId);
// → unknown — the array of linesheets in that folder

// Or list every linesheet in the tenant
const allSheets = await bp.linesheets.list();
```

Returned shapes are `unknown` because the linesheet payload has a
non-trivial nested structure that varies per tenant. Inspect once via
`console.log` or `appGet` style probes and pick out the keys you need.

## Get one

```ts
const sheet = await bp.linesheets.get(linesheetId);
// → unknown — single sheet with nested style references
```

A linesheet typically references styles by header id and stores layout
metadata (positions, captions, alignment). Walk the object once to
understand the shape.

## When to use

- Auto-generating linesheet PDFs for buyer meetings — fetch the sheet,
  hydrate each style by id, render.
- Sync sheets to an external presentation tool — same flow.

The SDK doesn't yet wrap sheet creation / mutation; use
[`bp.raw`](../raw.md) if you need to write.
