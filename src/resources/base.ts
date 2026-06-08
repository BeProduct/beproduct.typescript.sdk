import type { HttpClient, FileInput } from "../http.js";
import { paginate } from "../pagination.js";
import type { PageResult } from "../pagination.js";
import {
  fieldsToUpdateItems,
  type AppPage,
  type FolderItem,
  type FormItem,
  type GridUpdateItem,
  type ListUpdateItem,
  type SchemaField,
  type UpdateItem,
} from "../schemas/common.js";
import type { Tag } from "../schemas/tags.js";
import type { SharedPartner } from "../schemas/share.js";
import { parseAppData, type AppResult, type TypedAppType, type TypedAppResult } from "../schemas/apps.js";

export interface SearchFilter {
  field: string;
  operator: string;
  value: unknown;
  type?: string;
}

export interface ListOptions {
  folderId?: string;
  filters?: SearchFilter[];
  colorwayFilters?: SearchFilter[];
  pageSize?: number;
  showDeleted?: boolean;
}

/**
 * Base resource with shared operations for all entity types.
 * Mirrors the Python SDK's mixin pattern (Attributes, Apps, Upload, Comments, Revisions, Tags, Share).
 */
export abstract class EntityResource {
  protected abstract entityType: string;

  constructor(protected readonly http: HttpClient) {}

  // ── AttributesMixin ─────────────────────────────

  async folders(): Promise<FolderItem[]> {
    return this.http.get(`${this.entityType}/Folders`);
  }

  async folderSchema(folderId: string): Promise<SchemaField[]> {
    return this.http.get(`${this.entityType}/FolderSchema`, { folderId });
  }

  async folderSearchSchema(folderId: string): Promise<SchemaField[]> {
    return this.http.get(`${this.entityType}/FolderSearchSchema`, { folderId });
  }

  list(options: ListOptions = {}): AsyncGenerator<Record<string, unknown>> {
    const { folderId = "", filters = [], colorwayFilters, pageSize = 30, showDeleted = false } = options;
    return paginate(pageSize, (pSize, pNum) =>
      this.http.post<PageResult<Record<string, unknown>>>(
        `${this.entityType}/Headers`,
        { filters, colorwayFilters },
        { folderId, pageSize: pSize, pageNumber: pNum, showDeleted },
      ),
    );
  }

  async get(headerId: string): Promise<Record<string, unknown>> {
    return this.http.get(`${this.entityType}/Header/${headerId}`);
  }

  /**
   * Look up a header by its human-facing header **number** (e.g. "T-101")
   * rather than its GUID. Resolves to the first match, or `null` if none.
   *
   * Convenience wrapper over {@link list} with a `header_number` Eq filter.
   * Pass `folderId` to scope the search to a single folder.
   *
   * @example
   *   const style = await client.style.getByNumber("T-101");
   *   if (style) console.log(style.id);
   */
  async getByNumber(
    headerNumber: string,
    options: { folderId?: string } = {},
  ): Promise<Record<string, unknown> | null> {
    for await (const header of this.list({
      folderId: options.folderId,
      filters: [{ field: "header_number", operator: "Eq", value: headerNumber }],
      pageSize: 1,
    })) {
      return header;
    }
    return null;
  }

  async deleteHeader(headerId: string): Promise<unknown> {
    // Python SDK uses GET for delete (API quirk)
    return this.http.get(`${this.entityType}/Header/Delete/${headerId}`);
  }

  // ── AppsMixin ───────────────────────────────────

  async appList(headerId: string): Promise<AppPage[]> {
    return this.http.get(`${this.entityType}/Pages`, { headerId });
  }

  async appGet(headerId: string, appId: string): Promise<AppResult> {
    return this.http.get(`${this.entityType}/Page`, { headerId, pageId: appId });
  }

