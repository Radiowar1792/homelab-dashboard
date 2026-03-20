import { IntegrationClient } from "./base";
import type { VikunjaTask, VikunjaProject } from "@/types";

export interface VikunjaData {
  tasks: VikunjaTask[];
  projects: VikunjaProject[];
}

export class VikunjaClient extends IntegrationClient<VikunjaData> {
  private token: string;

  constructor(baseUrl: string, token: string) {
    super(baseUrl);
    this.token = token;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  async test(): Promise<boolean> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/user`, {
        headers: this.headers,
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getData(): Promise<VikunjaData> {
    const [tasks, projects] = await Promise.all([this.getTasks(), this.getProjects()]);
    return { tasks, projects };
  }

  async getTasks(filters?: { projectId?: number; done?: boolean }): Promise<VikunjaTask[]> {
    const params = new URLSearchParams();
    if (filters?.projectId) params.set("project_id", String(filters.projectId));
    const url = `${this.baseUrl}/api/v1/tasks/all?${params.toString()}`;
    const res = await this.fetchWithTimeout(url, { headers: this.headers });
    if (!res.ok) throw new Error(`Vikunja répond ${res.status}`);
    const data: unknown = await res.json();
    const tasks = Array.isArray(data) ? (data as VikunjaTask[]) : [];
    if (filters?.done !== undefined) return tasks.filter((t) => t.done === filters.done);
    return tasks;
  }

  async getProjects(): Promise<VikunjaProject[]> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/projects`, {
      headers: this.headers,
    });
    if (!res.ok) throw new Error(`Vikunja répond ${res.status}`);
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as VikunjaProject[]) : [];
  }
}

export function getVikunjaClient(): VikunjaClient | null {
  const url = process.env["VIKUNJA_URL"];
  const token = process.env["VIKUNJA_TOKEN"];
  if (!url || !token) return null;
  return new VikunjaClient(url, token);
}
