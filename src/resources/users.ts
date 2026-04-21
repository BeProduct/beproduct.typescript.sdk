import type { HttpClient } from "../http.js";
import type { UserModel, UserRole } from "../schemas/users.js";

export class UserResource {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<UserModel[]> {
    return this.http.get("Users/List");
  }

  async getByEmail(email: string): Promise<UserModel> {
    return this.http.get("Users/GetByEmail", { email });
  }

  async getById(id: string): Promise<UserModel> {
    return this.http.get(`Users/GetById/${id}`);
  }

  async create(fields: Record<string, unknown>): Promise<UserModel> {
    return this.http.post("Users/Create", fields);
  }

  async update(userId: string, fields: Record<string, unknown>): Promise<UserModel> {
    return this.http.post(`Users/${userId}/Update`, fields);
  }

  async roleList(): Promise<UserRole[]> {
    return this.http.get("Users/Roles");
  }

  async roleGet(userId: string): Promise<UserRole> {
    return this.http.get(`Users/${userId}/Role`);
  }
}
