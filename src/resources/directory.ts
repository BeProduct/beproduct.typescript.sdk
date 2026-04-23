import type { HttpClient } from "../http.js";
import { paginateArray } from "../pagination.js";
import type { DirectoryCompany, Contact } from "../schemas/directory.js";
import type { SearchFilter } from "./base.js";

export class DirectoryResource {
  constructor(private readonly http: HttpClient) {}

  async list(options?: { pageSize?: number; pageNumber?: number }): Promise<DirectoryCompany[]> {
    // GET Directory/Companies returns a raw array, not a PageResult wrapper
    return this.http.get("Directory/Companies", {
      pageSize: options?.pageSize ?? 20,
      pageNumber: options?.pageNumber ?? 1,
    });
  }

  /**
   * Paginated search via POST Directory/Companies. Server returns a flat array per page,
   * so we stop when a page is empty (or shorter than `pageSize`).
   */
  search(options?: { filters?: SearchFilter[]; pageSize?: number }): AsyncGenerator<DirectoryCompany> {
    const { filters = [], pageSize = 20 } = options ?? {};
    return paginateArray(pageSize, (pSize, pNum) =>
      this.http.post<DirectoryCompany[]>("Directory/Companies", { filters }, {
        pageSize: pSize, pageNumber: pNum,
      }),
    );
  }

  async get(directoryId: string): Promise<DirectoryCompany> {
    return this.http.get("Directory/Company", { directoryId });
  }

  async add(fields: Record<string, unknown>): Promise<DirectoryCompany> {
    return this.http.post("Directory/Add", fields);
  }

  async update(id: string, fields: Record<string, unknown>): Promise<DirectoryCompany> {
    return this.http.post(`Directory/Update/${id}`, fields);
  }

  contactList(directoryId: string, options?: { pageSize?: number }): AsyncGenerator<Contact> {
    const pageSize = options?.pageSize ?? 20;
    return paginateArray(pageSize, (pSize, pNum) =>
      this.http.get<Contact[]>("Directory/Contacts", {
        directoryId, pageSize: pSize, pageNumber: pNum,
      }),
    );
  }

  async contactGet(contactId: string): Promise<Contact> {
    return this.http.get("Directory/Contact", { contactId });
  }

  async contactAdd(directoryId: string, fields: Record<string, unknown>): Promise<Contact> {
    return this.http.post(`Directory/${directoryId}/Contact/Add`, fields);
  }

  async contactUpdate(directoryId: string, contactId: string, fields: Record<string, unknown>): Promise<unknown> {
    return this.http.post(`Directory/${directoryId}/Contact/${contactId}/Update`, fields);
  }
}
