import type { FileInput } from "../http.js";
import type { UpdateItem } from "../schemas/common.js";
import { fieldsToUpdateItems } from "../schemas/common.js";
import type { ImageHeader } from "../schemas/image.js";
import { EntityResource } from "./base.js";

export class ImageResource extends EntityResource {
  protected entityType = "Image";

  override async get(headerId: string): Promise<ImageHeader> {
    return this.http.get(`Image/Header/${headerId}`);
  }

  async create(
    folderId: string,
    fields: Record<string, unknown> | UpdateItem[],
    options?: { preserveVersion?: boolean },
  ): Promise<ImageHeader> {
    const f = Array.isArray(fields) ? fields : fieldsToUpdateItems(fields);
    return this.http.post("Image/Header/Create", { fields: f }, { folderId, preserveVersion: options?.preserveVersion });
  }

  async update(headerId: string, fields: Record<string, unknown> | UpdateItem[]): Promise<ImageHeader> {
    const f = Array.isArray(fields) ? fields : fieldsToUpdateItems(fields);
    return this.http.post(`Image/Header/${headerId}/Update`, { fields: f });
  }

  async imageVersionUpload(headerId: string, file: FileInput): Promise<string | null> {
    return this.http.uploadFile(`Image/Header/${headerId}/Image/Upload`, file);
  }

  async imageProcessingStatus(imageId: string): Promise<unknown> {
    return this.http.get("Image/GetImageProcessingStatus", { imageId });
  }
}
