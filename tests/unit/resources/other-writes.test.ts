import { describe, it, expect, vi, beforeEach } from "vitest";
import { BeProduct } from "../../../src/client.js";

function mockFetch(responseBody: unknown = {}) {
  const fn = vi.fn().mockResolvedValue({
    ok: true, status: 200, headers: new Headers(),
    json: () => Promise.resolve(responseBody),
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

function makeClient() {
  return new BeProduct({ companyDomain: "test-co", accessToken: "test-token" });
}

function lastCall() {
  const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
  const [url, opts] = calls[calls.length - 1] as [string, RequestInit];
  return { url, method: opts.method, body: opts.body ? JSON.parse(opts.body as string) : undefined };
}

// Realistic GUIDs
const FOLDER    = "62fac765-399b-4075-b600-3f5c09ee9204";
const HEADER    = "a52109b8-9491-47f0-b8b7-d31b02e76945";
const APP       = "672cd358-97ed-4c29-9f16-68e536bac5c9";
const CW1       = "24d686b0-6005-44cf-a3f8-25cb3cf8eccc";
const TAG       = "97e96669-5afa-4bd6-9343-64a9f6187b0c";
const USER1     = "de7a5e40-2a00-479a-9e25-1c6e76ffc082";
const USER2     = "db2d91c8-5490-4faa-99de-b6f5f4517710";
const PARTNER   = "9057032d-13fd-463e-87bd-437a94dffeb8";
const PLAN      = "d367aa02-a318-4383-9b5c-f0890dab2606";
const TL        = "5a8b490a-b309-48fc-8a96-103d41ab00bb";
const TI        = "45679816-71f6-4631-8839-428ee49ab7eb";
const DIR_ID    = "98f92da2-5048-4744-b9aa-c475d195daaa";
const CONTACT   = "24f1c142-b5c7-4904-903e-e7a6f0243dac";
const DT        = "1d2d157e-f1fd-45da-a22a-a54e8d5073f4";
const ROLE      = "d6b1da11-4702-4b1d-b4a5-bfd52cb784cb";
const SUPPLIER  = "3a0c40a9-bd22-4fa2-a913-d72295ec361a";

// ── Color ──

describe("Color write operations", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("create — with colors and preserveVersion", async () => {
    mockFetch({});
    const client = makeClient();
    await client.color.create(FOLDER, { header_name: "Palette" }, { colors: [{ hex: "ff0000" }], preserveVersion: true });

    const c = lastCall();
    expect(c.url).toContain("Color/Header/Create");
    expect(c.url).toContain(`folderId=${FOLDER}`);
    expect(c.url).toContain("preserveVersion=true");
    expect(c.body.colors).toEqual([{ hex: "ff0000" }]);
  });

  it("update — replaceColors default true", async () => {
    mockFetch({});
    const client = makeClient();
    await client.color.update(HEADER, { header_name: "Updated" }, { colors: [{ id: CW1, removeColor: true }] });

    const c = lastCall();
    expect(c.url).toContain(`Color/Header/${HEADER}/Update`);
    expect(c.url).toContain("replaceColors=true");
  });

  it("update — replaceColors false", async () => {
    mockFetch({});
    const client = makeClient();
    await client.color.update(HEADER, undefined, { replaceColors: false });

    const c = lastCall();
    expect(c.url).toContain("replaceColors=false");
  });
});

// ── Block ──

describe("Block write operations", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("create — with sizeClasses", async () => {
    mockFetch({});
    const client = makeClient();
    const blockFolder = "c149c088-621d-4494-8630-45720f547005";
    await client.block.create(blockFolder, { header_name: "Block" }, { sizeClasses: [{ name: "Missy" }] });

    const c = lastCall();
    expect(c.url).toContain("Block/Header/Create");
    expect(c.url).toContain(`folderId=${blockFolder}`);
    expect(c.body.sizeClasses).toEqual([{ name: "Missy" }]);
  });

  it("update — with fields as UpdateItem[]", async () => {
    mockFetch({});
    const client = makeClient();
    const blockId = "7927924f-e477-4c4e-9457-1145a9e85de4";
    await client.block.update(blockId, [{ id: "header_name", value: "Updated" }]);

    const c = lastCall();
    expect(c.url).toContain(`Block/Header/${blockId}/Update`);
    expect(c.body.fields).toEqual([{ id: "header_name", value: "Updated" }]);
  });
});

// ── Image ──

describe("Image write operations", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("create", async () => {
    mockFetch({});
    const client = makeClient();
    const imgFolder = "250bde3a-3496-40f1-a554-600d9f2e5375";
    await client.image.create(imgFolder, { header_name: "Photo" });

    const c = lastCall();
    expect(c.url).toContain("Image/Header/Create");
    expect(c.url).toContain(`folderId=${imgFolder}`);
  });

  it("update", async () => {
    mockFetch({});
    const client = makeClient();
    const imgId = "a5ca8dfe-4ff8-4549-b54d-2e1bbce514fe";
    await client.image.update(imgId, { header_name: "Updated" });

    const c = lastCall();
    expect(c.url).toContain(`Image/Header/${imgId}/Update`);
  });
});

