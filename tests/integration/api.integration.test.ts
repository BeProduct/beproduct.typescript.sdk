import { describe, it, expect } from "vitest";
import { getClient, SKIP } from "./setup.js";
import { StyleHeaderSchema } from "../../src/schemas/style.js";
import { MaterialHeaderSchema } from "../../src/schemas/material.js";
import { ColorHeaderSchema } from "../../src/schemas/color.js";
import { BlockHeaderSchema } from "../../src/schemas/block.js";
import { ImageHeaderSchema } from "../../src/schemas/image.js";
import { TrackingPlanSchema, PlanProgressSchema } from "../../src/schemas/tracking.js";
import { FolderItemSchema, SchemaFieldSchema, AppPageSchema } from "../../src/schemas/common.js";
import { z } from "zod";

describe.skipIf(SKIP)("Integration — live API", () => {
  const client = SKIP ? (null as never) : getClient();

  // ── Auth ──
  it("authenticates successfully", async () => {
    const token = await client.raw["tokenManager"].getAccessToken();
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
  });

  // ── Style ──
  it("lists style folders", async () => {
    const folders = await client.style.folders();
    expect(folders.length).toBeGreaterThan(0);
    z.array(FolderItemSchema).parse(folders);
  });

  it("gets style folder schema", async () => {
    const folders = await client.style.folders();
    const schema = await client.style.folderSchema(folders[0].id);
    expect(schema.length).toBeGreaterThan(0);
    z.array(SchemaFieldSchema).parse(schema);
  });

  it("searches style headers", async () => {
    const folders = await client.style.folders();
    let count = 0;
    for await (const header of client.style.list({ folderId: folders[0].id, pageSize: 2 })) {
      expect(header).toHaveProperty("id");
      count++;
      if (count >= 2) break;
    }
    expect(count).toBeGreaterThan(0);
  });

  it("gets a style header with full data", async () => {
    const folders = await client.style.folders();
    for await (const h of client.style.list({ folderId: folders[0].id, pageSize: 1 })) {
      const full = await client.style.get(h.id as string);
      StyleHeaderSchema.parse(full);
      expect(full.headerData.fields.length).toBeGreaterThan(0);
      break;
    }
  });

  it("lists style pages for a header", async () => {
    const folders = await client.style.folders();
    for await (const h of client.style.list({ folderId: folders[0].id, pageSize: 1 })) {
      const pages = await client.style.appList(h.id as string);
      expect(pages.length).toBeGreaterThan(0);
      z.array(AppPageSchema).parse(pages);
      break;
    }
  });

  // Uses AlexGProd folder which has all app types
  const TEST_FOLDER = "8bc24c21-79e7-4aa6-91d3-811d1df2e84c";
  const TEST_HEADER = "f5ef0e21-e069-445c-ad60-9cd50490ce85";

  // ── Typed app data for every supported type ──

  it("Form → FormItem[]", async () => {
    const page = await client.style.appGetTyped(TEST_HEADER, "672cd358-97ed-4c29-9f16-68e536bac5c9", "Form");
    expect(Array.isArray(page.data)).toBe(true);
    if (page.data.length > 0) {
      expect(page.data[0]).toHaveProperty("id");
      expect(page.data[0]).toHaveProperty("type");
      expect(page.data[0]).toHaveProperty("value");
    }
  });

  it("Grid → { appName, gridData }", async () => {
    const page = await client.style.appGetTyped(TEST_HEADER, "470e4b85-4fcc-4306-b1e3-0d43a82fb554", "Grid");
    expect(page.data).toHaveProperty("appName");
    expect(page.data).toHaveProperty("gridData");
    expect(Array.isArray(page.data.gridData)).toBe(true);
  });

  it("FormGrid → { form, grid }", async () => {
    const page = await client.style.appGetTyped(TEST_HEADER, "fbc6e4ff-ced9-4766-b9bf-dd38256ff96b", "FormGrid");
    expect(Array.isArray(page.data.form)).toBe(true);
    expect(Array.isArray(page.data.grid)).toBe(true);
  });

  it("List → ListPageItem[]", async () => {
    const page = await client.style.appGetTyped(TEST_HEADER, "d0bce766-0883-40c3-affc-54d3ac91a4d6", "List");
    expect(Array.isArray(page.data)).toBe(true);
  });

  it("ImagesForm → { image, form }", async () => {
    const page = await client.style.appGetTyped(TEST_HEADER, "329591b2-ccdc-49be-aa01-1521229fa620", "ImagesForm");
    expect(Array.isArray(page.data.image)).toBe(true);
    expect(Array.isArray(page.data.form)).toBe(true);
  });

  it("ImagesGrid → { image, grid }", async () => {
    const page = await client.style.appGetTyped(TEST_HEADER, "6152b949-8c99-4854-944e-7e81a89412fe", "ImagesGrid");
    expect(Array.isArray(page.data.image)).toBe(true);
    expect(page.data.grid).toHaveProperty("appName");
    expect(page.data.grid).toHaveProperty("gridData");
  });

  it("TextList → { text, images }", async () => {
    const page = await client.style.appGetTyped(TEST_HEADER, "5547976c-8d37-4c3d-9269-d718fb40734a", "TextList");
    expect(page.data).toHaveProperty("text");
    expect(Array.isArray(page.data.images)).toBe(true);
  });

  it("Attachments → { files }", async () => {
    const page = await client.style.appGetTyped(TEST_HEADER, "525e68cb-2d0f-49b9-8a6b-b73c28e4b962", "Attachments");
    expect(Array.isArray(page.data.files)).toBe(true);
  });

  it("BOM → { data, applicationName, costing }", async () => {
    const page = await client.style.appGetTyped(TEST_HEADER, "6855d616-9b0d-40ff-a806-285e36aa76ea", "BOM");
    expect(page.data).toHaveProperty("applicationName");
    expect(page.data).toHaveProperty("costing");
    // data can be null or array of BomRow
    if (page.data.data) {
      expect(Array.isArray(page.data.data)).toBe(true);
    }
  });

  it("BOMDetails → array of records", async () => {
    const page = await client.style.appGetTyped(TEST_HEADER, "52e83882-e1d0-426d-9eac-52f1e5d3dcba", "BOMDetails");
    expect(Array.isArray(page.data)).toBe(true);
  });

  it("SKU → SkuItem[]", async () => {
    const page = await client.style.appGetTyped(TEST_HEADER, "f51d644b-781f-46cd-b1e6-fb7c49734997", "SKU");
    expect(Array.isArray(page.data)).toBe(true);
  });

  it("SampleRequestApp → { poms, submits, measurementSystem }", async () => {
    const page = await client.style.appGetTyped(TEST_HEADER, "bd0c0c89-2ec5-4c60-a295-19ff6bdb9cb6", "SampleRequestApp");
    expect(page.data).toHaveProperty("poms");
    expect(page.data).toHaveProperty("submits");
    expect(page.data).toHaveProperty("measurementSystem");
  });

  it("Sets → { data, applicationName, costing } (same as BOM)", async () => {
    const page = await client.style.appGetTyped(TEST_HEADER, "c5126441-3bd3-49dc-ba1e-d5cd98e2426a", "Sets");
    expect(page.data).toHaveProperty("applicationName");
    expect(page.data).toHaveProperty("costing");
  });

  it("Spreadsheet → record<string, unknown>", async () => {
    const page = await client.style.appGetTyped(TEST_HEADER, "639d4d4c-344f-4dc9-9256-8b9f7f718851", "Spreadsheet");
    expect(typeof page.data).toBe("object");
  });

  it("Revisions → RevisionItem[]", async () => {
    const page = await client.style.appGetTyped(TEST_HEADER, "821856f0-b7a0-4903-be59-23543e7bded7", "Revisions");
    expect(Array.isArray(page.data)).toBe(true);
  });

  it("MultiMeasurements → { measurementSystem, sizeClasses, blockHeader }", async () => {
    const page = await client.style.appGetTyped(TEST_HEADER, "4cf4c86a-9a8a-4972-a241-360731f82b7d", "MultiMeasurements");
    expect(page.data).toHaveProperty("measurementSystem");
    expect(page.data).toHaveProperty("sizeClasses");
  });

  // ── Material ──
  it("lists material folders and gets a header", async () => {
    const folders = await client.material.folders();
    expect(folders.length).toBeGreaterThan(0);
    for await (const h of client.material.list({ folderId: folders[0].id, pageSize: 1 })) {
      const full = await client.material.get(h.id as string);
      MaterialHeaderSchema.parse(full);
      break;
    }
  });

  // ── Color ──
  it("lists color folders and gets a header", async () => {
    const folders = await client.color.folders();
    expect(folders.length).toBeGreaterThan(0);
    for await (const h of client.color.list({ folderId: folders[0].id, pageSize: 1 })) {
      const full = await client.color.get(h.id as string);
      ColorHeaderSchema.parse(full);
      break;
    }
  });

  // ── Block ──
  it("lists block folders and gets a header", async () => {
    const folders = await client.block.folders();
    expect(folders.length).toBeGreaterThan(0);
    for await (const h of client.block.list({ folderId: folders[0].id, pageSize: 1 })) {
      const full = await client.block.get(h.id as string);
      BlockHeaderSchema.parse(full);
      break;
    }
  });

  // ── Image ──
  it("lists image folders and gets a header", async () => {
    const folders = await client.image.folders();
    expect(folders.length).toBeGreaterThan(0);
    for await (const h of client.image.list({ folderId: folders[0].id, pageSize: 1 })) {
      const full = await client.image.get(h.id as string);
      ImageHeaderSchema.parse(full);
      break;
    }
  });

  // ── Tracking ──
  it("lists tracking folders", async () => {
    const folders = await client.tracking.folders();
    expect(folders.length).toBeGreaterThan(0);
  });

  it("searches tracking plans", async () => {
    let count = 0;
    for await (const plan of client.tracking.planList({ pageSize: 2 })) {
      TrackingPlanSchema.parse(plan);
      count++;
      if (count >= 2) break;
    }
    expect(count).toBeGreaterThan(0);
  });

  it("gets tracking plan with views and timelines", async () => {
    let planId: string | null = null;
    for await (const p of client.tracking.planList({ pageSize: 1 })) {
      planId = p.id;
      break;
    }
    if (planId) {
      const plan = await client.tracking.planGet(planId);
      TrackingPlanSchema.parse(plan);
      expect(plan.style?.views?.length).toBeGreaterThanOrEqual(0);
    }
  });

  it("gets style progress", async () => {
    let planId: string | null = null;
    for await (const p of client.tracking.planList({ pageSize: 1 })) {
      planId = p.id;
      break;
    }
    if (planId) {
      const progress = await client.tracking.styleProgress(planId);
      PlanProgressSchema.parse(progress);
      expect(progress.total).toBeGreaterThanOrEqual(0);
    }
  });

  // ── Directory ──
  it("lists directory companies", async () => {
    const companies = await client.directory.list({ pageSize: 2 });
    expect(companies.length).toBeGreaterThan(0);
    expect(companies[0]).toHaveProperty("name");
  });

  // ── Users ──
  it("lists users", async () => {
    const users = await client.user.list();
    expect(users.length).toBeGreaterThan(0);
    expect(users[0]).toHaveProperty("id");
  });

  it("lists roles", async () => {
    const roles = await client.user.roleList();
    expect(roles.length).toBeGreaterThan(0);
    expect(roles[0]).toHaveProperty("roleName");
  });

  // ── Data Tables ──
  it("lists data tables", async () => {
    let count = 0;
    for await (const dt of client.dataTables.list({ pageSize: 2 })) {
      expect(dt).toHaveProperty("name");
      count++;
      if (count >= 2) break;
    }
    expect(count).toBeGreaterThan(0);
  });

  // ── Master Data ──
  it("gets a custom master data field", async () => {
    const field = await client.masterData.get("combobox999");
    expect(field.fieldId).toBe("combobox999");
    expect(field.fieldType).toBe("ComboBox");
  });

  // ── Rate Limit Headers ──
  it("handles missing rate limit headers gracefully", async () => {
    await client.style.folders();
    // Rate limiting is disabled on prod — state should be null or populated, either is fine
    // The key assertion is no error was thrown
  });
});
