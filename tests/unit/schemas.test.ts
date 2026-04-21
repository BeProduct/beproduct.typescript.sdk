import { describe, it, expect } from "vitest";
import { StyleHeaderSchema } from "../../src/schemas/style.js";
import { MaterialHeaderSchema } from "../../src/schemas/material.js";
import { ColorHeaderSchema } from "../../src/schemas/color.js";
import { BlockHeaderSchema } from "../../src/schemas/block.js";
import { ImageHeaderSchema } from "../../src/schemas/image.js";
import {
  BomRowSchema,
  BomDataSchema,
  GridItemSchema,
  GridAppDataSchema,
  FormGridDataSchema,
  ListPageItemSchema,
  ImagesFormDataSchema,
  ImagesGridDataSchema,
  TextListDataSchema,
  AttachmentsDataSchema,
  SkuItemSchema,
  SampleRequestAppDataSchema,
  AppResultSchema,
} from "../../src/schemas/apps.js";
import { TrackingPlanSchema, PlanTimelineSchema, PlanProgressSchema } from "../../src/schemas/tracking.js";
import { DirectoryCompanySchema, ContactSchema } from "../../src/schemas/directory.js";
import { UserModelSchema, UserRoleSchema } from "../../src/schemas/users.js";
import { DataTableResultSchema, DataTableRowResultSchema } from "../../src/schemas/data-tables.js";
import { MasterDataResultSchema } from "../../src/schemas/master-data.js";
import { TagSchema } from "../../src/schemas/tags.js";
import { SharedPartnerSchema } from "../../src/schemas/share.js";

// ── Entity Headers ──────────────────────────────────

describe("Entity header schemas", () => {
  it("parses StyleHeader with null planIds, object colorway fields, string colorway image", () => {
    const result = StyleHeaderSchema.parse({
      id: "abc", headerNumber: "S-001", headerName: "Test",
      folder: { id: "f1", name: "Fall" },
      headerData: { fields: [{ id: "header_number", name: "Style Number", value: "S-001", type: "Text", required: true }], frontImage: { preview: "", origin: "" } },
      colorways: [{ id: "c1", colorNumber: "CLR", colorName: "Red", fields: { custom: "val" }, image: "https://img.png" }],
      sizeRange: [{ name: "M", fields: { price: 10 } }],
      sizeClasses: [{ id: "sc1", name: "Default", sizeRange: "XS-XL" }],
      planIds: null,
      createdBy: { id: "u1", name: "User" }, createdAt: "2026-01-01T00:00:00Z",
      modifiedBy: { id: "u1", name: "User" }, modifiedAt: "2026-01-01T00:00:00Z",
    });
    expect(result.id).toBe("abc");
    expect(result.planIds).toBeNull();
  });

  it("parses MaterialHeader with suppliers and null tags", () => {
    const result = MaterialHeaderSchema.parse({
      id: "m1", headerNumber: "MAT-001", headerName: "Cotton",
      folder: { id: "f1", name: "Fabrics" },
      headerData: { fields: [{ id: "header_number", name: "Material Number", value: "MAT-001", type: "Text", required: true }], mainImage: { preview: "", origin: "" } },
      colorways: [{ id: "c1", fields: {} }],
      suppliers: [{ id: "s1", name: "Mill", country: "CN" }],
      tags: null, planIds: null,
      createdBy: { id: "u1", name: "User" }, createdAt: "2026-01-01T00:00:00Z",
      modifiedBy: { id: "u1", name: "User" }, modifiedAt: "2026-01-01T00:00:00Z",
    });
    expect(result.tags).toBeNull();
    expect(result.suppliers![0].name).toBe("Mill");
  });

  it("parses ColorHeader with colors as object (custom palette format)", () => {
    const result = ColorHeaderSchema.parse({
      id: "ch1", colorPaletteNumber: "PAL-001", colorPaletteName: "Autumn",
      folder: { id: "f1", name: "Palettes" },
      headerData: { fields: [{ id: "header_number", name: "Palette Number", value: "PAL-001", type: "Text", required: true }], colors: { asEurl: "custom", colors: [] } },
      createdBy: { id: "u1", name: "User" }, createdAt: "2026-01-01T00:00:00Z",
      modifiedBy: { id: "u1", name: "User" }, modifiedAt: "2026-01-01T00:00:00Z",
    });
    expect(result.colorPaletteName).toBe("Autumn");
  });

  it("parses BlockHeader with null notes and string sizeRange", () => {
    const result = BlockHeaderSchema.parse({
      id: "b1", headerNumber: "BLK-001", headerName: "Tee Block",
      folder: { id: "f1", name: "Blocks" },
      headerData: { fields: [{ id: "header_number", name: "Block Number", value: "BLK-001", type: "Text", required: true }], frontImage: { preview: "", origin: "" },
        sizeClasses: [{ id: "sc1", name: "Missy", notes: null, active: true, sizeRange: "XS, S, M, L, XL",
          sizes: [{ name: "M", isSampleSize: true, hideSize: false, comments: null }] }] },
      createdBy: { id: "u1", name: "User" }, createdAt: "2026-01-01T00:00:00Z",
      modifiedBy: { id: "u1", name: "User" }, modifiedAt: "2026-01-01T00:00:00Z",
    });
    expect(result.headerData.sizeClasses![0].notes).toBeNull();
  });

  it("parses ImageHeader with object preview and null variations/files", () => {
    const result = ImageHeaderSchema.parse({
      id: "i1", headerNumber: "IMG-001", headerName: "Photo",
      folder: { id: "f1", name: "Photos" },
      headerData: { fields: [{ id: "header_number", name: "Image Number", value: "IMG-001", type: "Text", required: true }],
        preview: { preview: "https://...", origin: "https://..." }, variations: null },
      files: null,
      createdBy: { id: "u1", name: "User" }, createdAt: "2026-01-01T00:00:00Z",
      modifiedBy: { id: "u1", name: "User" }, modifiedAt: "2026-01-01T00:00:00Z",
    });
    expect(result.headerData.variations).toBeNull();
    expect(result.files).toBeNull();
  });
});

