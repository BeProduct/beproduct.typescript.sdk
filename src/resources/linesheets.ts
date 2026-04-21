import type { HttpClient } from "../http.js";

export class LineSheetResource {
  constructor(private readonly http: HttpClient) {}

  async listFolders(): Promise<{ id: string; name: string }[]> {
    return this.http.get("LineSheet/ListLineSheetFolders");
  }

  async list(folderId?: string): Promise<unknown> {
    return this.http.get("LineSheet/ListLineSheets", { folderId });
  }

  async get(id: string): Promise<unknown> {
    return this.http.get(`LineSheet/get/${id}`);
  }
}
