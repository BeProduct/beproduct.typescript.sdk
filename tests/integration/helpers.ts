import type { BeProduct } from "../../src/index.js";
import type { Fixtures } from "./fixtures.js";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Tracks temporary entities created during a test and deletes them afterwards,
 * even when the test failed. Mirrors the Python suite's `trash_bin` + `cleanup`.
 */
export class TrashBin {
  private readonly styleIds: string[] = [];

  constructor(private readonly client: BeProduct) {}

  registerStyle(id: string): void {
    this.styleIds.push(id);
  }

  async cleanup(): Promise<void> {
    for (const id of this.styleIds.splice(0)) {
      try {
        await this.client.style.deleteHeader(id);
      } catch {
        // best-effort cleanup — don't mask the real test failure
      }
    }
  }
}

/**
 * Create a throwaway style from the `tmpStyleAttributesFields` fixture and
 * register it for cleanup. Returns the created header.
 */
export async function createTmpStyle(
  client: BeProduct,
  fixtures: Fixtures,
  trash: TrashBin,
  options?: { colorways?: unknown[]; sizes?: unknown[] },
): Promise<Record<string, any>> {
  const style = (await client.style.create(
    fixtures.styleFolder.id,
    fixtures.tmpStyleAttributesFields,
    options,
  )) as Record<string, any>;
  trash.registerStyle(style.id);
  return style;
}

/**
 * Poll upload processing status until finished. Port of the Python
 * `check_upload_status`. Returns true on success, false on error / timeout.
 */
export async function waitForUpload(
  client: BeProduct,
  uploadId: string,
  attempts = 20,
  intervalMs = 3000,
): Promise<boolean> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const { finished, errorOccurred } = await client.style.uploadStatus(uploadId);
    if (finished) return !errorOccurred;
    if (attempt < attempts) await sleep(intervalMs);
  }
  return false;
}
