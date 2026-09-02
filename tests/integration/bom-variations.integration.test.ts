import { describe, it, expect } from "vitest";
import { getClient, DOMAIN, SKIP } from "./setup.js";

/**
 * BOM variations, live and read-only.
 *
 * Gated on bebrands the same way the shape suite is gated on ltd3: the ids
 * below are hardcoded tenant ids, so the suite is meaningless elsewhere.
 */
const SKIP_BEBRANDS = SKIP || DOMAIN !== "bebrands";

// Verified fixtures on the bebrands tenant.
const FOLDER = "6345e5e2-6cb5-42d5-a5ee-18b36e565a33";
const HEADER = "516d282f-015d-4405-8190-e4ae13d66e7d";
const APP = "48838f65-8ba8-4d14-8727-18a60581d09c";

describe.skipIf(SKIP_BEBRANDS)("Integration — BOM variations (bebrands, read-only)", () => {
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