  /**
   * Get app page data with typed `data` property based on app type.
   *
   * @example
   *   const page = await client.style.appGetTyped(headerId, appId, "Grid");
   *   page.data.gridData[0].fields  // ← fully typed
   *
   * @example
   *   const page = await client.style.appGetTyped(headerId, appId, "BOM");
   *   page.data.data?.[0].rowId  // ← fully typed BomRow
   *
   * @example
   *   const page = await client.style.appGetTyped(headerId, appId, "Form");
   *   page.data[0].id  // ← FormItem.id
   */
  async appGetTyped<T extends TypedAppType>(
    headerId: string,
    appId: string,
    appType: T,
  ): Promise<TypedAppResult<T>> {
    const raw = await this.appGet(headerId, appId);
    const data = parseAppData(appType, raw.data);
    return { ...raw, data } as TypedAppResult<T>;
  }

  async appGetByName(headerId: string, appName: string): Promise<AppResult> {
    const apps = await this.appList(headerId);
    const app = apps.find((a) => a.title === appName);
    if (!app) throw new Error(`App "${appName}" not found`);
    return this.appGet(headerId, app.id);
  }

  /**
   * Get app by name with typed data. Looks up the app from the page list then fetches typed.
   *
   * @example
   *   const page = await client.style.appGetByNameTyped(headerId, "Bill of Material", "BOM");
   *   page.data.data?.[0].group  // ← string
   */
  async appGetByNameTyped<T extends TypedAppType>(
    headerId: string,
    appName: string,
    appType: T,
  ): Promise<TypedAppResult<T>> {
    const apps = await this.appList(headerId);
    const app = apps.find((a) => a.title === appName);
    if (!app) throw new Error(`App "${appName}" not found`);
    return this.appGetTyped(headerId, app.id, appType);
  }

  async appSchema(appId: string): Promise<unknown> {
    return this.http.get(`${this.entityType}/PageSchema`, { pageId: appId });
  }

  async appFormUpdate(
    headerId: string,
    appId: string,
    fields: Record<string, unknown> | UpdateItem[],
  ): Promise<unknown> {
    const body = Array.isArray(fields) ? fields : fieldsToUpdateItems(fields);
    return this.http.post(`${this.entityType}/PageForm`, body, {
      headerId,
      pageId: appId,
    });
  }

  async appGridUpdate(
    headerId: string,
    appId: string,
    rows: GridUpdateItem[],
  ): Promise<unknown> {
    return this.http.post(`${this.entityType}/PageGrid`, rows, {
      headerId,
      pageId: appId,
    });
  }

  async appListUpdate(
    headerId: string,
    appId: string,
    items: ListUpdateItem[],
  ): Promise<unknown> {
    return this.http.post(`${this.entityType}/PageList`, items, {
      headerId,
      pageId: appId,
    });
  }

  /**
   * Update the image-list part of an **ImagesGrid** app. ImagesGrid has two
   * parts: a grid (rows → {@link appGridUpdate}) and an image list (entries →
   * this method). Same `ListUpdateItem` shape as {@link appListUpdate}, but a
   * distinct endpoint (`PageImagesGrid/List`).
   */
  async appImagesGridListUpdate(
    headerId: string,
    appId: string,
    items: ListUpdateItem[],
  ): Promise<unknown> {
    return this.http.post(`${this.entityType}/PageImagesGrid/List`, items, {
      headerId,
      pageId: appId,
    });
  }

  async appAttachmentsDelete(
    headerId: string,
    appId: string,
    filenames: string[],
  ): Promise<unknown> {
    return this.http.post(`${this.entityType}/AttachmentRemove`, filenames, {
      headerId,
      pageId: appId,
    });
  }

  async appReset(headerId: string, appId: string): Promise<unknown> {
    return this.http.post(`${this.entityType}/${headerId}/Page/${appId}/Reset`, {});
  }

  // ── UploadMixin ─────────────────────────────────

  async upload(
    headerId: string,
    file: FileInput,
    position?: string,
  ): Promise<string | null> {
    const path = position
      ? `${this.entityType}/Header/${headerId}/Image/Upload/Position/${position}`
      : `${this.entityType}/Header/${headerId}/Image/Upload`;
    return this.http.uploadFile(path, file);
  }

  async appListUpload(
    headerId: string,
    appId: string,
    listItemId: string,
    file: FileInput,
  ): Promise<string | null> {
    const key = this.entityType.toLowerCase();
    return this.http.uploadFile(`${this.entityType}/ListAppImageUpload`, file, {
      [`${key}Id`]: headerId,
      pageId: appId,
      listItemId,
    });
  }