// ── Base entity shared operations (via Style) ──

describe("Base entity write operations (via Style)", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("appFormUpdate — fields dict transform", async () => {
    mockFetch({});
    const client = makeClient();
    await client.style.appFormUpdate(HEADER, APP, { text_field: "hello", number_field: 42 });

    const c = lastCall();
    expect(c.url).toContain("Style/PageForm");
    expect(c.url).toContain(`headerId=${HEADER}`);
    expect(c.url).toContain(`pageId=${APP}`);
    expect(c.body).toEqual([
      { id: "text_field", value: "hello" },
      { id: "number_field", value: 42 },
    ]);
  });

  it("appFormUpdate — UpdateItem[] passthrough", async () => {
    mockFetch({});
    const client = makeClient();
    await client.style.appFormUpdate(HEADER, APP, [{ id: "f1", value: "v1" }]);

    const c = lastCall();
    expect(c.body).toEqual([{ id: "f1", value: "v1" }]);
  });

  it("appGridUpdate — rows with add/update/delete", async () => {
    mockFetch({});
    const client = makeClient();
    const row1 = "71c8d696-d134-4ab2-bba0-893fe6c2d0c5";
    const row2 = "916a2a96-e8cb-43eb-8cdf-62d2f0cd1c41";
    await client.style.appGridUpdate(HEADER, APP, [
      { rowId: row1, rowFields: [{ id: "x_rate", value: "0.123" }], deleteRow: false },
      { rowId: null, rowFields: [{ id: "cost_price_currency", value: "CAD" }, { id: "x_rate", value: "0.432" }] },
      { rowId: row2, rowFields: [], deleteRow: true },
    ]);

    const c = lastCall();
    expect(c.url).toContain("Style/PageGrid");
    expect(c.body).toHaveLength(3);
    expect(c.body[0].rowId).toBe(row1);
    expect(c.body[1].rowId).toBeNull();
    expect(c.body[2].deleteRow).toBe(true);
  });

  it("appImagesGridListUpdate — POST PageImagesGrid/List", async () => {
    mockFetch({});
    const client = makeClient();
    await client.style.appImagesGridListUpdate(HEADER, APP, [
      { itemId: null, itemFields: [{ id: "text", value: "hi" }] },
    ]);

    const c = lastCall();
    expect(c.url).toContain("Style/PageImagesGrid/List");
    expect(c.url).toContain(`headerId=${HEADER}`);
    expect(c.url).toContain(`pageId=${APP}`);
    expect(c.body[0].itemFields[0]).toEqual({ id: "text", value: "hi" });
  });

  it("appAttachmentsDelete — filenames array", async () => {
    mockFetch({});
    const client = makeClient();
    await client.style.appAttachmentsDelete(HEADER, APP, ["spec-v2.pdf", "old-photo.jpg"]);

    const c = lastCall();
    expect(c.url).toContain("Style/AttachmentRemove");
    expect(c.body).toEqual(["spec-v2.pdf", "old-photo.jpg"]);
  });

  it("appReset", async () => {
    mockFetch({});
    const client = makeClient();
    await client.style.appReset(HEADER, APP);

    const c = lastCall();
    expect(c.url).toContain(`Style/${HEADER}/Page/${APP}/Reset`);
  });

  it("commentAdd / commentEdit / commentDelete", async () => {
    mockFetch({});
    const client = makeClient();
    const commentId = "a1b2c3d4-0000-0000-0000-000000000040";

    await client.style.commentAdd(HEADER, "Great work");
    let c = lastCall();
    expect(c.url).toContain(`Comment/Header/${HEADER}/Create`);

    await client.style.commentEdit(HEADER, commentId, "Updated comment");
    c = lastCall();
    expect(c.url).toContain(`commentId=${commentId}`);

    await client.style.commentDelete(HEADER, commentId);
    c = lastCall();
    expect(c.url).toContain(`Comment/Header/${HEADER}/Delete`);
    expect(c.method).toBe("DELETE");
  });

  it("appCommentAdd / appCommentEdit / appCommentDelete", async () => {
    mockFetch({});
    const client = makeClient();
    const commentId = "a1b2c3d4-0000-0000-0000-000000000041";

    await client.style.appCommentAdd(HEADER, APP, "Page comment");
    expect(lastCall().url).toContain(`Comment/Page/${HEADER}/${APP}/Create`);

    await client.style.appCommentEdit(HEADER, APP, commentId, "Updated");
    expect(lastCall().url).toContain(`Comment/Page/${HEADER}/${APP}/Edit`);

    await client.style.appCommentDelete(HEADER, APP, commentId);
    expect(lastCall().method).toBe("DELETE");
  });

  it("revisionAdd / revisionEdit / revisionDelete", async () => {
    mockFetch({});
    const client = makeClient();
    const revId = "a1b2c3d4-0000-0000-0000-000000000050";

    await client.style.revisionAdd(HEADER, "Rev note");
    expect(lastCall().url).toContain(`Revision/Header/${HEADER}/Create`);

    await client.style.revisionEdit(HEADER, revId, "Updated rev");
    expect(lastCall().url).toContain(`revisionId=${revId}`);

    await client.style.revisionDelete(HEADER, revId);
    expect(lastCall().method).toBe("DELETE");
  });

  it("appRevisionAdd / Edit / Delete", async () => {
    mockFetch({});
    const client = makeClient();
    const revId = "a1b2c3d4-0000-0000-0000-000000000051";

    await client.style.appRevisionAdd(HEADER, APP, "App rev");
    expect(lastCall().url).toContain(`Revision/Page/${HEADER}/${APP}/Create`);

    await client.style.appRevisionEdit(HEADER, APP, revId, "Updated");
    expect(lastCall().url).toContain(`Revision/Page/${HEADER}/${APP}/Edit`);

    await client.style.appRevisionDelete(HEADER, APP, revId);
    expect(lastCall().method).toBe("DELETE");
  });

  it("tagCreate / tagUpdate / tagDelete / tagShare / tagUnshare", async () => {
    mockFetch({});
    const client = makeClient();

    await client.style.tagCreate("Fall 2026", { integration: "ext-key", shareWith: [USER1] });
    let c = lastCall();
    expect(c.url).toContain("Tag/Style/Create");
    expect(c.body).toEqual({ name: "Fall 2026", integration: "ext-key", shareWith: [USER1] });

    await client.style.tagUpdate(TAG, "Updated Tag");
    expect(lastCall().url).toContain(`Tag/${TAG}/Update`);

    await client.style.tagDelete(TAG);
    expect(lastCall().url).toContain(`Tag/${TAG}/Delete`);
    expect(lastCall().method).toBe("DELETE");

    await client.style.tagShare(TAG, [USER1, USER2]);
    expect(lastCall().url).toContain(`Tag/${TAG}/Share`);

    await client.style.tagUnshare(TAG, [USER1]);
    expect(lastCall().url).toContain(`Tag/${TAG}/Unshare`);
  });

  it("headerTagAdd / headerTagRemove — pass tag names (not IDs)", async () => {
    mockFetch({});
    const client = makeClient();

    await client.style.headerTagAdd(HEADER, ["Fall 2026", "Priority"]);
    let c = lastCall();
    expect(c.url).toContain(`Tag/Header/${HEADER}/Add`);
    expect(c.body).toEqual(["Fall 2026", "Priority"]);

    await client.style.headerTagRemove(HEADER, ["Priority"]);
    c = lastCall();
    expect(c.url).toContain(`Tag/Header/${HEADER}/Remove`);
    expect(c.body).toEqual(["Priority"]);
  });

  it("share / unshare — partner company IDs", async () => {
    mockFetch({});
    const client = makeClient();

    await client.style.share(HEADER, [PARTNER, SUPPLIER]);
    let c = lastCall();
    expect(c.url).toContain(`Share/Header/${HEADER}/Share`);
    expect(c.body).toEqual([PARTNER, SUPPLIER]);

    await client.style.unshare(HEADER, [PARTNER]);
    c = lastCall();
    expect(c.url).toContain(`Share/Header/${HEADER}/Unshare`);
  });

  it("appShare / appUnshare", async () => {
    mockFetch({});
    const client = makeClient();

    await client.style.appShare(HEADER, APP, [PARTNER]);
    expect(lastCall().url).toContain(`Share/Page/${HEADER}/${APP}/Share`);

    await client.style.appUnshare(HEADER, APP, [PARTNER]);
    expect(lastCall().url).toContain(`Share/Page/${HEADER}/${APP}/Unshare`);
  });
});

