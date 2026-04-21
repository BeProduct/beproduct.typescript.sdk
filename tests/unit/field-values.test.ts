import { describe, it, expect } from "vitest";
import {
  FieldValueSchemas,
  parseFieldValue,
  ColorDropDownValueSchema,
  PartnerDropDownValueSchema,
  CompositeControlValueSchema,
  UsersTagsValueSchema,
  ColorwayFieldValueSchema,
  FieldSearchOperators,
} from "../../src/schemas/field-values.js";

describe("FieldValueSchemas", () => {
  // ── String types ──
  it.each(["Text", "Memo", "ComboBox", "DropDown", "LabelText", "UserLabel", "Users"])
    ("%s → string | null", (type) => {
      expect(FieldValueSchemas[type].safeParse("hello").success).toBe(true);
      expect(FieldValueSchemas[type].safeParse(null).success).toBe(true);
    });

  // ── Number (int) ──
  it("Number → number | null", () => {
    expect(FieldValueSchemas.Number.safeParse(42).success).toBe(true);
    expect(FieldValueSchemas.Number.safeParse(null).success).toBe(true);
    expect(FieldValueSchemas.Number.safeParse("42").success).toBe(false);
  });

  // ── Number (double) ──
  it.each(["Decimal", "Percent", "Currency", "Weight", "Measure"])
    ("%s → number | null", (type) => {
      expect(FieldValueSchemas[type].safeParse(3.14).success).toBe(true);
      expect(FieldValueSchemas[type].safeParse(null).success).toBe(true);
    });

  // ── FormulaField → number | string | null ──
  it("FormulaField → number | string | null", () => {
    expect(FieldValueSchemas.FormulaField.safeParse(4).success).toBe(true);
    expect(FieldValueSchemas.FormulaField.safeParse("calculated").success).toBe(true);
    expect(FieldValueSchemas.FormulaField.safeParse(null).success).toBe(true);
  });

  // ── Date → ISO string ──
  it.each(["Date", "DateTime"])
    ("%s → string (ISO 8601) | null", (type) => {
      expect(FieldValueSchemas[type].safeParse("2026-03-09T17:47:12.849Z").success).toBe(true);
      expect(FieldValueSchemas[type].safeParse(null).success).toBe(true);
    });

  // ── Boolean types ──
  it("TrueFalse → 'Yes'/'No' or boolean | null", () => {
    expect(FieldValueSchemas.TrueFalse.safeParse("Yes").success).toBe(true);
    expect(FieldValueSchemas.TrueFalse.safeParse("No").success).toBe(true);
    expect(FieldValueSchemas.TrueFalse.safeParse(true).success).toBe(true);
    expect(FieldValueSchemas.TrueFalse.safeParse(null).success).toBe(true);
  });

  it("Label3dMaterial → boolean | string | null", () => {
    expect(FieldValueSchemas.Label3dMaterial.safeParse(false).success).toBe(true);
    expect(FieldValueSchemas.Label3dMaterial.safeParse("No").success).toBe(true);
  });

  // ── String arrays ──
  it("MultiSelect → string[] | null", () => {
    expect(FieldValueSchemas.MultiSelect.safeParse(["Choice 1", "Choice 2"]).success).toBe(true);
    expect(FieldValueSchemas.MultiSelect.safeParse([]).success).toBe(true);
    expect(FieldValueSchemas.MultiSelect.safeParse(null).success).toBe(true);
  });

  it("Tags → string[] | null", () => {
    expect(FieldValueSchemas.Tags.safeParse(["tag1"]).success).toBe(true);
  });

  // ── ColorDropDown (full color object) ──
  it("ColorDropDown → DefaultColor object | null", () => {
    const color = {
      Id: "57a431b0-uuid",
      hex: "ff86ab",
      rgb_r: 255, rgb_g: 134, rgb_b: 171,
      cmyk_c: 0, cmyk_m: 0.47, cmyk_y: 0.33, cmyk_k: 0,
      hsl_h: 341.65, hsl_s: 1, hsl_l: 0.76,
      hsb_h: 341.65, hsb_s: 0.47, hsb_b: 1,
      lab_l: 70.35, lab_a: 49.73, lab_b: 1.60,
      xyz_x: 57.12, xyz_y: 41.25, xyz_z: 43.48,
      family: "PINK",
      suggested_name: "Luminous Peach",
    };
    expect(FieldValueSchemas.ColorDropDown.safeParse(color).success).toBe(true);
    expect(FieldValueSchemas.ColorDropDown.safeParse(null).success).toBe(true);
  });

  // ── PartnerDropDown ──
  it("PartnerDropDown → { value, code, text } | null", () => {
    expect(FieldValueSchemas.PartnerDropDown.safeParse({ value: "Vendor A", code: "VA", text: "Vendor A Inc" }).success).toBe(true);
    expect(FieldValueSchemas.PartnerDropDown.safeParse({}).success).toBe(true);
    expect(FieldValueSchemas.PartnerDropDown.safeParse(null).success).toBe(true);
  });

  // ── CompositeControl ──
  it("CompositeControl → [{ code, value }] | null (material composition)", () => {
    const comp = [{ code: "Cotton", value: 82 }, { code: "Polyamide", value: 18 }];
    expect(FieldValueSchemas.CompositeControl.safeParse(comp).success).toBe(true);
    expect(FieldValueSchemas.CompositeControl.safeParse(null).success).toBe(true);
  });

  // ── UsersTags ──
  it("UsersTags → [{ value, code }] | null", () => {
    expect(FieldValueSchemas.UsersTags.safeParse([{ value: "user1", code: "U1" }]).success).toBe(true);
    expect(FieldValueSchemas.UsersTags.safeParse(null).success).toBe(true);
  });

  // ── ColorwayField ──
  it("ColorwayField → { Id, color_number, color_name, Primary_Color, Image } | null", () => {
    const cw = { Id: "uuid", color_number: "CLR-001", color_name: "Red", Primary_Color: "#ff0000", Image: { preview: "https://...", origin: "https://..." } };
    expect(FieldValueSchemas.ColorwayField.safeParse(cw).success).toBe(true);
    expect(FieldValueSchemas.ColorwayField.safeParse(null).success).toBe(true);
  });
});

describe("parseFieldValue", () => {
  it("parses known field type", () => {
    expect(parseFieldValue("Number", 42)).toBe(42);
  });

  it("returns raw value for unknown field type", () => {
    expect(parseFieldValue("UnknownType", "raw")).toBe("raw");
  });

  it("returns raw value on parse failure", () => {
    // Number expects number, string should fail parse but return raw
    expect(parseFieldValue("Number", "not-a-number")).toBe("not-a-number");
  });
});

describe("FieldSearchOperators", () => {
  it("has operators for all common types", () => {
    expect(FieldSearchOperators.Text.default).toBe("contains");
    expect(FieldSearchOperators.Number.default).toBe("is");
    expect(FieldSearchOperators.DropDown.default).toBe("in");
    expect(FieldSearchOperators.MultiSelect.operators).toContain("in");
    expect(FieldSearchOperators.Date.operators).toContain("greater_than");
    expect(FieldSearchOperators.TrueFalse.operators).toEqual(["is"]);
  });
});
