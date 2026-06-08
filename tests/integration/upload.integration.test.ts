import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { getClient, DOMAIN, SKIP_PARITY, ASSET_1KB } from "./setup.js";
import { BeProductError } from "../../src/index.js";
import { loadFixtures, type Fixtures } from "./fixtures.js";
import { TrashBin, createTmpStyle, waitForUpload } from "./helpers.js";

const FILE = { filepath: ASSET_1KB };
const FNAME = "1kb.jpg";
const FBASE = "1kb";
const UPLOAD_TIMEOUT = 120_000;

describe.skipIf(SKIP_PARITY)("Integration — uploads (golden comparison)", () => {
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

  it(
    "uploads attribute images (front + back position)",
    async () => {
      const tmp = await createTmpStyle(client, fx, trash);

      const frontUploadId = await client.style.upload(tmp.id, FILE);
      expect(await waitForUpload(client, frontUploadId!)).toBe(true);
      let style = (await client.style.get(tmp.id)) as any;
      expect(style.headerData.frontImage.origin).toContain(FNAME);

      const backUploadId = await client.style.upload(tmp.id, FILE, "back");
      expect(await waitForUpload(client, backUploadId!)).toBe(true);
      style = (await client.style.get(tmp.id)) as any;
      expect(style.headerData.backImage.origin).toContain(FNAME);
    },
    UPLOAD_TIMEOUT,
  );

  it(
    "uploads an image to a list item",
    async () => {
      const tmp = await createTmpStyle(client, fx, trash);
      const itemId = randomUUID();

      await client.style.appListUpdate(tmp.id, fx.listApp.id, [
        { itemId, itemFields: fx.listAppItemInsert },
      ]);

      const uploadId = await client.style.appListUpload(tmp.id, fx.listApp.id, itemId, FILE);
      expect(await waitForUpload(client, uploadId!)).toBe(true);

      const app = (await client.style.appGet(tmp.id, fx.listApp.id)) as any;
      const item = (app.data as any[]).find((r) => r.id === itemId);
      expect(item, "list item not found").toBeTruthy();
      expect(item.origin).toContain(FNAME);
    },
    UPLOAD_TIMEOUT,
  );

  it(
    "uploads then removes an attachment",
    async () => {
      const tmp = await createTmpStyle(client, fx, trash);

      await client.style.appAttachmentsUpload(tmp.id, fx.attachmentsApp.id, FILE);
      let app = (await client.style.appGet(tmp.id, fx.attachmentsApp.id)) as any;
      expect(app.data.files[0].url).toContain(FNAME);

      // KNOWN BACKEND QUIRK: AttachmentRemove deletes the file but then 500s
      // with a NullReferenceException while building the response (same pattern
      // as header delete — the operation succeeds, the response-build fails).
      // Verified empirically: the file IS gone afterward. Tolerate the 500 and
      // assert the real outcome.
      try {
        await client.style.appAttachmentsDelete(tmp.id, fx.attachmentsApp.id, [FBASE]);
      } catch (e) {
        if (!(e instanceof BeProductError) || e.statusCode !== 500) throw e;
      }
      app = (await client.style.appGet(tmp.id, fx.attachmentsApp.id)) as any;
      expect(app.data.files.length).toBe(0);
    },
    UPLOAD_TIMEOUT,
  );

  it(
    "uploads an image into an ImagesForm app",
    async () => {
      const tmp = await createTmpStyle(client, fx, trash);

      const uploadId = await client.style.appImageFormUpload(tmp.id, fx.imageformApp.id, FILE);
      expect(await waitForUpload(client, uploadId!)).toBe(true);

      const app = (await client.style.appGet(tmp.id, fx.imageformApp.id)) as any;
      expect(app.data.image[0].origin).toContain(FNAME);
    },
    UPLOAD_TIMEOUT,
  );

  it(
    "uploads an image into an ImagesGrid app",
    async () => {
      const tmp = await createTmpStyle(client, fx, trash);

      const uploadId = await client.style.appImageGridUpload(tmp.id, fx.imagegridApp.id, FILE);
      expect(await waitForUpload(client, uploadId!)).toBe(true);

      const app = (await client.style.appGet(tmp.id, fx.imagegridApp.id)) as any;
      expect(app.data.image[0].origin).toContain(FNAME);
    },
    UPLOAD_TIMEOUT,
  );
});
