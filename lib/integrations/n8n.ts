import { IntegrationClient } from "./base";
import type { N8NWorkflow, N8NExecution } from "@/types";

export interface N8NData {
  workflows: N8NWorkflow[];
  executions: N8NExecution[];
}

export class N8NClient extends IntegrationClient<N8NData> {
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    super(baseUrl);
    this.apiKey = apiKey;
  }

  private get headers() {
    return {
      "X-N8N-API-KEY": this.apiKey,
      "Content-Type": "application/json",
    };
  }

  async test(): Promise<boolean> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/workflows?limit=1`, {
        headers: this.headers,
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getData(): Promise<N8NData> {
    const [workflows, executions] = await Promise.all([
      this.getWorkflows(),
      this.getExecutions(10),
    ]);
    return { workflows, executions };
  }

  async getWorkflows(): Promise<N8NWorkflow[]> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/workflows`, {
      headers: this.headers,
    });
    if (!res.ok) throw new Error(`N8N répond ${res.status}`);
    const data = (await res.json()) as { data: N8NWorkflow[] };
    return Array.isArray(data.data) ? data.data : [];
  }

  async getExecutions(limit = 20): Promise<N8NExecution[]> {
    const res = await this.fetchWithTimeout(
      `${this.baseUrl}/api/v1/executions?limit=${limit}`,
      { headers: this.headers }
    );
    if (!res.ok) throw new Error(`N8N répond ${res.status}`);
    const data = (await res.json()) as { data: N8NExecution[] };
    return Array.isArray(data.data) ? data.data : [];
  }

  async activateWorkflow(id: string, active: boolean): Promise<void> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/workflows/${id}`, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify({ active }),
    });
    if (!res.ok) throw new Error(`Impossible de modifier le workflow ${id}`);
  }
}

export function getN8NClient(): N8NClient | null {
  const url = process.env["N8N_URL"];
  const apiKey = process.env["N8N_API_KEY"];
  if (!url || !apiKey) return null;
  return new N8NClient(url, apiKey);
}