  async appAttachmentsUpload(
    headerId: string,
    appId: string,
    file: FileInput,
  ): Promise<unknown> {
    return this.http.uploadFile(`${this.entityType}/AttachmentUpload`, file, {
      headerId,
      pageId: appId,
    });
  }

  async appImageFormUpload(
    headerId: string,
    appId: string,
    file: FileInput,
  ): Promise<string | null> {
    const key = this.entityType.toLowerCase();
    return this.http.uploadFile(
      `${this.entityType}/GridFormImageAppImageUpload`,
      file,
      { [`${key}Id`]: headerId, pageId: appId },
    );
  }

  /**
   * Upload an image into an **ImagesGrid** app. The underlying endpoint is
   * shared with {@link appImageFormUpload} (ImagesForm) — this is a named
   * alias so call sites read against the app type they're targeting.
   */
  async appImageGridUpload(
    headerId: string,
    appId: string,
    file: FileInput,
  ): Promise<string | null> {
    return this.appImageFormUpload(headerId, appId, file);
  }

  /**
   * Upload an image onto a specific **ImagesGrid** image-list item (created via
   * {@link appImagesGridListUpdate}). Distinct endpoint from the general
   * ImagesGrid/ImagesForm image upload — it targets a `listItemId`.
   */
  async appImagesGridItemUpload(
    headerId: string,
    appId: string,
    listItemId: string,
    file: FileInput,
  ): Promise<string | null> {
    const key = this.entityType.toLowerCase();
    return this.http.uploadFile(`${this.entityType}/ImagesGridAppImageUpload`, file, {
      [`${key}Id`]: headerId,
      pageId: appId,
      listItemId,
    });
  }

  /** Upload an image onto a specific **TextList** image-list item. */
  async appTextListUpload(
    headerId: string,
    appId: string,
    listItemId: string,
    file: FileInput,
  ): Promise<string | null> {
    const key = this.entityType.toLowerCase();
    return this.http.uploadFile(`${this.entityType}/TextListAppImageUpload`, file, {
      [`${key}Id`]: headerId,
      pageId: appId,
      listItemId,
    });
  }

  async uploadStatus(
    uploadId: string,
  ): Promise<{ finished: boolean; errorOccurred: boolean; message: string }> {
    return this.http.uploadStatus(uploadId);
  }

  // ── CommentsMixin ───────────────────────────────

  async commentList(headerId: string): Promise<unknown[]> {
    return this.http.get(`Comment/Heeader/${headerId}`); // API typo preserved
  }

  async commentAdd(headerId: string, comment: string): Promise<unknown> {
    return this.http.post(`Comment/Header/${headerId}/Create`, { body: comment });
  }

  async commentEdit(headerId: string, commentId: string, comment: string): Promise<unknown> {
    return this.http.post(`Comment/Header/${headerId}/Edit`, { body: comment }, { commentId });
  }

  async commentDelete(headerId: string, commentId: string): Promise<unknown> {
    return this.http.delete(`Comment/Header/${headerId}/Delete`, { commentId });
  }

  async appCommentList(headerId: string, appId: string): Promise<unknown[]> {
    return this.http.get(`Comment/Page/${headerId}/${appId}`);
  }

  async appCommentAdd(headerId: string, appId: string, comment: string): Promise<unknown> {
    return this.http.post(`Comment/Page/${headerId}/${appId}/Create`, { body: comment });
  }

  async appCommentEdit(headerId: string, appId: string, commentId: string, comment: string): Promise<unknown> {
    return this.http.post(`Comment/Page/${headerId}/${appId}/Edit`, { body: comment }, { commentId });
  }

  async appCommentDelete(headerId: string, appId: string, commentId: string): Promise<unknown> {
    return this.http.delete(`Comment/Page/${headerId}/${appId}/Delete`, { commentId });
  }

  // ── RevisionsMixin ──────────────────────────────

