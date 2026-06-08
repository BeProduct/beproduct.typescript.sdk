import type { FileInput } from "../http.js";
import type { SchemaField, AppPage, UpdateItem, ColorwayInput } from "../schemas/common.js";
import { fieldsToUpdateItems, normalizeColorways } from "../schemas/common.js";
import type { StyleHeader } from "../schemas/style.js";
import { EntityResource } from "./base.js";

/** Where a style attribute image sits on the style. */
export type StyleImagePosition = "front" | "side" | "back";

export class StyleResource extends EntityResource {
  protected entityType = "Style";

  async colorwaySchema(folderId: string): Promise<SchemaField[]> {
    return this.http.get("Style/ColorwaySchema", { folderId });
  }

  async sizeRangeSchema(folderId: string): Promise<SchemaField[]> {
    return this.http.get("Style/SizeRangeSchema", { folderId });
  }

  async folderPages(folderId: string): Promise<AppPage[]> {
    return this.http.get(`Style/FolderPages/${folderId}`);
  }

  override async get(headerId: string): Promise<StyleHeader> {
    return this.http.get(`Style/Header/${headerId}`);
  }

  /**
   * Upload an image to the style's attributes (main artboard image).
   * Pass `position` to target a specific view — `"front"`, `"side"`, or
   * `"back"`; omit it for the default artboard upload. Returns the image id,
   * which you can poll via {@link imageProcessingStatus}.
   *
   * @example
   *   const id = await client.style.upload(headerId, { filepath }, "front");
   */
  override async upload(
    headerId: string,
    file: FileInput,
    position?: StyleImagePosition,
  ): Promise<string | null> {
    return super.upload(headerId, file, position);
  }

  async create(
    folderId: string,
    fields: Record<string, unknown> | UpdateItem[],
    options?: {
      colorways?: ColorwayInput[];
      sizes?: unknown[];
      sizeClasses?: unknown[];
      preserveVersion?: boolean;
    },
  ): Promise<StyleHeader> {
    const f = Array.isArray(fields) ? fields : fieldsToUpdateItems(fields);
    return this.http.post("Style/Header/Create", {
      fields: f,
      colorways: normalizeColorways(options?.colorways),
      sizes: options?.sizes,
      sizeClasses: options?.sizeClasses,
    }, { folderId, preserveVersion: options?.preserveVersion });
  }

  async update(
    headerId: string,
    fields?: Record<string, unknown> | UpdateItem[],
    options?: { colorways?: ColorwayInput[]; sizes?: unknown[]; sizeClasses?: unknown[] },
  ): Promise<StyleHeader> {
    const f = fields
      ? Array.isArray(fields) ? fields : fieldsToUpdateItems(fields)
      : [];
    return this.http.post(`Style/Header/${headerId}/Update`, {
      fields: f,
      colorways: normalizeColorways(options?.colorways),
      sizes: options?.sizes,
      sizeClasses: options?.sizeClasses,
    });
  }

  async colorwayDelete(headerId: string, colorwayId: string): Promise<unknown> {
    return this.http.get(`Style/Header/${headerId}/Colorway/Delete/${colorwayId}`);
  }

  async colorwaysDelete(headerId: string, colorwayIds: string[]): Promise<unknown> {
    return this.http.post(`Style/Header/${headerId}/Colorways/Delete`, { colorwayIds });
  }

  async colorwayUpload(
    headerId: string,
    file: FileInput,
    options?: { colorwayId?: string; colorNumber?: string },
  ): Promise<string | null> {
    return this.http.uploadFile("Style/Header/" + headerId + "/ColorwayImage/Upload", file, {
      colorId: options?.colorwayId,
      colorNumber: options?.colorNumber,
    });
  }

  async move(headerId: string, targetFolderId: string, generateNewHeaderNumber = false): Promise<unknown> {
    return this.http.post(`Style/Header/${headerId}/Move`, { targetFolderId, generateNewHeaderNumber });
  }

  async carryOver(headerId: string, skipColorways = false): Promise<{ id: string }> {
    return this.http.post(`Style/Header/${headerId}/CarryOver`, { skipColorways });
  }

  async blockLink(headerId: string, blockHeaderId: string, sizeClasses?: unknown[]): Promise<unknown> {
    return this.http.post(`Style/Header/${headerId}/Block/Link`, { blockHeaderId, sizeClasses });
  }

  async blockUnlink(headerId: string): Promise<unknown> {
    return this.http.get(`Style/Header/${headerId}/Block/Unlink`);
  }

  async whereUsedInSets(headerId: string): Promise<unknown> {
    return this.http.get(`Style/WhereUsedInSets/${headerId}`);
  }

  // ── SKU ──
  async skuGenerate(headerId: string, appId: string): Promise<unknown> {
    return this.http.post(`Style/Sku/${headerId}/${appId}/Generate`, {});
  }

  async skuUpdate(headerId: string, appId: string, items: unknown[]): Promise<unknown> {
    return this.http.post("Style/PageSku", items, { headerId, pageId: appId });
  }

  // ── BOM ──
  async bomUpdate(headerId: string, appId: string, rows: unknown[]): Promise<unknown> {
    return this.http.post("Style/PageCBOM", rows, { headerId, pageId: appId });
  }

  async bomReset(headerId: string, appId: string): Promise<unknown> {
    return this.http.post(`Style/${headerId}/CBOM/${appId}/Reset`, {});
  }

  async bomItemDelete(headerId: string, appId: string, rowId: string): Promise<unknown> {
    return this.http.delete("Style/PageCBOMItemDelete", { headerId, pageId: appId, rowId });
  }

