import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { BeProductError, type BomVariation } from "../../src/index.js";
import { getClient, DOMAIN, SKIP, ASSET_1KB } from "./setup.js";
import { waitForUpload } from "./helpers.js";

/**
 * BOM variations, live and read-only.
 *
 * Needs a tenant with a BOMVariations app that has variations enabled. Point
 * the suite at one with three env vars (all required, or the suite skips):
 *   BEPRODUCT_BV_FOLDER_ID  style folder id
 *   BEPRODUCT_BV_HEADER_ID  a style in that folder with >= 1 variation
 *   BEPRODUCT_BV_APP_ID     the BOMVariations app id (enableBomVariations: true)
 */
const FOLDER = process.env.BEPRODUCT_BV_FOLDER_ID ?? "";
const HEADER = process.env.BEPRODUCT_BV_HEADER_ID ?? "";
const APP = process.env.BEPRODUCT_BV_APP_ID ?? "";
const SKIP_BV = SKIP || !(FOLDER && HEADER && APP);

const LIST_TIMEOUT = 120_000;

describe.skipIf(SKIP_BV)(`Integration — BOM variations (${DOMAIN}, read-only)`, () => {
  it("reads the two-field-set page schema", async () => {
    const schema = await getClient().style.bomVariationSchema(APP);
    expect(schema.enableBomVariations).toBe(true);
    expect(schema.grid.length).toBeGreaterThan(0);
  });

  it("lists variations and parses each one in full", async () => {
    const client = getClient();
    const listed = await client.style.bomVariationList(HEADER, APP);
    expect(listed.length).toBeGreaterThan(0);

    for (const item of listed) {
      const v = await client.style.bomVariationGet(HEADER, APP, item.id);
      expect(v.id).toBe(item.id);
      expect(Array.isArray(v.rows)).toBe(true);
    }
  }, LIST_TIMEOUT);

  it("can tell a variations-disabled app apart without listing it", async () => {
    // Listing a disabled app would create a default variation server-side, so
    // the schema flag is the only safe way to identify one.
    const client = getClient();
    const pages = await client.style.folderPages(FOLDER);
    const bvApps = pages.filter((p) => p.type === "BOMVariations");
    expect(bvApps.length).toBeGreaterThan(0);

    for (const app of bvApps) {
      const schema = await client.style.bomVariationSchema(app.id).catch(() => null);
      if (schema && !schema.enableBomVariations) {
        expect(schema.metadata).toEqual([]);
      }
    }
  });

  it("reports whether any variation carries populated metadata fields", async () => {
    // Upstream gap in the design doc: every payload seen during design
    // returned []. If this ever reports a non-zero count, the metadata-column
    // path in the ETL handler is exercised by real data.
    const listed = await getClient().style.bomVariationList(HEADER, APP);
    const populated = listed.filter((v) => v.fields.length > 0);
    console.log(`variations with populated metadata.fields: ${populated.length}/${listed.length}`);
    if (populated.length > 0) {
      const sample = populated[0]!.fields[0]!;
      expect(sample).toHaveProperty("id");
      expect(sample).toHaveProperty("value");
    }
  });
});

/**
 * BOM variation ad hoc row image, live and WRITING. Creates a throwaway
 * variation (deleted in afterAll) so nothing pre-existing is touched. Needs the
 * three BEPRODUCT_BV_* vars above plus an explicit opt-in:
 *   BEPRODUCT_BV_WRITE=1
 * Optional: BEPRODUCT_BV_MATERIAL_ID (a material id) enables the 400 check.
 * The app needs a free slot below MaxBomVariations and the style at least one
 * visible colorway.
 */
const WRITE = process.env.BEPRODUCT_BV_WRITE === "1";
const MATERIAL_ID = process.env.BEPRODUCT_BV_MATERIAL_ID ?? "";

