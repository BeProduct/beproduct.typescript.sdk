import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { getClient, DOMAIN, SKIP_PARITY, ASSET_1KB } from "./setup.js";
import { loadFixtures, type Fixtures } from "./fixtures.js";
import { TrashBin, createTmpStyle, waitForUpload } from "./helpers.js";

// Write coverage for app-part mutations beyond the basic Form/Grid/List apps:
//  - the general PageForm / PageGrid endpoints applied to FormGrid (which has
//    both parts) and the ImagesGrid image-list,
//  - the per-app endpoints for TextList, SKU, BOM, Sets, MultiMeasurements.
// All run on throwaway styles created in the style folder (same app config as
// the GETME style), and are cleaned up afterwards.
describe.skipIf(SKIP_PARITY)("Integration — app updates (writes)", () => {
  const client = SKIP_PARITY ? (null as never) : getClient();
  let fx: Fixtures;
  let trash: TrashBin;

  beforeAll(() => {
    fx = loadFixtures(DOMAIN);
  });
  beforeEach(() => {
    trash = new TrashBin(client);
  });
  afterEach(async () => {
    await trash.cleanup();
  });

  // ── FormGrid: general PageForm + PageGrid on an app that has both parts ──
  it("FormGrid: updates the form part", async () => {
    const tmp = await createTmpStyle(client, fx, trash);
    const before = (await client.style.appGet(tmp.id, fx.formgridApp.id)) as any;
    const field = (before.data.form as any[]).find((f) => f.type === "Text");
    expect(field, "FormGrid has no Text field").toBeTruthy();

    await client.style.appFormUpdate(tmp.id, fx.formgridApp.id, { [field.id]: "fg-form-updated" });

    const after = (await client.style.appGet(tmp.id, fx.formgridApp.id)) as any;
    const updated = (after.data.form as any[]).find((f) => f.id === field.id);
    expect(updated.value).toBe("fg-form-updated");
  });

  it("FormGrid: inserts a grid row", async () => {
    const tmp = await createTmpStyle(client, fx, trash);
    const rowId = randomUUID();
    // The FormGrid grid's required columns (from its schema): combo_box, date,
    // measure, multi_select, partner_drop_down, percent. Date must be a Z string;
    // partner_drop_down takes a partner code.
    await client.style.appGridUpdate(tmp.id, fx.formgridApp.id, [
      {
        rowId,
        rowFields: [
          { id: "combo_box", value: "Choice 3" },
          { id: "date", value: "2021-08-01T00:00:00Z" },
          { id: "measure", value: 1 },
          { id: "multi_select", value: "Choice 1" },
          { id: "partner_drop_down", value: "ff38d2b7-7fd0-4e36-8d37-8bf1b7019da7" },
          { id: "percent", value: 0.1 },
        ],
      },
    ]);
    const app = (await client.style.appGet(tmp.id, fx.formgridApp.id)) as any;
    const rows = (app.data.grid?.gridData ?? app.data.grid) as any[];
    expect(rows.some((r) => r.rowId === rowId)).toBe(true);
  });

  // ── ImagesGrid image-list (PageImagesGrid/List) — newly added SDK method ──
  it("ImagesGrid: inserts an image-list item", async () => {
    const tmp = await createTmpStyle(client, fx, trash);
    const itemId = randomUUID();
    await client.style.appImagesGridListUpdate(tmp.id, fx.imagegridApp.id, [
      { itemId, itemFields: [{ id: "text", value: "ig-list-item" }] },
    ]);
    const app = (await client.style.appGet(tmp.id, fx.imagegridApp.id)) as any;
    const images = app.data.image as any[];
    expect(images.some((i) => i.id === itemId)).toBe(true);
  });

  // ── TextList: editor data + list items ──
  it("TextList: updates editor data", async () => {
    const tmp = await createTmpStyle(client, fx, trash);
    await client.style.textListEditorUpdate(tmp.id, fx.textlistApp.id, "<p>hello from test</p>");
    const app = (await client.style.appGet(tmp.id, fx.textlistApp.id)) as any;
    expect(app.data.text).toContain("hello from test");
  });

  it("TextList: inserts a list item", async () => {
    const tmp = await createTmpStyle(client, fx, trash);
    const itemId = randomUUID();
    await client.style.textListUpdate(tmp.id, fx.textlistApp.id, [
      { itemId, itemFields: [{ id: "text", value: "tl-item" }] },
    ]);
    const app = (await client.style.appGet(tmp.id, fx.textlistApp.id)) as any;
    const items = app.data.images as any[];
    expect(items.some((i) => i.id === itemId)).toBe(true);
  });

  // ── SKU: generate from colorways×sizes, then update a field ──
  // The SKU parser 500s on colorways with no swatch image (colorImage=0), so
  // upload a swatch to each colorway before generating.
  it(
    "SKU: generates and updates",
    async () => {
      const tmp = await createTmpStyle(client, fx, trash, {
        colorways: fx.tmpStyleColorwayFields,
        sizes: fx.tmpStyleSizes,
      });
      for (const cw of tmp.colorways as any[]) {
        const uid = await client.style.colorwayUpload(tmp.id, { filepath: ASSET_1KB }, { colorwayId: cw.id });
        if (uid) await waitForUpload(client, uid);
      }

      await client.style.skuGenerate(tmp.id, fx.skuApp.id);
      let skus = ((await client.style.appGet(tmp.id, fx.skuApp.id)) as any).data as any[];
      expect(skus.length, "no skus generated").toBeGreaterThan(0);

      const sku = skus[0];
      await client.style.skuUpdate(tmp.id, fx.skuApp.id, [
        { id: sku.id, fields: [{ id: "number", value: "999" }] },
      ]);

      skus = ((await client.style.appGet(tmp.id, fx.skuApp.id)) as any).data as any[];
      const updated = skus.find((s) => s.id === sku.id);
      const numberField = (updated.fields as any[]).find((f) => f.id === "number");
      expect(`${numberField.value}`).toBe("999");
    },
    120_000,
  );

  // ── BOM: insert a material row, delete it, reset ──
  it("BOM: inserts then deletes a material row", async () => {
    const tmp = await createTmpStyle(client, fx, trash);
    await client.style.bomUpdate(tmp.id, fx.bomApp.id, [
      { materialIdToInsert: fx.materialHeader.id },
    ]);
    let app = (await client.style.appGet(tmp.id, fx.bomApp.id)) as any;
    const rows = (app.data.data ?? []) as any[];
    expect(rows.length, "BOM row not inserted").toBeGreaterThan(0);
    const rowId = rows[0].rowId;

    await client.style.bomItemDelete(tmp.id, fx.bomApp.id, rowId);
    app = (await client.style.appGet(tmp.id, fx.bomApp.id)) as any;
    const after = (app.data.data ?? []) as any[];
    expect(after.some((r) => r.rowId === rowId)).toBe(false);
  });

  // ── Sets: insert a style ──
  // KNOWN BACKEND BUG (not config/payload): PublicPageSetsHelper reads the group
  // field choices with `(Properties["Choices"] as JArray).FirstOrDefault(...)`.
  // The choices ARE configured (Main/Secondary/Tertiary) but aren't a literal
  // JArray instance, so `as JArray` → null → ArgumentNullException. CBomHelper
  // does the same thing with `JArray.FromObject(...)` (coerces) and works — so
  // the fix is to mirror that in PublicPageSetsHelper (UpsertStyleInPage +
  // InsertStyleIntoPage). Verified independent of payload. Re-enable after fix.
  it.skip("Sets: inserts a style", async () => {
    const tmp = await createTmpStyle(client, fx, trash);
    await client.style.setsUpdate(tmp.id, fx.setsApp.id, [
      {
        styleIdToInsert: fx.style.id,
        styleUpdate: { rowId: randomUUID(), rowFields: [{ id: "group", value: "Main" }] },
      },
    ]);
    const app = (await client.style.appGet(tmp.id, fx.setsApp.id)) as any;
    const rows = (app.data.data ?? []) as any[];
    expect(rows.length, "Sets row not inserted").toBeGreaterThan(0);
  });

  // ── BOMDetails: add a material then remove it (self-cleaning) ──
  // Per the backend helper, `materials[].id` is the material id; deleteMaterial
  // false → add, true → remove. The material must be in the BOM first.
  it("BOMDetails: adds then removes a material", async () => {
    const tmp = await createTmpStyle(client, fx, trash);
    const matId = fx.materialHeader.id;
    await client.style.bomUpdate(tmp.id, fx.bomApp.id, [{ materialIdToInsert: matId }]);

    await client.style.bomDetailsUpdate(tmp.id, fx.bomDetailsApp.id, [
      { id: matId, deleteMaterial: false },
    ]);
    let rows = (await client.style.appGet(tmp.id, fx.bomDetailsApp.id)).data as any[];
    expect(rows.some((r) => r.id === matId), "material not added to BOM details").toBe(true);

    await client.style.bomDetailsUpdate(tmp.id, fx.bomDetailsApp.id, [
      { id: matId, deleteMaterial: true },
    ]);
    rows = (await client.style.appGet(tmp.id, fx.bomDetailsApp.id)).data as any[];
    expect(rows.some((r) => r.id === matId)).toBe(false);
  });

  // ── MultiMeasurements: upsert a POM on the pre-configured UPDATETEST style ──
  // (needs an existing sizeClass + POM, which a fresh tmp style doesn't have).
  // Idempotent: sets a known value on a known POM, so re-runs stay clean.
  it("MultiMeasurements: updates a POM", async () => {
    const ut = fx.updateTest;
    const desc = "POM updated by integration test";
    await client.style.multiMeasurementsUpdate(ut.styleId, ut.multiMeasurements.appId, {
      sizeClass: ut.multiMeasurements.sizeClassId,
      poms: [{ id: ut.multiMeasurements.pomId, code: "MPM", pointOfMeasure: desc }],
    });
    const app = (await client.style.appGet(ut.styleId, ut.multiMeasurements.appId)) as any;
    const sc = (app.data.sizeClasses as any[]).find(
      (s) => s.sizeClass?.id === ut.multiMeasurements.sizeClassId,
    );
    const pom = (sc.poms as any[]).find((p) => p.id === ut.multiMeasurements.pomId);
    expect(pom, "POM not found").toBeTruthy();
    expect(pom.pointOfMeasure).toBe(desc);
  });
});
