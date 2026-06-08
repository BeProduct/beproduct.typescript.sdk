import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { getClient, DOMAIN, SKIP_PARITY } from "./setup.js";
import { loadFixtures, type Fixtures } from "./fixtures.js";
import { TrashBin, createTmpStyle } from "./helpers.js";
import { parseAppData } from "../../src/schemas/apps.js";

describe.skipIf(SKIP_PARITY)("Integration — style apps (golden comparison)", () => {
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

  it("gets an app schema", async () => {
    const formApp = (fx.styleAppList as any[]).find((a) => a.type === "Form");
    const schema = await client.style.appSchema(formApp.id);
    expect(schema).toContainSubset(fx.styleAppSchema);
  });

  it("lists apps for a header", async () => {
    const apps = await client.style.appList(fx.style.id);
    expect(apps).toContainSubset(fx.styleAppList);
  });

  it("gets each app's data", async () => {
    const cases: Array<[string, Fixtures[string]]> = [
      ["formApp", fx.formApp],
      ["gridApp", fx.gridApp],
      ["listApp", fx.listApp],
      ["attachmentsApp", fx.attachmentsApp],
      ["imageformApp", fx.imageformApp],
      ["imagegridApp", fx.imagegridApp],
    ];
    for (const [name, fixture] of cases) {
      const app = await client.style.appGet(fx.style.id, fixture.id);
      expect(app, `app_get mismatch for ${name}`).toContainSubset(fixture);
    }
  });

  it("gets data for the remaining typed app types", async () => {
    type T =
      | "BOM" | "BOMDetails" | "FormGrid" | "SampleRequestApp"
      | "TextList" | "SKU" | "Sets" | "Spreadsheet" | "Revisions" | "MultiMeasurements";
    const cases: Array<[string, T, Fixtures[string]]> = [
      ["bomApp", "BOM", fx.bomApp],
      ["bomDetailsApp", "BOMDetails", fx.bomDetailsApp],
      ["formgridApp", "FormGrid", fx.formgridApp],
      ["sampleRequestApp", "SampleRequestApp", fx.sampleRequestApp],
      ["textlistApp", "TextList", fx.textlistApp],
      ["skuApp", "SKU", fx.skuApp],
      ["setsApp", "Sets", fx.setsApp],
      ["spreadsheetApp", "Spreadsheet", fx.spreadsheetApp],
      ["revisionsApp", "Revisions", fx.revisionsApp],
      ["multimeasurementsApp", "MultiMeasurements", fx.multimeasurementsApp],
    ];
    for (const [name, type, fixture] of cases) {
      const app = await client.style.appGet(fx.style.id, fixture.id);
      // golden subset against the raw response
      expect(app, `app_get mismatch for ${name}`).toContainSubset(fixture);
      // and the typed schema parses the same payload (single fetch, no re-request)
      expect(() => parseAppData(type, app.data), `typed parse failed for ${name}`).not.toThrow();
    }
  });

  it("updates a form app", async () => {
    const tmp = await createTmpStyle(client, fx, trash);

    await client.style.appFormUpdate(tmp.id, fx.formApp.id, fx.formAppUpdate);
    const formApp = (await client.style.appGet(tmp.id, fx.formApp.id)) as any;
    expect(formApp.data).toContainSubset(fx.formAppUpdated.data);

    await client.style.appFormUpdate(tmp.id, fx.imageformApp.id, fx.imageformAppUpdate);
    const imageForm = (await client.style.appGet(tmp.id, fx.imageformApp.id)) as any;
    expect(imageForm.data.form).toContainSubset(fx.imageformAppUpdated);
  });

  it("inserts, updates, and deletes a grid row", async () => {
    const tmp = await createTmpStyle(client, fx, trash);
    const rowId = randomUUID();
    const getRows = async () =>
      ((await client.style.appGet(tmp.id, fx.gridApp.id)) as any).data.gridData as any[];

    await client.style.appGridUpdate(tmp.id, fx.gridApp.id, [
      { rowId, rowFields: fx.gridAppRowInsert },
    ]);
    let row = (await getRows()).find((r) => r.rowId === rowId);
    expect(row, "inserted row not found").toBeTruthy();
    expect(row.fields).toContainSubset(fx.gridAppRowInserted);

    await client.style.appGridUpdate(tmp.id, fx.gridApp.id, [
      { rowId, rowFields: fx.gridAppRowUpdate },
    ]);
    row = (await getRows()).find((r) => r.rowId === rowId);
    expect(row.fields).toContainSubset(fx.gridAppRowUpdated);

    await client.style.appGridUpdate(tmp.id, fx.gridApp.id, [
      { rowId, rowFields: [], deleteRow: true },
    ]);
    row = (await getRows()).find((r) => r.rowId === rowId);
    expect(row).toBeUndefined();
  });

  it("inserts, updates, and deletes an image-grid row", async () => {
    const tmp = await createTmpStyle(client, fx, trash);
    const rowId = randomUUID();
    const getRows = async () =>
      ((await client.style.appGet(tmp.id, fx.imagegridApp.id)) as any).data.grid.gridData as any[];

    await client.style.appGridUpdate(tmp.id, fx.imagegridApp.id, [
      { rowId, rowFields: fx.imagegridAppRowInsert },
    ]);
    let row = (await getRows()).find((r) => r.rowId === rowId);
    expect(row, "inserted image-grid row not found").toBeTruthy();
    expect(row.fields).toContainSubset(fx.imagegridAppRowInserted);

    await client.style.appGridUpdate(tmp.id, fx.imagegridApp.id, [
      { rowId, rowFields: fx.imagegridAppRowUpdate },
    ]);
    row = (await getRows()).find((r) => r.rowId === rowId);
    expect(row.fields).toContainSubset(fx.imagegridAppRowUpdated);

    await client.style.appGridUpdate(tmp.id, fx.imagegridApp.id, [
      { rowId, rowFields: [], deleteRow: true },
    ]);
    row = (await getRows()).find((r) => r.rowId === rowId);
    expect(row).toBeUndefined();
  });

  it("inserts, updates, and deletes a list item", async () => {
    const tmp = await createTmpStyle(client, fx, trash);
    const itemId = randomUUID();
    const getItems = async () =>
      ((await client.style.appGet(tmp.id, fx.listApp.id)) as any).data as any[];

    await client.style.appListUpdate(tmp.id, fx.listApp.id, [
      { itemId, itemFields: fx.listAppItemInsert },
    ]);
    let item = (await getItems()).find((r) => r.id === itemId);
    expect(item, "inserted list item not found").toBeTruthy();
    expect(item.controls).toContainSubset(fx.listAppItemInserted);

    await client.style.appListUpdate(tmp.id, fx.listApp.id, [
      { itemId, itemFields: fx.listAppItemUpdate },
    ]);
    item = (await getItems()).find((r) => r.id === itemId);
    expect(item.controls).toContainSubset(fx.listAppItemUpdated);

    await client.style.appListUpdate(tmp.id, fx.listApp.id, [{ itemId, deleteItem: true }]);
    item = (await getItems()).find((r) => r.id === itemId);
    expect(item).toBeUndefined();
  });
});
