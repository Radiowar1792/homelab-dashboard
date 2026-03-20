import { IntegrationClient } from "./base";
import type { DocmostPage } from "@/types";

export interface DocmostData {
  pages: DocmostPage[];
}

export class DocmostClient extends IntegrationClient<DocmostData> {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  async test(): Promise<boolean> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/health`, {}, 5000);
      return res.ok;
    } catch {
      return false;
    }
  }

  async getData(): Promise<DocmostData> {
    const pages = await this.getRecentPages();
    return { pages };
  }

  async getRecentPages(limit = 10): Promise<DocmostPage[]> {
    const res = await this.fetchWithTimeout(
      `${this.baseUrl}/api/pages?limit=${limit}`,
      { headers: { "Content-Type": "application/json" } }
    );
    if (!res.ok) throw new Error(`Docmost répond ${res.status}`);
    const data: unknown = await res.json();
    if (Array.isArray(data)) return data as DocmostPage[];
    const typed = data as { pages?: DocmostPage[] };
    return typed.pages ?? [];
  }
}

export function getDocmostClient(): DocmostClient | null {
  const url = process.env["DOCMOST_URL"];
  if (!url) return null;
  return new DocmostClient(url);
}