// ── Tracking ──

describe("Tracking write operations", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("styleAdd — POST with style IDs array", async () => {
    mockFetch({});
    const client = makeClient();
    const s1 = "ded923db-aba8-473b-a2e8-25d0ffd5501b";
    const s2 = "8c324c79-364f-4a40-aacd-d1f18d2f249b";
    await client.tracking.styleAdd(PLAN, [s1, s2]);

    const c = lastCall();
    expect(c.url).toContain(`Tracking/Plan/${PLAN}/Style/Add`);
    expect(c.body).toEqual([s1, s2]);
  });

  it("styleBySkuAdd — returns created timelines", async () => {
    const styleId = "ded923db-aba8-473b-a2e8-25d0ffd5501b";
    const folderId = "3cb267cc-a99e-44e3-9a58-a17ebf4c7fe0";
    const newTl = "b1c2d3e4-0000-0000-0000-000000000060";
    mockFetch([{ id: newTl, headerId: styleId, headerFolderId: folderId }]);
    const client = makeClient();
    const result = await client.tracking.styleBySkuAdd(PLAN, [
      { headerId: styleId, sku: [{ colorwayId: CW1, sizes: ["S", "M"] }] },
    ]);

    expect(lastCall().url).toContain(`Tracking/Plan/${PLAN}/StyleBySKU/Add`);
    expect(result[0].id).toBe(newTl);
    expect(result[0].headerFolderId).toBe(folderId);
  });

  it("styleTimelineUpdate — ValuePatchRequest + CollectionPatchRequest format", async () => {
    mockFetch({});
    const client = makeClient();
    await client.tracking.styleTimelineUpdate(PLAN, [{
      id: TL,
      supplier: { add: [SUPPLIER], remove: [] },
      timelines: [{
        id: TI,
        status: { value: "Approved" },
        rev: { value: "2026-04-01T00:00:00Z" },
        assignedTo: { add: [USER1], remove: [USER2] },
        shareWith: { add: [PARTNER], remove: [] },
      }],
    }]);

    const c = lastCall();
    expect(c.url).toContain(`Tracking/Plan/${PLAN}/Style/Timelines/Edit`);
    expect(c.body[0].supplier).toEqual({ add: [SUPPLIER], remove: [] });
    expect(c.body[0].timelines[0].status).toEqual({ value: "Approved" });
  });

  it("styleTimelinesArchive — flat array (not wrapped)", async () => {
    mockFetch({});
    const client = makeClient();
    await client.tracking.styleTimelinesArchive(PLAN, [TL]);

    expect(lastCall().body).toEqual([TL]);
  });

  it("styleTimelinesDelete — wrapped in {timelineIds}", async () => {
    mockFetch({});
    const client = makeClient();
    await client.tracking.styleTimelinesDelete(PLAN, [TL]);

    expect(lastCall().body).toEqual({ timelineIds: [TL] });
  });

  it("materialAdd / materialTimelineUpdate / materialTimelinesDelete", async () => {
    mockFetch({});
    const client = makeClient();
    const matId = "99396ff6-5c18-45ee-a32a-71075f3aeb44";

    await client.tracking.materialAdd(PLAN, [matId]);
    expect(lastCall().body).toEqual([matId]);

    await client.tracking.materialTimelineUpdate(PLAN, [{
      id: TL, timelines: [{ id: TI, status: { value: "Waiting On" } }],
    }]);
    expect(lastCall().url).toContain("Material/Timelines/Edit");

    await client.tracking.materialTimelinesDelete(PLAN, [TL]);
    expect(lastCall().body).toEqual({ timelineIds: [TL] });
  });
});

