import type { HttpClient, FileInput } from "../http.js";
import { paginate, type PageResult } from "../pagination.js";

export class InboxResource {
  constructor(private readonly http: HttpClient) {}

  search(masterFolder: string, options?: { pageSize?: number; body?: unknown }): AsyncGenerator<unknown> {
    const { pageSize = 30, body = {} } = options ?? {};
    return paginate(pageSize, (pSize, pNum) =>
      this.http.post<PageResult<unknown>>(`Inbox/Tasks/${masterFolder}`, body, {
        pageSize: pSize, pageNumber: pNum,
      }),
    );
  }

  async get(taskId: string): Promise<unknown> {
    return this.http.get(`Inbox/Task/${taskId}`);
  }

  async create(body: unknown): Promise<unknown> {
    return this.http.post("Inbox/Task/Create", body);
  }

  async update(taskId: string, body: unknown): Promise<unknown> {
    return this.http.post(`Inbox/Task/${taskId}/Update`, body);
  }

  async deleteTask(taskId: string): Promise<unknown> {
    return this.http.delete(`Inbox/Task/${taskId}/Delete`);
  }

  async messageCreate(taskId: string, body: unknown): Promise<unknown> {
    return this.http.post(`Inbox/Task/${taskId}/Message/Create`, body);
  }

  messages(taskId: string, options?: { pageSize?: number }): AsyncGenerator<unknown> {
    const pageSize = options?.pageSize ?? 30;
    return paginate(pageSize, (pSize, pNum) =>
      this.http.post<PageResult<unknown>>(`Inbox/Task/${taskId}/Messages`, {}, {
        pageSize: pSize, pageNumber: pNum,
      }),
    );
  }

  async messageUpdate(messageId: string, body: unknown): Promise<unknown> {
    return this.http.post(`Inbox/Task/Message/${messageId}/Update`, body);
  }

  async messageDelete(messageId: string): Promise<unknown> {
    return this.http.delete(`Inbox/Task/Message/${messageId}/Delete`);
  }

  async messageAttachmentsUpload(messageId: string, file: FileInput): Promise<unknown> {
    return this.http.uploadFile(`Inbox/Task/Message/${messageId}/AttachmentsUpload`, file);
  }
}