// ── App Data Types ──────────────────────────────────

describe("App data schemas", () => {
  it("Form — array of FormItem", () => {
    AppResultSchema.parse({
      id: "p1", headerId: "h1", name: "form999",
      data: [
        { id: "text999", name: "Text999", value: "hello", type: "Text", required: false },
        { id: "drop_down999", name: "Drop Down999", value: null, type: "DropDown", required: false },
      ],
      createdBy: { id: "u1", name: "User" }, createdAt: "2026-01-01T00:00:00Z",
      modifiedBy: { id: null, name: null }, modifiedAt: "0001-01-01T00:00:00",
    });
  });

  it("Grid — { appName, gridData: GridItem[] }", () => {
    const result = GridAppDataSchema.parse({ appName: "grid999", gridData: [
      { rowId: "r1", fields: [{ id: "f1", name: "F", value: "v", type: "Text", required: false }] },
      { rowId: "r2", fields: [{ id: "f1", name: "F", value: "w", type: "Text", required: false }] },
    ]});
    expect(result.gridData).toHaveLength(2);
    expect(result.gridData[0].rowId).toBe("r1");
  });

  it("GridItem — with null rowId for new rows", () => {
    GridItemSchema.parse({ rowId: null, fields: [{ id: "f1", name: "F", value: "", type: "Text", required: false }] });
  });

  it("FormGrid — { form: FormItem[], grid: GridItem[] } (grid is direct array, NOT GridAppData)", () => {
    const result = FormGridDataSchema.parse({
      form: [{ id: "date999", name: "Date", value: null, type: "Date", required: false }],
      grid: [{ rowId: "r1", fields: [{ id: "f1", name: "F", value: "v", type: "Text", required: false }] }],
    });
    expect(result.form).toHaveLength(1);
    expect(result.grid).toHaveLength(1);
  });

  it("List — ListPageItem with controls (not fields)", () => {
    const result = ListPageItemSchema.parse({
      id: "item1",
      controls: [{ id: "desc", name: "Description", value: "test", type: "Text", required: false }],
      image: "https://preview.png", origin: "https://original.png",
    });
    expect(result.controls).toHaveLength(1);
  });

  it("ImagesForm — { image: ListPageItem[], form: FormItem[] }", () => {
    const result = ImagesFormDataSchema.parse({
      image: [{ id: "img1", controls: [{ id: "f1", name: "F", value: null, type: "Text", required: false }], image: null, origin: null }],
      form: [{ id: "memo", name: "Memo", value: null, type: "Memo", required: false }],
    });
    expect(result.image).toHaveLength(1);
    expect(result.form).toHaveLength(1);
  });

  it("ImagesGrid — { image: ListPageItem[], grid: GridAppData } (grid IS GridAppData, unlike FormGrid)", () => {
    const result = ImagesGridDataSchema.parse({
      image: [],
      grid: { appName: "gridList999", gridData: [] },
    });
    expect(result.grid.appName).toBe("gridList999");
  });

  it("TextList — { text: string, images: ListPageItem[] }", () => {
    const result = TextListDataSchema.parse({ text: "<p>Hello</p>", images: [{ id: "i1", controls: [], image: null, origin: null }] });
    expect(result.text).toContain("Hello");
    expect(result.images).toHaveLength(1);
  });

  it("Attachments — { files: AttachmentFileData[] } with createdBy/modifiedBy", () => {
    const result = AttachmentsDataSchema.parse({ files: [
      { fileName: "spec.pdf", fileType: "application/pdf", fileSize: "1024", url: "https://...",
        createdBy: { id: "u1", name: "User" }, createdAt: "2026-01-01T00:00:00Z",
        modifiedBy: null, modifiedAt: null, comments: "Updated spec" },
    ]});
    expect(result.files).toHaveLength(1);
    expect(result.files[0].comments).toBe("Updated spec");
    expect(result.files[0].modifiedBy).toBeNull();
  });

  it("SKU — core fields + custom fields array", () => {
    const result = SkuItemSchema.parse({
      id: "sku1", colorImage: "https://img.png", skuNumber: "SKU-001-S-RED",
      colorNumber: "CLR-001", colorName: "Red", size: "S", packaging: null,
      hideSku: false, comments: "",
      fields: [{ id: "custom_field", name: "Custom", value: "val", type: "Text", required: false }],
    });
    expect(result.skuNumber).toBe("SKU-001-S-RED");
    expect(result.fields).toHaveLength(1);
  });

  it("BOM data — { data, applicationName, costing } with costing scenarios", () => {
    BomDataSchema.parse({
      data: [{ rowId: "r1", materialId: "m1", group: "Fabric", qty: "1.5", price: "6.5", total: "9.75" }],
      applicationName: "Bill of Material",
      costing: [{ scenarioId: "s1", scenarioName: "Default", isNominated: true,
        groups: [{ name: "Fabric", value: 9.75, fieldId: null }, { name: "CMT", value: 12, fieldId: "cmt_cost" }] }],
    });
  });

  it("BOM data — null costing", () => {
    BomDataSchema.parse({ data: [], applicationName: "BOM", costing: null });
  });

  it("BomRow — system fields + tenant passthrough + colorway pitches", () => {
    const result = BomRowSchema.parse({
      rowId: "r1", materialId: "m1", group: "Main Fabric", qty: "1.5", price: "6.5", total: "9.75",
      MainImageURL: "/preview/img.png", FolderTypeName: "EP Material", isAdHOC: false,
      // tenant Schema fields
      material_type: "Twill", material_content: '[{"code":"Cotton","value":100}]',
      // tenant Custom fields
      fabric_price_: "9.9", push_to_costing_1: "True", eur_x_rate: "1.1178",
      // colorway pitch (dynamic UUID key)
      "cad0eb44-uuid": { hex: "FFFFFF", number: "", name: "N/A", colorID: "cad0eb44-uuid", materialColorwayId: "mw-uuid" },
      "016e9860-uuid": { hex: "", number: "", name: "", colorID: "016e9860-uuid" },
    });
    expect(result.rowId).toBe("r1");
    expect(result.group).toBe("Main Fabric");
    const r = result as Record<string, unknown>;
    expect(r["material_type"]).toBe("Twill");
    expect(r["push_to_costing_1"]).toBe("True");
    const pitch = r["cad0eb44-uuid"] as Record<string, unknown>;
    expect(pitch.name).toBe("N/A");
    expect(pitch.materialColorwayId).toBe("mw-uuid");
  });

  it("SampleRequestApp — poms, gradeRules, submits with fitComments/fitPhotos", () => {
    SampleRequestAppDataSchema.parse({
      poms: [{
        id: "pom1", isLinked: true,
        pom: { code: "A", pointOfMeasure: "Chest Width", tolMinus: -0.5, tolPlus: 0.5, requested: 20, fields: [] },
        gradeRules: [{ sizeName: "S", spec: 18, rule: -2 }, { sizeName: "M", spec: 20, rule: 0 }],
        submits: [{ id: "sub1", fields: [{ id: "actual", name: "Actual", value: "20.25", type: "Decimal", required: false }] }],
      }],
      submits: [{
        id: "sub1", name: "Proto 1", sampleSize: "M", size: "M",
        dueDate: "2026-04-01T00:00:00Z", receivedDate: null, fitDate: null, resubmitDueDate: null,
        submitStatus: "Not Started", submitStatusDate: null,
        data: { fitComments: "Good fit", fitPhotos: [] },
      }],
      measurementSystem: "Imperial",
    });
  });
});

