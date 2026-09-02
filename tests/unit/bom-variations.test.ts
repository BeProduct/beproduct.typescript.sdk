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

import { StyleResource } from "../../src/resources/style.js";
import type { HttpClient } from "../../src/http.js";

function styleWithResponses(responses: Record<string, unknown>) {
  const calls: Array<{ path: string; query?: Record<string, unknown> }> = [];
  const http = {
    get: async (path: string, query?: Record<string, unknown>) => {
      calls.push({ path, query });
      if (!(path in responses)) throw new Error(`unexpected GET ${path}`);
      return responses[path];
    },
  } as unknown as HttpClient;
  return { style: new StyleResource(http), calls };
}

describe("StyleResource BOM variation methods", () => {
  it("normalises the enabled-app list (array data) into metadata items", async () => {
    const { style, calls } = styleWithResponses({ "Style/Page": fx("list-enabled.json") });
    const out = await style.bomVariationList("h1", "a1");

    expect(out).toHaveLength(2);
    expect(out.map((v) => v.variationName)).toEqual(["Design BOM", "Production BOM"]);
    expect(out[0]!.isDefault).toBe(true);
    expect(calls[0]).toEqual({ path: "Style/Page", query: { headerId: "h1", pageId: "a1" } });
  });

  it("normalises the disabled-app list (single object data) into one metadata item", async () => {
    const { style } = styleWithResponses({ "Style/Page": fx("list-disabled.json") });
    const out = await style.bomVariationList("h1", "a2");

    expect(out).toHaveLength(1);
    expect(out[0]!.id).toBe("b7140508-51d4-4504-97d9-f772d30b9edc");
  });

  it("returns an empty list when data is null", async () => {
    const { style } = styleWithResponses({ "Style/Page": { id: "a", headerId: "h", data: null } });
    expect(await style.bomVariationList("h", "a")).toEqual([]);
  });

  it("fetches one variation by id", async () => {
    const { style, calls } = styleWithResponses({
      "Style/h1/PageBomVariation/a1/Variation/v1": fx("variation-with-pitches.json"),
    });
    const v = await style.bomVariationGet("h1", "a1", "v1");

    expect(v.rows).toHaveLength(2);
    expect(calls[0]!.path).toBe("Style/h1/PageBomVariation/a1/Variation/v1");
  });

  it("fetches the two-field-set page schema", async () => {
    const { style, calls } = styleWithResponses({ "Style/PageSchema": fx("page-schema.json") });
    const s = await style.bomVariationSchema("a1");

    expect(s.enableBomVariations).toBe(true);
    expect(calls[0]).toEqual({ path: "Style/PageSchema", query: { pageId: "a1" } });
  });
});