describe.skipIf(SKIP_BV || !WRITE)(`Integration — BOM variation row image (${DOMAIN}, writes)`, () => {
  const UPLOAD_TIMEOUT = 180_000;
  let variationId: string;
  let rowId: string;

  beforeAll(async () => {
    // a throwaway variation with one ad hoc row (no materialId)
    let v;
    try {
      v = await getClient().style.bomVariationCreate(HEADER, APP, {
        variationName: `sdk-row-image-${Date.now()}`,
        syncColorways: true,
        rows: [{ rowFields: [] }],
      });
    } catch (e) {
      const err = e as { responseBody?: unknown; message?: string };
      throw new Error(`bomVariationCreate failed: ${err.responseBody ?? err.message}`);
    }
    variationId = v.id;
    rowId = v.rows[0]!.rowId;
  });

  afterAll(async () => {
    if (variationId) await getClient().style.bomVariationDelete(HEADER, APP, variationId);
  });

  it("uploads, reads back, replaces, clears and stays idempotent", async () => {
    const client = getClient();
    const first = await client.style.bomVariationRowImageUpload(HEADER, APP, variationId, rowId, {
      filepath: ASSET_1KB,
    });
    expect(first).toBeTruthy();
    expect(await waitForUpload(client, first!)).toBe(true);
    let row = (await client.style.bomVariationGet(HEADER, APP, variationId)).rows.find(
      (r) => r.rowId === rowId,
    )!;
    expect(row.image).toBeTruthy();
    expect(row.imageId).toBeTruthy();
    expect(row.imageId).toBe(first);
    const firstImageId = row.imageId;

    const second = await client.style.bomVariationRowImageUpload(HEADER, APP, variationId, rowId, {
      filepath: ASSET_1KB,
    });
    expect(second).toBeTruthy();
    expect(await waitForUpload(client, second!)).toBe(true);
    const v = await client.style.bomVariationGet(HEADER, APP, variationId);
    expect(v.rows).toHaveLength(1); // replace did not add a row
    row = v.rows[0]!;
    expect(row.imageId).not.toBe(firstImageId); // replaced
    expect(row.imageId).toBe(second);

    const cleared = await client.style.bomVariationRowImageClear(HEADER, APP, variationId, rowId);
    expect(cleared.rows[0]!.image).toBeNull();
    expect(cleared.rows[0]!.imageId).toBeNull();
    const clearedAgain = await client.style.bomVariationRowImageClear(HEADER, APP, variationId, rowId); // idempotent
    expect(clearedAgain.rows[0]!.imageId).toBeNull();
  }, UPLOAD_TIMEOUT);

  it("uploads, replaces, keeps on edit, clears a pitch image and 404s without a pitch", async () => {
    const client = getClient();
    const colorwayId = (await client.style.get(HEADER)).colorways?.find(c => !c.hideColorway)?.id;
    expect(colorwayId).toBeTruthy();
    const pitch = (v: BomVariation) => v.rows.find(r => r.rowId === rowId)!.colors.find(c => c.colorwayId?.toLowerCase() === colorwayId!.toLowerCase())!;
    await client.style.bomVariationUpdate(HEADER, APP, variationId, { rows: [{ rowId, colorUpdate: [{ colorwayId: colorwayId!, hex: "8d3f2d" }] }] });
    const first = await client.style.bomVariationPitchImageUpload(HEADER, APP, variationId, rowId, colorwayId!, { filepath: ASSET_1KB });
    expect(first).toBeTruthy(); expect(await waitForUpload(client, first!)).toBe(true);
    let p = pitch(await client.style.bomVariationGet(HEADER, APP, variationId));
    expect(p.image).toBeTruthy(); expect(p.imageId).toBe(first);
    const second = await client.style.bomVariationPitchImageUpload(HEADER, APP, variationId, rowId, colorwayId!, { filepath: ASSET_1KB });
    expect(second).toBeTruthy(); expect(await waitForUpload(client, second!)).toBe(true);
    p = pitch(await client.style.bomVariationGet(HEADER, APP, variationId)); expect(p.imageId).toBe(second);
    const edited = await client.style.bomVariationUpdate(HEADER, APP, variationId, { rows: [{ rowId, colorUpdate: [{ colorwayId: colorwayId!, name: "renamed" }] }] });
    expect(pitch(edited).imageId).toBe(second); expect(pitch(edited).name).toBe("renamed");
    const cleared = await client.style.bomVariationPitchImageClear(HEADER, APP, variationId, rowId, colorwayId!);
    expect(pitch(cleared).image).toBeNull(); expect(pitch(cleared).imageId).toBeNull(); expect(pitch(cleared).hex).toBe("8d3f2d");
    expect(pitch(await client.style.bomVariationPitchImageClear(HEADER, APP, variationId, rowId, colorwayId!)).imageId).toBeNull();
    const err = await client.style.bomVariationPitchImageUpload(HEADER, APP, variationId, rowId, "00000000-0000-0000-0000-000000000001", { filepath: ASSET_1KB }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(BeProductError); expect((err as BeProductError).statusCode).toBe(404);
  }, UPLOAD_TIMEOUT);

  // Needs a real material id from the tenant; skipped when BEPRODUCT_BV_MATERIAL_ID is unset.
  it.skipIf(!MATERIAL_ID)("rejects a material-linked row with a 400", async () => {
    const client = getClient();
    const v = await client.style.bomVariationCreate(HEADER, APP, {
      variationName: `sdk-row-image-material-${Date.now()}`,
      rows: [{ materialId: MATERIAL_ID, rowFields: [] }],
    });
    try {
      const err = await client.style
        .bomVariationRowImageUpload(HEADER, APP, v.id, v.rows[0]!.rowId, { filepath: ASSET_1KB })
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(BeProductError);
      expect((err as BeProductError).statusCode).toBe(400);
    } finally {
      await client.style.bomVariationDelete(HEADER, APP, v.id);
    }
  }, UPLOAD_TIMEOUT);
});