  async revisionList(headerId: string): Promise<unknown[]> {
    return this.http.get(`Revision/Heeader/${headerId}`); // API typo preserved
  }

  async revisionAdd(headerId: string, revision: string): Promise<unknown> {
    return this.http.post(`Revision/Header/${headerId}/Create`, { body: revision });
  }

  async revisionEdit(headerId: string, revisionId: string, revision: string): Promise<unknown> {
    return this.http.post(`Revision/Header/${headerId}/Edit`, { body: revision }, { revisionId });
  }

  async revisionDelete(headerId: string, revisionId: string): Promise<unknown> {
    return this.http.delete(`Revision/Header/${headerId}/Delete`, { revisionId });
  }

  async appRevisionList(headerId: string, appId: string): Promise<unknown[]> {
    return this.http.get(`Revision/Page/${headerId}/${appId}`);
  }

  async appRevisionAdd(headerId: string, appId: string, revision: string): Promise<unknown> {
    return this.http.post(`Revision/Page/${headerId}/${appId}/Create`, { body: revision });
  }

  async appRevisionEdit(headerId: string, appId: string, revisionId: string, revision: string): Promise<unknown> {
    return this.http.post(`Revision/Page/${headerId}/${appId}/Edit`, { body: revision }, { revisionId });
  }

  async appRevisionDelete(headerId: string, appId: string, revisionId: string): Promise<unknown> {
    return this.http.delete(`Revision/Page/${headerId}/${appId}/Delete`, { revisionId });
  }

  // ── TagsMixin ───────────────────────────────────

  async tagList(): Promise<Tag[]> {
    return this.http.get(`Tag/${this.entityType}/List`);
  }

  async tagCreate(name: string, options?: { integration?: string; shareWith?: string[] }): Promise<unknown> {
    return this.http.post(`Tag/${this.entityType}/Create`, {
      name,
      integration: options?.integration,
      shareWith: options?.shareWith,
    });
  }

  async tagUpdate(tagId: string, name: string, integration?: string): Promise<unknown> {
    return this.http.post(`Tag/${tagId}/Update`, { name, integration });
  }

  async tagDelete(tagId: string): Promise<unknown> {
    return this.http.delete(`Tag/${tagId}/Delete`);
  }

  async tagShare(tagId: string, userIds: string[]): Promise<unknown> {
    return this.http.post(`Tag/${tagId}/Share`, userIds);
  }

  async tagUnshare(tagId: string, userIds: string[]): Promise<unknown> {
    return this.http.post(`Tag/${tagId}/Unshare`, userIds);
  }

  async headerTagList(headerId: string): Promise<Tag[]> {
    return this.http.get(`Tag/Header/${headerId}`);
  }

  async headerTagAdd(headerId: string, tagNames: string[]): Promise<unknown> {
    return this.http.post(`Tag/Header/${headerId}/Add`, tagNames);
  }

  async headerTagRemove(headerId: string, tagNames: string[]): Promise<unknown> {
    return this.http.post(`Tag/Header/${headerId}/Remove`, tagNames);
  }

  // ── ShareMixin ──────────────────────────────────

  async share(headerId: string, partnerIds: string[]): Promise<unknown> {
    return this.http.post(`Share/Header/${headerId}/Share`, partnerIds);
  }

  async unshare(headerId: string, partnerIds: string[]): Promise<unknown> {
    return this.http.post(`Share/Header/${headerId}/Unshare`, partnerIds);
  }

  async sharedWith(headerId: string): Promise<SharedPartner[]> {
    return this.http.get(`Share/Header/${headerId}/Get`);
  }

  async appShare(headerId: string, appId: string, partnerIds: string[]): Promise<unknown> {
    return this.http.post(`Share/Page/${headerId}/${appId}/Share`, partnerIds);
  }

  async appUnshare(headerId: string, appId: string, partnerIds: string[]): Promise<unknown> {
    return this.http.post(`Share/Page/${headerId}/${appId}/Unshare`, partnerIds);
  }

  async appSharedWith(headerId: string, appId: string): Promise<SharedPartner[]> {
    return this.http.get(`Share/Page/${headerId}/${appId}/Get`);
  }
}
