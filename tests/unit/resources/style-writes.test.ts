import { describe, it, expect, vi, beforeEach } from "vitest";
import { BeProduct } from "../../../src/client.js";

function mockFetch(responseBody: unknown = {}) {
  const fn = vi.fn().mockResolvedValue({
    ok: true, status: 200,
    headers: new Headers(),
    json: () => Promise.resolve(responseBody),
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

function makeClient() {
  return new BeProduct({
    companyDomain: "test-co",
    accessToken: "test-token",
  });
}

function lastCall() {
  const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
  const [url, opts] = calls[calls.length - 1] as [string, RequestInit];
  return { url, method: opts.method, body: opts.body ? JSON.parse(opts.body as string) : undefined };
}

// realistic GUIDs used throughout tests
const FOLDER   = "8bc24c21-79e7-4aa6-91d3-811d1df2e84c";
const HEADER   = "f5ef0e21-e069-445c-ad60-9cd50490ce85";
const APP      = "6855d616-9b0d-40ff-a806-285e36aa76ea";
const CW1      = "24d686b0-6005-44cf-a3f8-25cb3cf8eccc";
const CW2      = "a4719c53-b747-44bf-bbcc-2eda9537f449";
const MAT_CW1  = "cad0eb44-f706-4d13-9a6f-d6dd7d90e679";
const MAT_CW2  = "016e9860-3acf-4748-9260-bc670c85d2d6";
const BLOCK    = "c149c088-621d-4494-8630-45720f547005";
const SC       = "9ee73cfa-6bfd-42a0-82d6-aba61fac6907";
const ROW      = "43a114e7-22f0-4321-954a-cd1879d6c026";
const MAT      = "e2cc90d4-f76f-47ca-8959-4be666f49dd1";
const TL       = "5a8b490a-b309-48fc-8a96-103d41ab00bb";
const VER      = "359ed3fd-b052-4f9f-91d1-9891dac387fd";

describe("Style write operations", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("create — POST Style/Header/Create with fields transform", async () => {
    mockFetch({ id: "a1b2c3d4-0000-0000-0000-000000000001" });
    const client = makeClient();
    await client.style.create(FOLDER, { header_name: "New Style" }, { colorways: [{ colorNumber: "C1" }], preserveVersion: true });

    const c = lastCall();
    expect(c.url).toContain("Style/Header/Create");
    expect(c.url).toContain(`folderId=${FOLDER}`);
    expect(c.url).toContain("preserveVersion=true");
    expect(c.method).toBe("POST");
    expect(c.body.fields).toEqual([{ id: "header_name", value: "New Style" }]);
    expect(c.body.colorways).toEqual([{ colorNumber: "C1" }]);
  });

  it("update — POST Style/Header/{id}/Update", async () => {
    mockFetch({});
    const client = makeClient();
    await client.style.update(HEADER, { header_name: "Updated" }, { sizes: [{ name: "M" }] });

    const c = lastCall();
    expect(c.url).toContain(`Style/Header/${HEADER}/Update`);
    expect(c.body.fields).toEqual([{ id: "header_name", value: "Updated" }]);
    expect(c.body.sizes).toEqual([{ name: "M" }]);
  });

  it("deleteHeader — GET Style/Header/Delete/{id}", async () => {
    mockFetch({});
    const client = makeClient();
    await client.style.deleteHeader(HEADER);

    const c = lastCall();
    expect(c.url).toContain(`Style/Header/Delete/${HEADER}`);
    expect(c.method).toBe("GET");
  });

  it("colorwayDelete — GET (API quirk)", async () => {
    mockFetch({});
    const client = makeClient();
    await client.style.colorwayDelete(HEADER, CW1);

    const c = lastCall();
    expect(c.url).toContain(`Style/Header/${HEADER}/Colorway/Delete/${CW1}`);
    expect(c.method).toBe("GET");
  });

  it("colorwaysDelete — POST with colorwayIds", async () => {
    mockFetch({});
    const client = makeClient();
    await client.style.colorwaysDelete(HEADER, [CW1, CW2]);

    const c = lastCall();
    expect(c.url).toContain(`Style/Header/${HEADER}/Colorways/Delete`);
    expect(c.body).toEqual({ colorwayIds: [CW1, CW2] });
  });

  it("move — POST with targetFolderId", async () => {
    mockFetch({});
    const client = makeClient();
    await client.style.move(HEADER, FOLDER, true);

    const c = lastCall();
    expect(c.url).toContain(`Style/Header/${HEADER}/Move`);
    expect(c.body).toEqual({ targetFolderId: FOLDER, generateNewHeaderNumber: true });
  });

  it("carryOver — POST", async () => {
    mockFetch({ id: "a1b2c3d4-0000-0000-0000-000000000002" });
    const client = makeClient();
    await client.style.carryOver(HEADER, true);

    const c = lastCall();
    expect(c.url).toContain(`Style/Header/${HEADER}/CarryOver`);
    expect(c.body).toEqual({ skipColorways: true });
  });

  it("blockLink / blockUnlink", async () => {
    mockFetch({});
    const client = makeClient();

    await client.style.blockLink(HEADER, BLOCK, [{ name: "Missy" }]);
    let c = lastCall();
    expect(c.url).toContain(`Style/Header/${HEADER}/Block/Link`);
    expect(c.body).toEqual({ blockHeaderId: BLOCK, sizeClasses: [{ name: "Missy" }] });

    await client.style.blockUnlink(HEADER);
    c = lastCall();
    expect(c.url).toContain(`Style/Header/${HEADER}/Block/Unlink`);
    expect(c.method).toBe("GET");
  });

  it("skuGenerate — POST Sku/{headerId}/{appId}/Generate", async () => {
    mockFetch({});
    const client = makeClient();
    await client.style.skuGenerate(HEADER, APP);

    const c = lastCall();
    expect(c.url).toContain(`Style/Sku/${HEADER}/${APP}/Generate`);
    expect(c.body).toEqual({});
  });

  it("skuUpdate — POST PageSku with items", async () => {
    mockFetch({});
    const client = makeClient();
    const skuId = "b1c2d3e4-0000-0000-0000-000000000001";
    await client.style.skuUpdate(HEADER, APP, [{ id: skuId, fields: [{ id: "custom_cost", value: "9.99" }] }]);

    const c = lastCall();
    expect(c.url).toContain("Style/PageSku");
    expect(c.url).toContain(`headerId=${HEADER}`);
    expect(c.url).toContain(`pageId=${APP}`);
  });

  it("bomUpdate — POST PageCBOM with material rows + colorUpdate array", async () => {
    mockFetch({});
    const client = makeClient();
    await client.style.bomUpdate(HEADER, APP, [{
      materialUpdate: { rowId: ROW, rowFields: [{ id: "qty", value: "2" }, { id: "placement", value: "Body" }] },
      colorUpdate: [
        { colorId: MAT_CW1, colorNumber: "NAVY-001", colorName: "Navy", hex: "#000080", colorwayId: CW1 },
        { colorId: MAT_CW2, colorNumber: "RED-001", colorName: "Red", hex: "#ff0000", colorwayId: CW2 },
      ],
      materialIdToInsert: MAT,
    }]);

    const c = lastCall();
    expect(c.url).toContain("Style/PageCBOM");
    expect(c.url).toContain(`headerId=${HEADER}`);
    expect(c.body[0].materialIdToInsert).toBe(MAT);
    expect(c.body[0].materialUpdate.rowId).toBe(ROW);
    expect(c.body[0].colorUpdate).toHaveLength(2);
    expect(c.body[0].colorUpdate[0].colorwayId).toBe(CW1);
    expect(c.body[0].colorUpdate[1].colorId).toBe(MAT_CW2);
  });

  it("bomReset — POST CBOM Reset", async () => {
    mockFetch({});
    const client = makeClient();
    await client.style.bomReset(HEADER, APP);

    const c = lastCall();
    expect(c.url).toContain(`Style/${HEADER}/CBOM/${APP}/Reset`);
  });

  it("bomItemDelete — DELETE PageCBOMItemDelete with rowId (not materialId)", async () => {
    mockFetch({});
    const client = makeClient();
    await client.style.bomItemDelete(HEADER, APP, ROW);

    const c = lastCall();
    expect(c.url).toContain("Style/PageCBOMItemDelete");
    expect(c.url).toContain(`rowId=${ROW}`);
    expect(c.url).not.toContain("materialId");
    expect(c.method).toBe("DELETE");
  });

  it("requestPageFormUpdate — POST with timelineId + fields dict", async () => {
    mockFetch({});
    const client = makeClient();
    const reqApp = "d038bbb5-3d01-4db4-95f5-6c1690d36826";
    await client.style.requestPageFormUpdate(HEADER, reqApp, TL, { costing_total: "25.50" });

    const c = lastCall();
    expect(c.url).toContain("Style/RequestPageForm");
    expect(c.url).toContain(`headerId=${HEADER}`);
    expect(c.url).toContain(`pageId=${reqApp}`);
    expect(c.url).toContain(`timelineId=${TL}`);
    expect(c.body).toEqual([{ id: "costing_total", value: "25.50" }]);
  });

  it("sampleRequestMultiAddSubmit — with timelineId from tracking context", async () => {
    mockFetch({});
    const client = makeClient();
    const srApp = "ecec3425-8ae9-4f35-b772-66f6f68fc6a6";
    await client.style.sampleRequestMultiAddSubmit(HEADER, srApp, {
      submitName: "Proto",
      sizes: [{ sizeClass: SC, sizeName: "M" }],
    }, TL);

    const c = lastCall();
    expect(c.url).toContain(`Style/${HEADER}/PageSampleRequestMulti/${srApp}/AddSubmit`);
    expect(c.url).toContain(`timelineId=${TL}`);
    expect(c.body.submitName).toBe("Proto");
  });

  it("sampleRequestMultiAddSubmit — without timelineId", async () => {
    mockFetch({});
    const client = makeClient();
    const srApp = "ecec3425-8ae9-4f35-b772-66f6f68fc6a6";
    await client.style.sampleRequestMultiAddSubmit(HEADER, srApp, { submitName: "Proto" });

    const c = lastCall();
    expect(c.url).toContain(`PageSampleRequestMulti/${srApp}/AddSubmit`);
    expect(c.url).not.toContain("timelineId");
  });

  it("multiMeasurementsUpdate / Reset", async () => {
    mockFetch({});
    const client = makeClient();
    const mmApp = "4cf4c86a-9a8a-4972-a241-360731f82b7d";

    await client.style.multiMeasurementsUpdate(HEADER, mmApp, { sizeClass: SC, poms: [] });
    let c = lastCall();
    expect(c.url).toContain(`Style/${HEADER}/PageMultiMeasurements/${mmApp}`);

    await client.style.multiMeasurementsReset(HEADER, mmApp);
    c = lastCall();
    expect(c.url).toContain(`Style/${HEADER}/PageMultiMeasurements/${mmApp}/Reset`);
  });

  it("setsUpdate — POST PageSets", async () => {
    mockFetch({});
    const client = makeClient();
    const setsApp = "c5126441-3bd3-49dc-ba1e-d5cd98e2426a";
    const linkedStyle = "a1b2c3d4-0000-0000-0000-000000000003";
    await client.style.setsUpdate(HEADER, setsApp, [{ styleIdToInsert: linkedStyle }]);

    const c = lastCall();
    expect(c.url).toContain("Style/PageSets");
    expect(c.url).toContain(`headerId=${HEADER}`);
    expect(c.url).toContain(`pageId=${setsApp}`);
  });

  it("linkPagesUpdate", async () => {
    mockFetch({});
    const client = makeClient();
    const lpApp = "423a8dbd-f849-477c-9952-d77b5bff21c6";
    const linkedHeader = "a1b2c3d4-0000-0000-0000-000000000004";
    const linkedPage = "a1b2c3d4-0000-0000-0000-000000000005";
    await client.style.linkPagesUpdate(HEADER, lpApp, [{ headerId: linkedHeader, pageId: linkedPage, removeLink: false }]);

    const c = lastCall();
    expect(c.url).toContain("Style/PageLinkPages");
    expect(c.url).toContain(`headerId=${HEADER}`);
  });

  it("textListEditorUpdate", async () => {
    mockFetch({});
    const client = makeClient();
    const tlApp = "5547976c-8d37-4c3d-9269-d718fb40734a";
    await client.style.textListEditorUpdate(HEADER, tlApp, "<p>Hello</p>");

    const c = lastCall();
    expect(c.url).toContain("Style/PageTextList/TextEditor");
    expect(c.url).toContain(`headerId=${HEADER}`);
    expect(c.body).toEqual({ editorData: "<p>Hello</p>" });
  });

  it("style3d version create / copy / delete / update", async () => {
    mockFetch({});
    const client = makeClient();
    const s3dApp = "359ed3fd-b052-4f9f-91d1-9891dac387fd";

    await client.style.style3dVersionCreate(HEADER, s3dApp, "V2");
    let c = lastCall();
    expect(c.url).toContain(`Style/${HEADER}/Page3DStyle/${s3dApp}/CreateVersion`);
    expect(c.body).toEqual({ versionName: "V2" });

    await client.style.style3dVersionCopy(HEADER, s3dApp, VER, "V2 Copy");
    c = lastCall();
    expect(c.body).toEqual({ versionName: "V2 Copy", copyVersionId: VER });

    await client.style.style3dVersionDelete(HEADER, s3dApp, VER);
    c = lastCall();
    expect(c.url).toContain(`Style/${HEADER}/Page3DStyle/${s3dApp}/Version/${VER}`);
    expect(c.method).toBe("DELETE");

    await client.style.style3dVersionUpdate(HEADER, s3dApp, VER, { versionName: "Updated" });
    c = lastCall();
    expect(c.url).toContain(`Version/${VER}/Update`);
  });

  it("updateSampleSize", async () => {
    mockFetch({});
    const client = makeClient();
    await client.style.updateSampleSize(HEADER, SC, "L");

    const c = lastCall();
    expect(c.url).toContain(`Style/${HEADER}/SizeClass/${SC}/UpdateSampleSize`);
    expect(c.body).toEqual({ newSampleSize: "L" });
  });

  it("flatBom", async () => {
    mockFetch({});
    const client = makeClient();
    await client.style.flatBom({ pageIds: [APP], filters: [] });

    const c = lastCall();
    expect(c.url).toContain("Style/FlatBom");
    expect(c.body).toEqual({ pageIds: [APP], filters: [] });
  });
});
