import type { HttpClient } from "../http.js";
import type { MasterDataResult, FolderFieldResult } from "../schemas/master-data.js";

export class MasterDataResource {
  constructor(private readonly http: HttpClient) {}

  async get(fieldId: string): Promise<MasterDataResult> {
    return this.http.get(`MasterData/${fieldId}`);
  }

  async create(data: Record<string, unknown>): Promise<unknown> {
    return this.http.post("MasterData/Create", data);
  }

  async update(fieldId: string, data: Record<string, unknown>): Promise<unknown> {
    return this.http.post(`MasterData/${fieldId}/Update`, data);
  }

  async folderFieldGet(folderId: string, fieldId: string): Promise<FolderFieldResult> {
    return this.http.get(`MasterData/Field/${folderId}/${fieldId}`);
  }

  async folderFieldUpdate(folderId: string, fieldId: string, data: Record<string, unknown>): Promise<unknown> {
    return this.http.post(`MasterData/Field/${folderId}/${fieldId}/Update`, data);
  }
}