// ── Directory ──

describe("Directory write operations", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("add", async () => {
    mockFetch({ id: DIR_ID });
    const client = makeClient();
    await client.directory.add({ name: "Vendor Co", partnerType: "VENDOR" });

    expect(lastCall().url).toContain("Directory/Add");
    expect(lastCall().body.partnerType).toBe("VENDOR");
  });

  it("update", async () => {
    mockFetch({});
    const client = makeClient();
    await client.directory.update(DIR_ID, { name: "Updated" });

    expect(lastCall().url).toContain(`Directory/Update/${DIR_ID}`);
  });

  it("contactAdd / contactUpdate", async () => {
    mockFetch({});
    const client = makeClient();

    await client.directory.contactAdd(DIR_ID, { email: "j@v.com", firstName: "John", lastName: "Doe" });
    expect(lastCall().url).toContain(`Directory/${DIR_ID}/Contact/Add`);

    await client.directory.contactUpdate(DIR_ID, CONTACT, { title: "Manager" });
    expect(lastCall().url).toContain(`Directory/${DIR_ID}/Contact/${CONTACT}/Update`);
  });
});

// ── Users ──

describe("User write operations", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("create / update", async () => {
    mockFetch({});
    const client = makeClient();

    await client.user.create({ email: "new@test.com", firstName: "New", lastName: "User", roleId: ROLE });
    expect(lastCall().body.roleId).toBe(ROLE);

    await client.user.update(USER1, { title: "Senior", active: true });
    expect(lastCall().url).toContain(`Users/${USER1}/Update`);
  });
});

