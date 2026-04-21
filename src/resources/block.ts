import type { FileInput } from "../http.js";
import type { UpdateItem } from "../schemas/common.js";
import { fieldsToUpdateItems } from "../schemas/common.js";
import type { BlockHeader } from "../schemas/block.js";
import { EntityResource } from "./base.js";

export class BlockResource extends EntityResource {
  protected entityType = "Block";

  override async get(headerId: string): Promise<BlockHeader> {
    return this.http.get(`Block/Header/${headerId}`);
  }

  async create(
    folderId: string,
    fields: Record<string, unknown> | UpdateItem[],
    options?: { sizeClasses?: unknown[] },
  ): Promise<BlockHeader> {
    const f = Array.isArray(fields) ? fields : fieldsToUpdateItems(fields);
    return this.http.post("Block/Header/Create", { fields: f, sizeClasses: options?.sizeClasses }, { folderId });
  }

  async update(
    headerId: string,
    fields?: Record<string, unknown> | UpdateItem[],
    options?: { sizeClasses?: unknown[] },
  ): Promise<BlockHeader> {
    const f = fields ? (Array.isArray(fields) ? fields : fieldsToUpdateItems(fields)) : [];
    return this.http.post(`Block/Header/${headerId}/Update`, { fields: f, sizeClasses: options?.sizeClasses });
  }

  async sizeClass3dAssetUpload(headerId: string, sizeClassIdOrName: string, file: FileInput): Promise<string | null> {
    return this.http.uploadFile("Block/SizeClass3DAssetUpload", file, { headerId, sizeClass: sizeClassIdOrName });
  }

  async getSizeClassAssets(headerId: string, sizeClassId: string): Promise<unknown> {
    return this.http.get(`Block/GetSizeClassAssets/${headerId}/${sizeClassId}`);
  }

  async imageProcessingStatus(imageId: string): Promise<unknown> {
    return this.http.get(`Block/GetImageProcessingStatus/${imageId}`);
  }
}
