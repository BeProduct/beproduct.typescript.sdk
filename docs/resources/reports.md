# Reports

`bp.reports` covers the saved-report feature — pre-defined queries with
parameters, useful for export pipelines and dashboards.

## List available reports

```ts
const { result, total } = await bp.reports.list();
// → { result: unknown[], total: number }
//   each entry: { id, name, description, ... }
```

## Run a report

```ts
// By id
const data = await bp.reports.dataById(reportId, {
  // body shape depends on the report's parameters — usually { filters: ... }
  filters: [{ field: "Status", operator: "Eq", value: "Active" }],
});

// Or pass a full report definition (legacy / one-off)
const data2 = await bp.reports.data({ /* full definition */ });
```

The returned shape is intentionally `unknown` — each report has its own
column layout. Inspect once with `console.log(data)` and pick out the
keys you need.

## Flat-BOM rollup

```ts
const flat = await bp.reports.flatBom({
  // headers, depth, filters, etc.
});
```

Returns the BOM rolled up across the requested headers — useful for
costing and procurement workflows.

## Common pattern

1. List reports once at startup; cache the `id → name` map.
2. For each scheduled run, call `dataById(reportId, params)`.
3. Stream the result rows into your warehouse / spreadsheet / PDF.

If the report's volume is large, push the filtering server-side via the
`body` rather than post-filtering in the client — most report endpoints
accept the standard `filters: SearchFilter[]` shape.