// ── Data Tables ──

describe("DataTable write operations", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("update — add, update, delete rows", async () => {
    const row1 = "71c8d696-d134-4ab2-bba0-893fe6c2d0c5";
    const row2 = "916a2a96-e8cb-43eb-8cdf-62d2f0cd1c41";
    mockFetch({ updated: 1, added: 1, deleted: 1 });
    const client = makeClient();
    await client.dataTables.update(DT, [
      { rowId: row1, rowFields: [{ id: "drop_down_20_11", value: "Choice 2" }], deleteRow: false },
      { rowId: null, rowFields: [{ id: "drop_down_20_11", value: "New" }] },
      { rowId: row2, rowFields: [], deleteRow: true },
    ]);

    expect(lastCall().url).toContain(`DataTable/${DT}/Update`);
    expect(lastCall().body).toHaveLength(3);
  });

  it("reset", async () => {
    mockFetch({});
    const client = makeClient();
    await client.dataTables.reset(DT);

    expect(lastCall().url).toContain(`DataTable/${DT}/Reset`);
  });
});

// ── Master Data ──

describe("MasterData write operations", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("create", async () => {
    mockFetch({});
    const client = makeClient();
    await client.masterData.create({ fieldType: "ComboBox", fieldId: "my_custom_field", fieldName: "My Field" });

    expect(lastCall().url).toContain("MasterData/Create");
  });

  it("update", async () => {
    mockFetch({});
    const client = makeClient();
    await client.masterData.update("combobox999", { fieldName: "Updated", active: true });

    expect(lastCall().url).toContain("MasterData/combobox999/Update");
  });

  it("folderFieldUpdate", async () => {
    mockFetch({});
    const client = makeClient();
    await client.masterData.folderFieldUpdate(FOLDER, "combobox999", { requiredValue: true });

    expect(lastCall().url).toContain(`MasterData/Field/${FOLDER}/combobox999/Update`);
  });
});