// ── Tracking ────────────────────────────────────────

describe("Tracking schemas", () => {
  it("TrackingPlan with null pageName in timeline definitions", () => {
    const result = TrackingPlanSchema.parse({
      id: "p1", name: "Plan", folderId: "f1",
      startDate: "2026-01-01T00:00:00Z", endDate: "2026-06-01T00:00:00Z", active: true,
      createdBy: { id: "u1", name: "User" }, createdAt: "2026-01-01T00:00:00Z",
      modifiedBy: { id: "u1", name: "User" }, modifiedAt: "2026-01-01T00:00:00Z",
      style: {
        views: [{ id: "v1", name: "Header View", active: true }],
        timelines: [{ id: "t1", department: "Attributes", actionDescription: "Attributes", shortDescription: "Attributes", pageName: null }],
      },
      material: { views: [], timelines: [] },
    });
    expect(result.style!.timelines[0].pageName).toBeNull();
  });

  it("PlanTimeline with timeline items", () => {
    PlanTimelineSchema.parse({
      id: "tl1", colorId: "c1", colorNumber: "RVT", colorName: "Rose", size: "NA",
      supplier: null, suppliers: [], modifiedAt: "2026-01-01T00:00:00Z", modifiedBy: { id: null, name: null },
      header: { id: "h1", headerNumber: "S-001", headerName: "Style", folder: { id: "f1", name: "Fall" },
        frontImage: { preview: "", origin: "" }, fields: [{ id: "header_number", name: "Style Number", value: "S-001", type: "Text", required: true }] },
      timelines: [{ id: "ti1", timelineId: "td1", status: "Not Started", plan: "2026-03-01T00:00:00Z", rev: null, final: null, due: "2026-03-01T00:00:00Z",
        assignedTo: [{ id: "u1", name: "User" }], shareWith: [], late: false, submitsQuantity: 0, page: null, request: null }],
      isArchived: false,
    });
  });

  it("PlanProgress", () => {
    PlanProgressSchema.parse({ not_started: 10, in_progress: 5, waiting_on: 2, rejected: 0, approved: 3, approved_with_corrections: 1, na: 0, late: 4, total: 21 });
  });
});