  async bomDetailsUpdate(headerId: string, appId: string, materials: unknown[]): Promise<unknown> {
    return this.http.post(`Style/${headerId}/PageBOMDetails/${appId}`, { materials });
  }

  // ── Request pages (tracking-linked) ──
  async requestPageList(headerId: string): Promise<AppPage[]> {
    return this.http.get("Style/RequestPages", { headerId });
  }

  async requestPageGet(headerId: string, appId: string, timelineId?: string): Promise<unknown> {
    return this.http.get("Style/RequestPage", { headerId, pageId: appId, timelineId });
  }

  async requestPageFormUpdate(
    headerId: string,
    appId: string,
    timelineId: string,
    fields: Record<string, unknown> | UpdateItem[],
  ): Promise<unknown> {
    const body = Array.isArray(fields) ? fields : fieldsToUpdateItems(fields);
    return this.http.post("Style/RequestPageForm", body, { headerId, pageId: appId, timelineId });
  }

  async requestPageSchema(pageId: string): Promise<unknown> {
    return this.http.get("Request/PageSchema", { pageId });
  }

  // ── Artboard ──
  async artboardVersionUpload(headerId: string, file: FileInput): Promise<string | null> {
    return this.http.uploadFile(`Style/Header/${headerId}/Image/Upload`, file);
  }

  async turntableUpload(
    headerId: string,
    file: FileInput,
    options?: { versionId?: string; replaceImages?: boolean },
  ): Promise<string | null> {
    return this.http.uploadFile(`Style/Header/${headerId}/Image/Upload/Turntable`, file, {
      versionId: options?.versionId,
      replaceImages: options?.replaceImages,
    });
  }

  async artboardAssign(body: unknown): Promise<unknown> {
    return this.http.post("Style/ArtboardImageAssign", body);
  }

  async imageProcessingStatus(imageId: string): Promise<unknown> {
    return this.http.get(`Style/GetImageProcessingStatus/${imageId}`);
  }

  // ── Multi Measurements ──
  async multiMeasurementsUpdate(headerId: string, appId: string, data: unknown): Promise<unknown> {
    return this.http.post(`Style/${headerId}/PageMultiMeasurements/${appId}`, data);
  }

  async multiMeasurementsReset(headerId: string, appId: string): Promise<unknown> {
    return this.http.post(`Style/${headerId}/PageMultiMeasurements/${appId}/Reset`, {});
  }

  // ── Sets ──
  async setsUpdate(headerId: string, appId: string, items: unknown[]): Promise<unknown> {
    return this.http.post("Style/PageSets", items, { headerId, pageId: appId });
  }

  // ── Link Pages ──
  async linkPagesUpdate(headerId: string, appId: string, items: unknown[]): Promise<unknown> {
    return this.http.post("Style/PageLinkPages", items, { headerId, pageId: appId });
  }

  // ── Text List ──
  async textListUpdate(headerId: string, appId: string, items: unknown[]): Promise<unknown> {
    return this.http.post("Style/PageTextList/List", items, { headerId, pageId: appId });
  }

  async textListEditorUpdate(headerId: string, appId: string, editorData: string): Promise<unknown> {
    return this.http.post("Style/PageTextList/TextEditor", { editorData }, { headerId, pageId: appId });
  }

  // ── 3D Style ──
  async style3dVersionCreate(headerId: string, appId: string, versionName: string): Promise<unknown> {
    return this.http.post(`Style/${headerId}/Page3DStyle/${appId}/CreateVersion`, { versionName });
  }

  async style3dVersionCopy(headerId: string, appId: string, copyVersionId: string, versionName: string): Promise<unknown> {
    return this.http.post(`Style/${headerId}/Page3DStyle/${appId}/CreateVersion`, { versionName, copyVersionId });
  }

  async style3dVersionDelete(headerId: string, appId: string, versionId: string): Promise<unknown> {
    return this.http.delete(`Style/${headerId}/Page3DStyle/${appId}/Version/${versionId}`);
  }

  async style3dVersionUpdate(headerId: string, appId: string, versionId: string, data: unknown): Promise<unknown> {
    return this.http.post(`Style/${headerId}/Page3DStyle/${appId}/Version/${versionId}/Update`, data);
  }

  async style3dWorkingFileUpload(headerId: string, appId: string, versionId: string, file: FileInput): Promise<string | null> {
    return this.http.uploadFile(`Style/${headerId}/Page3DStyle/${appId}/Version/${versionId}/WorkingFile/Upload`, file);
  }

  async style3dPreviewUpload(headerId: string, appId: string, versionId: string, colorwayId: string, file: FileInput): Promise<string | null> {
    return this.http.uploadFile(`Style/${headerId}/Page3DStyle/${appId}/Version/${versionId}/Colorway/${colorwayId}/Preview/Upload`, file);
  }

  // ── Multi-Size Sample Request ──
  /** Add submit to multi-size sample request. timelineId is needed when called from tracking context. */
  async sampleRequestMultiAddSubmit(headerId: string, appId: string, data: unknown, timelineId?: string): Promise<unknown> {
    return this.http.post(`Style/${headerId}/PageSampleRequestMulti/${appId}/AddSubmit`, data, { timelineId });
  }

  // ── Size Class ──
  async updateSampleSize(headerId: string, sizeClassId: string, newSampleSize: string): Promise<unknown> {
    return this.http.post(`Style/${headerId}/SizeClass/${sizeClassId}/UpdateSampleSize`, { newSampleSize });
  }

  // ── Flat BOM ──
  async flatBom(body: unknown): Promise<unknown> {
    return this.http.post("Style/FlatBom", body);
  }
}
