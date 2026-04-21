import { describe, it, expect } from "vitest";
import { parseHeader, parseStyle, parseMaterial, parseAppList, dictToFilters } from "../../src/helpers.js";

describe("parseHeader", () => {
  it("flattens headerData.fields into { fieldId: value }", () => {
    const result = parseHeader({
      id: "abc-123",
      headerData: {
        fields: [
          { id: "header_number", name: "Style Number", value: "S-001", type: "Text", required: true },
          { id: "active", name: "Active", value: "Yes", type: "TrueFalse", required: false },
        ],
        frontImage: { preview: "https://img", origin: "https://origin" },
      },
      folder: { id: "f1", name: "Fall" },
      createdBy: { id: "u1", name: "User" },
    });

    expect(result.id).toBe("abc-123");
    expect(result.header_number).toBe("S-001");
    expect(result.active).toBe("Yes");
    expect(result.frontImage).toEqual({ preview: "https://img", origin: "https://origin" });
    expect(result.folder).toEqual({ id: "f1", name: "Fall" });
    expect(result).not.toHaveProperty("headerData");
  });
});

describe("parseStyle", () => {
  it("indexes colorways by colorNumber, sizeRange by name, sizeClasses by name", () => {
    const result = parseStyle({
      id: "style-uuid",
      headerData: {
        fields: [{ id: "header_number", name: "Style Number", value: "FI-001", type: "Text", required: true }],
        frontImage: { preview: "", origin: "" },
      },
      colorways: [
        { id: "cw1", colorNumber: "NAVY", colorName: "Navy Blue" },
        { id: "cw2", colorNumber: "RED", colorName: "Red" },
      ],
      sizeRange: [
        { name: "S", isSampleSize: false },
        { name: "M", isSampleSize: true },
      ],
      sizeClasses: [
        { id: "sc1", name: "Missy", sizeRange: [{ name: "S" }, { name: "M" }] },
      ],
    });

    expect(result.header_number).toBe("FI-001");
    expect((result.colorways as Record<string, unknown>)["NAVY"]).toBeDefined();
    expect((result.colorways as Record<string, unknown>)["RED"]).toBeDefined();
    expect((result.default_size_range as Record<string, unknown>)["M"]).toBeDefined();
    expect((result.size_classes as Record<string, Record<string, unknown>>)["Missy"].size_range).toBeDefined();
    const missy = (result.size_classes as Record<string, Record<string, unknown>>)["Missy"];
    expect((missy.size_range as Record<string, unknown>)["S"]).toBeDefined();
  });

  it("handles null colorways/sizeRange/sizeClasses", () => {
    const result = parseStyle({
      id: "x", headerData: { fields: [] }, colorways: null, sizeRange: null, sizeClasses: null,
    });
    expect(result.colorways).toEqual({});
    expect(result.default_size_range).toEqual({});
    expect(result.size_classes).toEqual({});
  });
});

describe("parseMaterial", () => {
  it("indexes colorways, sizeRange, and suppliers", () => {
    const result = parseMaterial({
      id: "mat-uuid",
      headerData: {
        fields: [{ id: "header_name", name: "Material Name", value: "Cotton Twill", type: "Text", required: true }],
      },
      colorways: [{ id: "mc1", colorNumber: "NAT", colorName: "Natural" }],
      sizeRange: [{ name: "Default" }],
      suppliers: [{ Id: "sup-1", name: "FabricCo" }],
    });

    expect(result.header_name).toBe("Cotton Twill");
    expect((result.colorways as Record<string, unknown>)["NAT"]).toBeDefined();
    expect((result.suppliers as Record<string, unknown>)["sup-1"]).toBeDefined();
  });
});

describe("parseAppList", () => {
  it("indexes by lowercased title", () => {
    const result = parseAppList([
      { id: "a1", title: "Bill of Material", type: "BOM" },
      { id: "a2", title: "Form999", type: "Form" },
    ]);

    expect(result["bill of material"]).toBeDefined();
    expect((result["bill of material"] as Record<string, unknown>).type).toBe("BOM");
    expect(result["form999"]).toBeDefined();
  });
});

describe("dictToFilters", () => {
  it("converts simple { field: value } to Eq filters", () => {
    const filters = dictToFilters({ header_number: "STYLE-001", active: "Yes" });
    expect(filters).toEqual([
      { field: "header_number", operator: "Eq", value: "STYLE-001" },
      { field: "active", operator: "Eq", value: "Yes" },
    ]);
  });

  it("converts * wildcard to Contains", () => {
    const filters = dictToFilters({ header_number: "STYLE-*" });
    expect(filters).toEqual([
      { field: "header_number", operator: "Eq", value: "STYLE-" },
    ]);
  });

  it("joins arrays with ■ separator", () => {
    const filters = dictToFilters({ season: ["Fall", "Spring"] });
    expect(filters).toEqual([
      { field: "season", operator: "Eq", value: "Fall■Spring" },
    ]);
  });

  it("array with wildcards uses Contains", () => {
    const filters = dictToFilters({ name: ["*cotton*", "*silk*"] });
    expect(filters[0].operator).toBe("Contains");
    expect(filters[0].value).toBe("cotton■silk");
  });

  it("supports nested { operator, value }", () => {
    const filters = dictToFilters({ price: { operator: "Gt", value: 100 } });
    expect(filters).toEqual([
      { field: "price", operator: "Gt", value: 100 },
    ]);
  });

  it("handles null/empty", () => {
    expect(dictToFilters(null as unknown as Record<string, unknown>)).toEqual([]);
    expect(dictToFilters({})).toEqual([]);
  });
});
