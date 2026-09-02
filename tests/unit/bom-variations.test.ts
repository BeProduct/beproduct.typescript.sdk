import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BomVariationSchema,
  BomVariationMetadataSchema,
  BomVariationsPageSchemaSchema,
} from "../../src/schemas/bom-variations.js";

const fx = (name: string) =>
  JSON.parse(readFileSync(join(__dirname, "../fixtures/bom-variations", name), "utf8"));

describe("BOM variation schemas", () => {
  it("parses a variation with rows, pitches, an ad-hoc row and null material fields", () => {
    const v = BomVariationSchema.parse(fx("variation-with-pitches.json"));
    expect(v.metadata.variationName).toBe("BOM 02");
    expect(v.rows).toHaveLength(2);

    const first = v.rows[0]!;
    expect(first.materialNumber).toBe("MAT-THD-0000500");
    expect(first.isAdHoc).toBe(false);
    expect(first.colors).toHaveLength(2);
    expect(first.colors[0]!.materialColorwayId).toBe("7dfcd3db-26d5-48e4-980d-f0bb78eaadd1");
    expect(first.colors[0]!.colorSourceId).toBeNull();
    expect(first.fields.find((f) => f.id === "uom")?.value).toBe("m");

    // ad-hoc row: null materialId/folderType/version, non-null parentRowId
    const adhoc = v.rows[1]!;
    expect(adhoc.isAdHoc).toBe(true);
    expect(adhoc.materialId).toBeNull();
    expect(adhoc.version).toBeNull();
    expect(adhoc.parentRowId).toBe("e11f5174-2020-4310-922d-18006f7ca907");
    expect(adhoc.group).toBe("grp-1");
  });

  it("parses a variation-list metadata item", () => {
    const listed = fx("list-enabled.json").data[0];
    const m = BomVariationMetadataSchema.parse(listed);
    expect(m.variationName).toBe("Design BOM");
    expect(m.isDefault).toBe(true);
    expect(m.selectedVariationColorways).toEqual([]);
  });

  it("parses the two-field-set PageSchema and keeps the tenant metadata field", () => {
    const s = BomVariationsPageSchemaSchema.parse(fx("page-schema.json"));
    expect(s.enableBomVariations).toBe(true);
    expect(s.metadata.map((f) => f.fieldId)).toContain("region_3");
    expect(s.grid).toHaveLength(9);
  });
});
