import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { getClient, DOMAIN, SKIP_PARITY } from "./setup.js";
import { loadFixtures, type Fixtures } from "./fixtures.js";
import { TrashBin, createTmpStyle } from "./helpers.js";

describe.skipIf(SKIP_PARITY)("Integration — style attributes (golden comparison)", () => {
  const client = SKIP_PARITY ? (null as never) : getClient();
  let fx: Fixtures;
  let trash: TrashBin;

  beforeAll(() => {
    fx = loadFixtures(DOMAIN);
  });
  beforeEach(() => {
    trash = new TrashBin(client);
  });
  afterEach(async () => {
    await trash.cleanup();
  });

  it("lists folders and finds the test folder", async () => {
    const folders = await client.style.folders();
    expect(Array.isArray(folders)).toBe(true);
    const folder = folders.find((f) => f.id === fx.styleFolder.id);
    expect(folder, "test folder not found in folder list").toBeTruthy();
    expect(folder).toContainSubset(fx.styleFolder);
  });

  it("gets the folder schema", async () => {
    const schema = await client.style.folderSchema(fx.styleFolder.id);
    expect(Array.isArray(schema)).toBe(true);
    expect(schema[0]).toHaveProperty("fieldId");
  });

  it("gets the folder colorway schema", async () => {
    const schema = await client.style.colorwaySchema(fx.styleFolder.id);
    expect(schema).toContainSubset(fx.styleFolderColorwaySchema);
  });

  it("searches attributes by header number", async () => {
    let first: Record<string, unknown> | undefined;
    for await (const h of client.style.list({
      filters: [{ field: "header_number", value: fx.style.headerNumber, operator: "Eq" }],
      pageSize: 1,
    })) {
      first = h;
      break;
    }
    expect(first, "no style matched header_number filter").toBeTruthy();
    expect(first).toContainSubset(fx.style);
  });

  it("searches attributes by colorway number", async () => {
    // The colour number isn't unique (other styles share it), so find GETME by id.
    let match: Record<string, unknown> | undefined;
    let scanned = 0;
    for await (const h of client.style.list({
      colorwayFilters: [
        { field: "color_number", value: fx.style.colorways[0].colorNumber, operator: "Eq" },
      ],
      pageSize: 20,
    })) {
      if ((h as Record<string, unknown>).id === fx.style.id) { match = h; break; }
      if (++scanned >= 40) break;
    }
    expect(match, "GETME not found among color_number matches").toBeTruthy();
    expect(match).toContainSubset(fx.style);
  });

  it("gets a single style by id", async () => {
    const style = await client.style.get(fx.style.id);
    expect(style).toContainSubset(fx.style);
  });

  it("creates a style with fields, colorways, and sizes", async () => {
    const created = await createTmpStyle(client, fx, trash, {
      colorways: fx.tmpStyleColorwayFields,
      sizes: fx.tmpStyleSizes,
    });
    expect(created).toContainSubset(fx.tmpStyleCreated);
  });

  it("updates style attributes", async () => {
    const tmp = await createTmpStyle(client, fx, trash);
    const updated = await client.style.update(tmp.id, { header_name: "updated header name" });
    expect((updated as Record<string, unknown>).headerName).toBe("updated header name");
  });

  it("deletes a colorway from a style", async () => {
    const tmp = await createTmpStyle(client, fx, trash, { colorways: fx.tmpStyleColorwayFields });
    const colorwayToDelete = tmp.colorways[0];

    await client.style.colorwayDelete(tmp.id, colorwayToDelete.id);

    const after = (await client.style.get(tmp.id)) as Record<string, any>;
    const stillThere = after.colorways.some((c: any) => c.id === colorwayToDelete.id);
    expect(stillThere).toBe(false);
  });

  it("creates then deletes a style", async () => {
    const tmp = await createTmpStyle(client, fx, trash);
    const fetched = (await client.style.get(tmp.id)) as Record<string, unknown>;
    expect(fetched.id).toBe(tmp.id);

    await client.style.deleteHeader(tmp.id);
  });
});
