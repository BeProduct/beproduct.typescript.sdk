import type { HttpClient } from "../http.js";
import { paginate, type PageResult } from "../pagination.js";

export class ReportResource {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<{ result: unknown[]; total: number }> {
    return this.http.get("Report/List");
  }

  async data(body: unknown): Promise<unknown> {
    return this.http.post("Report/Data", body);
  }

  async dataById(reportId: string, body: unknown): Promise<unknown> {
    return this.http.post(`Report/Data/${reportId}`, body);
  }

  async flatBom(body: unknown): Promise<unknown> {
    return this.http.post("Report/FlatBom", body);
  }
}
