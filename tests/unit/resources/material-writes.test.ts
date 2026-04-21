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

const FOLDER  = "b9300457-3060-4965-b418-77029568f95b";
const HEADER  = "99396ff6-5c18-45ee-a32a-71075f3aeb44";
const CW1     = "24d686b0-6005-44cf-a3f8-25cb3cf8eccc";
const CW2     = "a4719c53-b747-44bf-bbcc-2eda9537f449";
const SUPPLIER = "9057032d-13fd-463e-87bd-437a94dffeb8";
const APP     = "1518bffc-753c-40cc-888e-a2cf98527260";
const TL      = "5a8b490a-b309-48fc-8a96-103d41ab00bb";
const M3D_APP = "d2a2ddee-1a57-42b3-addc-9c8009daa933";

describe("Material write operations", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("create — with suppliers", async () => {
    mockFetch({ id: "a1b2c3d4-0000-0000-0000-000000000010" });
    const client = makeClient();
    await client.material.create(FOLDER, { header_name: "Fabric" }, { suppliers: [{ id: SUPPLIER }], preserveVersion: false });

    const c = lastCall();
    expect(c.url).toContain("Material/Header/Create");
    expect(c.url).toContain(`folderId=${FOLDER}`);
    expect(c.body.fields).toEqual([{ id: "header_name", value: "Fabric" }]);
    expect(c.body.suppliers).toEqual([{ id: SUPPLIER }]);
  });

  it("update — with colorways and sizes", async () => {
    mockFetch({});
    const client = makeClient();
    await client.material.update(HEADER, { header_name: "Updated" }, { colorways: [{ id: CW1 }], sizes: [{ name: "S" }] });

    const c = lastCall();
    expect(c.url).toContain(`Material/Header/${HEADER}/Update`);
    expect(c.body.colorways).toEqual([{ id: CW1 }]);
    expect(c.body.sizes).toEqual([{ name: "S" }]);
  });

  it("colorwayDelete / colorwaysDelete", async () => {
    mockFetch({});
    const client = makeClient();

    await client.material.colorwayDelete(HEADER, CW1);
    let c = lastCall();
    expect(c.url).toContain(`Material/Header/${HEADER}/Colorway/Delete/${CW1}`);
    expect(c.method).toBe("GET");

    await client.material.colorwaysDelete(HEADER, [CW1, CW2]);
    c = lastCall();
    expect(c.url).toContain(`Material/Header/${HEADER}/Colorways/Delete`);
    expect(c.body).toEqual({ colorwayIds: [CW1, CW2] });
  });

  it("move", async () => {
    mockFetch({});
    const client = makeClient();
    const targetFolder = "425a0da7-5929-42f0-85fc-7607e486a696";
    await client.material.move(HEADER, targetFolder);

    const c = lastCall();
    expect(c.url).toContain(`Material/Header/${HEADER}/Move`);
    expect(c.body).toEqual({ targetFolderId: targetFolder, generateNewHeaderNumber: false });
  });

  it("requestPageFormUpdate — with timelineId", async () => {
    mockFetch({});
    const client = makeClient();
    await client.material.requestPageFormUpdate(HEADER, APP, TL, { cost: "10.00" });

    const c = lastCall();
    expect(c.url).toContain("Material/RequestPageForm");
    expect(c.url).toContain(`headerId=${HEADER}`);
    expect(c.url).toContain(`pageId=${APP}`);
    expect(c.url).toContain(`timelineId=${TL}`);
    expect(c.body).toEqual([{ id: "cost", value: "10.00" }]);
  });

  it("material3dAppUpdate", async () => {
    mockFetch({});
    const client = makeClient();
    await client.material.material3dAppUpdate(HEADER, M3D_APP, { assets: { itemsToDelete: ["a1b2c3d4-0000-0000-0000-000000000020"] } });

    const c = lastCall();
    expect(c.url).toContain("Material/Material3DAppPost");
    expect(c.url).toContain(`materialId=${HEADER}`);
    expect(c.url).toContain(`pageId=${M3D_APP}`);
  });
});
