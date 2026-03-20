import { IntegrationClient } from "./base";
import type { HAState } from "@/types";

export interface HAServiceCall {
  domain: string;
  service: string;
  serviceData?: Record<string, unknown>;
}

export class HomeAssistantClient extends IntegrationClient<HAState[]> {
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
      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/`, {
        headers: this.headers,
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getData(): Promise<HAState[]> {
    return this.getStates();
  }

  async getStates(entityId?: string): Promise<HAState[]> {
    const url = entityId
      ? `${this.baseUrl}/api/states/${entityId}`
      : `${this.baseUrl}/api/states`;
    const res = await this.fetchWithTimeout(url, { headers: this.headers });
    if (!res.ok) throw new Error(`Home Assistant répond ${res.status}`);
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as HAState[]) : [data as HAState];
  }

  async getState(entityId: string): Promise<HAState> {
    const res = await this.fetchWithTimeout(
      `${this.baseUrl}/api/states/${entityId}`,
      { headers: this.headers }
    );
    if (!res.ok) throw new Error(`Entité ${entityId} introuvable`);
    return res.json() as Promise<HAState>;
  }

  async callService({ domain, service, serviceData = {} }: HAServiceCall): Promise<void> {
    const res = await this.fetchWithTimeout(
      `${this.baseUrl}/api/services/${domain}/${service}`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(serviceData),
      }
    );
    if (!res.ok) throw new Error(`Erreur appel service ${domain}.${service}`);
  }
}

/** Singleton depuis les variables d'environnement */
export function getHomeAssistantClient(): HomeAssistantClient | null {
  const url = process.env["HOME_ASSISTANT_URL"];
  const token = process.env["HOME_ASSISTANT_TOKEN"];
  if (!url || !token) return null;
  return new HomeAssistantClient(url, token);
}
