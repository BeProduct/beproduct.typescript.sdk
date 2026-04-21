import type { HttpClient } from "../http.js";
import { paginate, type PageResult } from "../pagination.js";
import type { SchemaField } from "../schemas/common.js";
import type { DataTableResult, DataTableRowResult } from "../schemas/data-tables.js";
import type { SearchFilter } from "./base.js";

export class DataTableResource {
  constructor(private readonly http: HttpClient) {}

  list(options?: { filters?: SearchFilter[]; pageSize?: number }): AsyncGenerator<DataTableResult> {
    const { filters = [], pageSize = 30 } = options ?? {};
    return paginate(pageSize, (pSize, pNum) =>
      this.http.post<PageResult<DataTableResult>>("DataTable/List", { filters }, {
        pageSize: pSize, pageNumber: pNum,
      }),
    );
  }

  async schema(dataTableId: string): Promise<SchemaField[]> {
    return this.http.get(`DataTable/${dataTableId}/Schema`);
  }

  data(dataTableId: string, options?: { filters?: SearchFilter[]; pageSize?: number }): AsyncGenerator<DataTableRowResult> {
    const { filters = [], pageSize = 30 } = options ?? {};
    return paginate(pageSize, (pSize, pNum) =>
      this.http.post<PageResult<DataTableRowResult>>(`DataTable/${dataTableId}/Data`, { filters }, {
        pageSize: pSize, pageNumber: pNum,
      }),
    );
  }

  async update(dataTableId: string, rows: unknown[]): Promise<{ updated: number; added: number; deleted: number }> {
    return this.http.post(`DataTable/${dataTableId}/Update`, rows);
  }

  async reset(dataTableId: string): Promise<unknown> {
    return this.http.post(`DataTable/${dataTableId}/Reset`, {});
  }
}
