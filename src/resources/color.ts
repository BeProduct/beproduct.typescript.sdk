import type { SchemaField, UpdateItem } from "../schemas/common.js";
import { fieldsToUpdateItems } from "../schemas/common.js";
import type { ColorHeader } from "../schemas/color.js";
import { EntityResource, type SearchFilter } from "./base.js";
import { paginate, type PageResult } from "../pagination.js";

export class ColorResource extends EntityResource {
  protected entityType = "Color";

  async colorChipSchema(folderId: string): Promise<SchemaField[]> {
    return this.http.get("Color/ColorChipSchema", { folderId });
  }

  async pageSchema(pageId: string): Promise<unknown> {
    return this.http.get("Color/PageSchema", { pageId });
  }

  override async get(headerId: string): Promise<ColorHeader> {
    return this.http.get(`Color/Header/${headerId}`);
  }

  async create(
    folderId: string,
    fields: Record<string, unknown> | UpdateItem[],
    options?: { colors?: unknown[]; preserveVersion?: boolean },
  ): Promise<ColorHeader> {
    const f = Array.isArray(fields) ? fields : fieldsToUpdateItems(fields);
    return this.http.post("Color/Header/Create", { fields: f, colors: options?.colors }, {
      folderId, preserveVersion: options?.preserveVersion,
    });
  }

  async update(
    headerId: string,
    fields?: Record<string, unknown> | UpdateItem[],
    options?: { colors?: unknown[]; replaceColors?: boolean },
  ): Promise<ColorHeader> {
    const f = fields ? (Array.isArray(fields) ? fields : fieldsToUpdateItems(fields)) : [];
    return this.http.post(`Color/Header/${headerId}/Update`, { fields: f, colors: options?.colors }, {
      replaceColors: options?.replaceColors ?? true,
    });
  }

  companyColors(options?: { filters?: SearchFilter[]; pageSize?: number }): AsyncGenerator<unknown> {
    const { filters = [], pageSize = 30 } = options ?? {};
    return paginate(pageSize, (pSize, pNum) =>
      this.http.post<PageResult<unknown>>("Color/CompanyColors", { filters }, { pageSize: pSize, pageNumber: pNum }),
    );
  }
}
