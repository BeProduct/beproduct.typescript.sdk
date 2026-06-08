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
  return new BeProduct({ companyDomain: "test-co", accessToken: "test-token" });
}

/** URL of the most recent fetch call (upload bodies are FormData, not JSON). */
function lastUrl(): string {
  const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
  return calls[calls.length - 1][0] as string;
}

/** Parsed JSON request of the most recent fetch call (for JSON-body endpoints). */
function lastCall() {
  const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
  const [url, opts] = calls[calls.length - 1] as [string, RequestInit];
  return { url, method: opts.method, body: opts.body ? JSON.parse(opts.body as string) : undefined };
}

const HEADER = "f5ef0e21-e069-445c-ad60-9cd50490ce85";
const APP = "6855d616-9b0d-40ff-a806-285e36aa76ea";

function pngFile() {
  return { buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]), filename: "swatch.png" };
}

describe("#1 Typed image position upload", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("style.upload — front position appends /Position/front", async () => {
    mockFetch({ imageId: "img-1" });
    const client = makeClient();
    const id = await client.style.upload(HEADER, pngFile(), "front");

    expect(lastUrl()).toContain(`Style/Header/${HEADER}/Image/Upload/Position/front`);
    expect(id).toBe("img-1");
  });

  it("style.upload — side and back positions", async () => {
    mockFetch({ imageId: "img-2" });
    const client = makeClient();

    await client.style.upload(HEADER, pngFile(), "side");
    expect(lastUrl()).toContain(`/Image/Upload/Position/side`);

    await client.style.upload(HEADER, pngFile(), "back");
    expect(lastUrl()).toContain(`/Image/Upload/Position/back`);
  });

  it("style.upload — no position uploads to the default endpoint", async () => {
    mockFetch({ imageId: "img-3" });
    const client = makeClient();
    await client.style.upload(HEADER, pngFile());

    const url = lastUrl();
    expect(url).toContain(`Style/Header/${HEADER}/Image/Upload`);
    expect(url).not.toContain("/Position/");
  });

  it("material.upload — main and detail positions", async () => {
    mockFetch({ imageId: "img-4" });
    const client = makeClient();

    await client.material.upload(HEADER, pngFile(), "main");
    expect(lastUrl()).toContain(`Material/Header/${HEADER}/Image/Upload/Position/main`);

    await client.material.upload(HEADER, pngFile(), "detail");
    expect(lastUrl()).toContain(`/Image/Upload/Position/detail`);
  });
});

describe("#3 appImageGridUpload", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("style.appImageGridUpload — posts to GridFormImageAppImageUpload with ids", async () => {
    mockFetch({ imageId: "img-grid" });
    const client = makeClient();
    const id = await client.style.appImageGridUpload(HEADER, APP, pngFile());

    const url = lastUrl();
    expect(url).toContain("Style/GridFormImageAppImageUpload");
    expect(url).toContain(`styleId=${HEADER}`);
    expect(url).toContain(`pageId=${APP}`);
    expect(id).toBe("img-grid");
  });

  it("material.appImageGridUpload — uses material entity key", async () => {
    mockFetch({ imageId: "img-grid-mat" });
    const client = makeClient();
    await client.material.appImageGridUpload(HEADER, APP, pngFile());

    const url = lastUrl();
    expect(url).toContain("Material/GridFormImageAppImageUpload");
    expect(url).toContain(`materialId=${HEADER}`);
  });

  it("appImagesGridItemUpload — posts to ImagesGridAppImageUpload with listItemId", async () => {
    mockFetch({ imageId: "img-ig-item" });
    const client = makeClient();
    const id = await client.style.appImagesGridItemUpload(HEADER, APP, "item-1", pngFile());

    const url = lastUrl();
    expect(url).toContain("Style/ImagesGridAppImageUpload");
    expect(url).toContain(`styleId=${HEADER}`);
    expect(url).toContain(`pageId=${APP}`);
    expect(url).toContain("listItemId=item-1");
    expect(id).toBe("img-ig-item");
  });

  it("appTextListUpload — posts to TextListAppImageUpload with listItemId", async () => {
    mockFetch({ imageId: "img-tl-item" });
    const client = makeClient();
    const id = await client.style.appTextListUpload(HEADER, APP, "item-2", pngFile());

    const url = lastUrl();
    expect(url).toContain("Style/TextListAppImageUpload");
    expect(url).toContain(`styleId=${HEADER}`);
    expect(url).toContain("listItemId=item-2");
    expect(id).toBe("img-tl-item");
  });
});

describe("#4 getByNumber", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns the first header matching the header_number filter", async () => {
    mockFetch({ result: [{ id: HEADER, headerNumber: "T-101" }], total: 1 });
    const client = makeClient();
    const header = await client.style.getByNumber("T-101");

    const c = lastCall();
    expect(c.url).toContain("Style/Headers");
    expect(c.method).toBe("POST");
    expect(c.body.filters).toEqual([{ field: "header_number", operator: "Eq", value: "T-101" }]);
    expect(header).toEqual({ id: HEADER, headerNumber: "T-101" });
  });

  it("returns null when no header matches", async () => {
    mockFetch({ result: [], total: 0 });
    const client = makeClient();
    const header = await client.style.getByNumber("DOES-NOT-EXIST");

    expect(header).toBeNull();
  });
});
