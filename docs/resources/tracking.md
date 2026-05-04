# Tracking

`bp.tracking` covers tracking plans, milestones, timelines, and views.
The tracking model has more pieces than other resources, so this guide
walks the data model first.

## Data model

```
folder ──▶ plan ──▶ milestones (definitions, in plan.style.timelines / plan.material.timelines)
              │
              ├──▶ style timelines     ──▶ items (one per milestone, each with status + dates)
              │     └─ views (style-side projections of fields)
              │
              └──▶ material timelines  ──▶ items (one per milestone, each with status + dates)
                    └─ views (material-side projections of fields)
```

Concretely:

- A **plan** has milestone *definitions* on its `style` and `material`
  setups (e.g. "Kick Off", "Design Sketches", "PP Sample Approved").
- For each style or material added to the plan, the API generates a
  **timeline** row — one per (header, colorway, size, supplier).
- For each timeline row, the API materialises **items** — one per
  milestone definition, with `status`, `plan` (planned date), `rev`,
  `final`, and `due`.
- A plan also defines **views** — saved column projections that mix
  custom fields (e.g. `uk_qty`, `fob`) with milestone snapshots.

## Folders + plans

```ts
const folders = await bp.tracking.folders();
// → TrackingFolder[]

for await (const plan of bp.tracking.planList({
  folderId: folder.id,
  pageSize: 50,
})) {
  console.log(plan.id, plan.name);
}

const plan = await bp.tracking.planGet(planId);
// → TrackingPlan with embedded `style`, `material`, milestone defs, and views
```

`planList` accepts `filters` (e.g. `ModifiedAt Gte` for incremental
syncs) and a `folderId` query parameter.

## Style timelines

```ts
// Stream every style timeline on a plan
for await (const tl of bp.tracking.styleTimelineList(planId, { pageSize: 30 })) {
  console.log(tl.id, tl.header.headerNumber, tl.colorName);
  for (const item of tl.timelines ?? []) {
    console.log(`  ${item.status} (planned ${item.plan})`);
  }
}

// With a server-side filter (works for incremental syncs):
for await (const tl of bp.tracking.styleTimelineList(planId, {
  filters: [{ field: "ModifiedAt", operator: "Gte", value: since.toISOString() }],
  pageSize: 30,
})) { /* … */ }
```

The timeline object has the parent `header`, `color*`, `size`,
`supplier`, `isArchived`, plus the `timelines: TimelineItem[]` array of
milestone instances.

> **API quirk:** in the response, each item has both an `id` (the item's
> own surrogate) and a `timelineId` field. The `timelineId` field
> actually points at the **milestone definition id**, not the parent
> timeline. The C# old dataflow renames it to `PlanTimelineId` to
> reduce confusion.

## Material timelines

Identical surface, mirrored on the material side:

```ts
for await (const tl of bp.tracking.materialTimelineList(planId, { pageSize: 30 })) {
  /* … */
}
```

## Mutations on style timelines

```ts
// Edit milestone dates / statuses across multiple rows in one call
await bp.tracking.styleTimelineUpdate(planId, [
  {
    id: timelineId,
    timelines: [
      { id: milestoneId, status: { value: "Approved" }, final: { value: today } },
    ],
  },
]);

// Soft delete (Archive) timelines
await bp.tracking.styleTimelinesArchive(planId, [timelineId1, timelineId2]);

// Hard delete
await bp.tracking.styleTimelinesDelete(planId, [timelineId1]);

// Add styles to a plan (creates new timelines)
await bp.tracking.styleAdd(planId, [styleHeaderId1, styleHeaderId2]);
await bp.tracking.styleByColorwayAdd(planId, body);
const created = await bp.tracking.styleBySkuAdd(planId, body);
// → [{ id, headerId, headerFolderId }]
```

`styleByColorwayAdd` and `styleBySkuAdd` let you add a more granular set
of timelines (per colorway / per SKU) rather than per header.

## Material side mutations

```ts
await bp.tracking.materialTimelineUpdate(planId, body);
await bp.tracking.materialTimelinesDelete(planId, [timelineId]);
await bp.tracking.materialAdd(planId, [materialHeaderId]);
```

## Tracking views

Views are server-defined column projections per plan (custom fields plus
milestone snapshots). Read them as a stream:

```ts
for await (const row of bp.tracking.styleTrackingView(planId, viewId, { pageSize: 20 })) {
  console.log(row.id, row.fields);
  // each field: { field, label, type, value, valueId? }
}

for await (const row of bp.tracking.materialTrackingView(planId, viewId, { pageSize: 20 })) {
  /* … */
}
```

Each row mirrors a timeline (`row.id` is the timeline id) with the view's
specific projection in `fields[]`. Field values can be primitives or
embedded TimelineItem objects (milestone snapshots).

> **Watch out:** some views are server-side broken and will reset the
> connection mid-response. The dataflow ETL caches per-(view, master_folder)
> failures within a run so subsequent plans skip the broken view. If you
> see `BeProductError: body read error after 4 attempts: terminated →
> ECONNRESET`, that's the symptom.

## Plan progress

```ts
const styleProg = await bp.tracking.styleProgress(planId);
// → PlanProgress: { not_started, in_progress, waiting_on, rejected,
//                    approved, approved_with_corrections, na, late, total }

const materialProg = await bp.tracking.materialProgress(planId);
```

Useful for dashboards — the counts roll up the milestone status across
every timeline in the plan.

## Style revisions

```ts
for await (const r of bp.tracking.styleRevisions(planId, { pageSize: 20 })) {
  /* revision history of style rows in the plan */
}
```

## Common patterns

### Incremental sync

```ts
const since = lastSyncedAt;
const sinceFilter = since
  ? [{ field: "ModifiedAt", operator: "Gte", value: since.toISOString() }]
  : [];

const folders = await bp.tracking.folders();
for (const f of folders) {
  for await (const plan of bp.tracking.planList({ folderId: f.id, pageSize: 50 })) {
    // Skip plans that didn't change client-side, since planList doesn't
    // accept a server-side filter for ModifiedAt:
    if (since && plan.modifiedAt && new Date(plan.modifiedAt) < since) continue;

    for (const mf of ["STYLE", "MATERIAL"] as const) {
      const stream = mf === "STYLE"
        ? bp.tracking.styleTimelineList(plan.id, { filters: sinceFilter, pageSize: 30 })
        : bp.tracking.materialTimelineList(plan.id, { filters: sinceFilter, pageSize: 30 });
      for await (const tl of stream) { /* ... */ }
    }
  }
}
```

### Reconcile deletes (the "COUNT trick")

Mirroring the C# pattern: keep a local list of timeline ids; periodically
fetch survivors with `Id IN (local_ids)`; delete locally any id missing
from the survivor set:

```ts
const localIds = ["a", "b", "c"];
const idFilter = [{ field: "Id", operator: "In", value: localIds }];
const survivors = new Set<string>();
for await (const tl of bp.tracking.styleTimelineList(planId, { filters: idFilter, pageSize: 100 })) {
  survivors.add(tl.id);
}
const deleted = localIds.filter((id) => !survivors.has(id));
```

Cheap when nothing changed (one round-trip), accurate when the plan got
restructured.