// ── Other Domains ───────────────────────────────────

describe("Other domain schemas", () => {
  it("DirectoryCompany with null optional fields", () => {
    DirectoryCompanySchema.parse({ id: "d1", name: "Vendor Co", partnerType: "VENDOR", directoryId: "87", address: null, country: null, state: null, zip: null, city: null, phone: null, website: null });
  });

  it("Contact with API typo registerdOn", () => {
    ContactSchema.parse({ id: "c1", email: "a@b.com", username: "user", firstName: "John", lastName: "Doe", title: null, mobilePhone: null, workPhone: null, accountType: "PARTNER", role: "vendorRole", registerdOn: "2026-01-01T00:00:00Z", active: true });
  });

  it("UserModel", () => {
    UserModelSchema.parse({ id: "u1", email: "a@b.com", username: "user", firstName: "John", lastName: "Doe", title: null, accountType: "INTERNAL", role: "admin", registerdOn: "2026-01-01T00:00:00Z", active: true });
  });

  it("UserRole", () => {
    UserRoleSchema.parse({ id: "r1", roleName: "Designer", roleDescription: "Design team", roleType: "Internal", isAdmin: false, active: true });
  });

  it("DataTableResult", () => {
    DataTableResultSchema.parse({ id: "dt1", name: "Fabric Types", description: "Reference", active: true });
  });

  it("DataTableRowResult", () => {
    DataTableRowResultSchema.parse({ id: "row1", fields: [{ id: "f1", name: "Type", value: "Cotton", type: "Text", required: false }] });
  });

  it("MasterDataResult with properties", () => {
    MasterDataResultSchema.parse({ fieldId: "combobox999", fieldName: "ComboBox999", fieldType: "ComboBox", active: true, syncAllFolders: false, masterFolders: ["Style", "Material"], properties: { Choices: [{ id: "c1", value: "A" }], SortAlphabetically: true } });
  });

  it("Tag", () => {
    TagSchema.parse({ id: "t1", name: "Fall 2026", integration: null, tagDate: "2026-01-01T00:00:00Z", tagUsers: ["u1"] });
  });

  it("SharedPartner", () => {
    SharedPartnerSchema.parse({ partner: { id: "p1", name: "Vendor Co", partnerType: "VENDOR", country: null }, createdBy: { id: "u1", name: "User" }, createdAt: "2026-01-01T00:00:00Z" });
  });
});
