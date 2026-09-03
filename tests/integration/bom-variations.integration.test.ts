import { describe, it, expect } from "vitest";
import { getClient, DOMAIN, SKIP } from "./setup.js";

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
  });

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
