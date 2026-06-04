import type { FileInput } from "../http.js";
import type { SchemaField, AppPage, UpdateItem } from "../schemas/common.js";
import { fieldsToUpdateItems } from "../schemas/common.js";
import type { MaterialHeader } from "../schemas/material.js";
import { EntityResource } from "./base.js";

/** Which material attribute image slot to upload to. */
export type MaterialImagePosition = "main" | "detail";

export class MaterialResource extends EntityResource {
  protected entityType = "Material";

  async colorwaySchema(folderId: string): Promise<SchemaField[]> {
    return this.http.get("Material/ColorwaySchema", { folderId });
  }

  async sizeRangeSchema(folderId: string): Promise<SchemaField[]> {
    return this.http.get("Material/SizeRangeSchema", { folderId });
  }

  async folderPages(folderId: string): Promise<AppPage[]> {
    return this.http.get(`Material/FolderPages/${folderId}`);
  }

  override async get(headerId: string): Promise<MaterialHeader> {
    return this.http.get(`Material/Header/${headerId}`);
  }

  /**
   * Upload an image to the material's attributes. Pass `position` to target
   * the `"main"` or `"detail"` slot; omit it for the default upload. Returns
   * the image id — poll {@link imageProcessingStatus} for completion.
   *
   * @example
   *   const id = await client.material.upload(headerId, { filepath }, "main");
   */
  override async upload(
    headerId: string,
    file: FileInput,
    position?: MaterialImagePosition,
  ): Promise<string | null> {
    return super.upload(headerId, file, position);
  }

  async create(
    folderId: string,
    fields: Record<string, unknown> | UpdateItem[],
    options?: { colorways?: unknown[]; sizes?: unknown[]; suppliers?: unknown[]; preserveVersion?: boolean },
  ): Promise<MaterialHeader> {
    const f = Array.isArray(fields) ? fields : fieldsToUpdateItems(fields);
    return this.http.post("Material/Header/Create", {
      fields: f, colorways: options?.colorways, sizes: options?.sizes, suppliers: options?.suppliers,
    }, { folderId, preserveVersion: options?.preserveVersion });
  }

  async update(
    headerId: string,
    fields?: Record<string, unknown> | UpdateItem[],
    options?: { colorways?: unknown[]; sizes?: unknown[]; suppliers?: unknown[] },
  ): Promise<MaterialHeader> {
    const f = fields ? (Array.isArray(fields) ? fields : fieldsToUpdateItems(fields)) : [];
    return this.http.post(`Material/Header/${headerId}/Update`, {
      fields: f, colorways: options?.colorways, sizes: options?.sizes, suppliers: options?.suppliers,
    });
  }

  async colorwayDelete(headerId: string, colorwayId: string): Promise<unknown> {
    return this.http.get(`Material/Header/${headerId}/Colorway/Delete/${colorwayId}`);
  }

  async colorwaysDelete(headerId: string, colorwayIds: string[]): Promise<unknown> {
    return this.http.post(`Material/Header/${headerId}/Colorways/Delete`, { colorwayIds });
  }

  async colorwayUpload(headerId: string, file: FileInput, options?: { colorwayId?: string; colorNumber?: string }): Promise<string | null> {
    return this.http.uploadFile(`Material/Header/${headerId}/ColorwayImage/Upload`, file, {
      colorId: options?.colorwayId, colorNumber: options?.colorNumber,
    });
  }

  async move(headerId: string, targetFolderId: string, generateNewHeaderNumber = false): Promise<unknown> {
    return this.http.post(`Material/Header/${headerId}/Move`, { targetFolderId, generateNewHeaderNumber });
  }

  async artboardVersionUpload(headerId: string, file: FileInput): Promise<string | null> {
    return this.http.uploadFile(`Material/Header/${headerId}/Image/Upload`, file);
  }

  async imageProcessingStatus(imageId: string): Promise<unknown> {
    return this.http.get(`Material/GetImageProcessingStatus/${imageId}`);
  }

  // ── Request pages ──
  async requestPageList(headerId: string): Promise<AppPage[]> {
    return this.http.get("Material/RequestPages", { headerId });
  }

  async requestPageGet(headerId: string, appId: string, timelineId?: string): Promise<unknown> {
    return this.http.get("Material/RequestPage", { headerId, pageId: appId, timelineId });
  }

  async requestPageFormUpdate(headerId: string, appId: string, timelineId: string, fields: Record<string, unknown> | UpdateItem[]): Promise<unknown> {
    const body = Array.isArray(fields) ? fields : fieldsToUpdateItems(fields);
    return this.http.post("Material/RequestPageForm", body, { headerId, pageId: appId, timelineId });
  }

  // ── 3D Material ──
  async material3dAssetUpload(headerId: string, appId: string, colorwayId: string, file: FileInput): Promise<string | null> {
    return this.http.uploadFile("Material/Material3DAppImageUpload", file, { materialId: headerId, pageId: appId, colorwayId });
  }

  async material3dPreviewUpload(headerId: string, appId: string, colorwayId: string, file: FileInput): Promise<string | null> {
    return this.http.uploadFile("Material/Material3DPreviewUpload", file, { materialId: headerId, pageId: appId, colorwayId });
  }

  async material3dTextureUpload(headerId: string, appId: string, colorwayId: string, side: "front" | "back", file: FileInput): Promise<string | null> {
    const capSide = side.charAt(0).toUpperCase() + side.slice(1);
    return this.http.uploadFile(`Material/Material3D${capSide}TextureUpload`, file, { materialId: headerId, pageId: appId, colorwayId });
  }

  async material3dAppUpdate(headerId: string, appId: string, data: unknown): Promise<unknown> {
    return this.http.post("Material/Material3DAppPost", data, { materialId: headerId, pageId: appId });
  }
}
