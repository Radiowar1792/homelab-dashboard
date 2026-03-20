import { IntegrationClient } from "./base";
import type { OllamaModel, OllamaChatMessage } from "@/types";

export interface OllamaData {
  models: OllamaModel[];
}

export class OllamaClient extends IntegrationClient<OllamaData> {
  constructor(baseUrl = "http://localhost:11434") {
    super(baseUrl);
  }

  async test(): Promise<boolean> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/tags`, {}, 5000);
      return res.ok;
    } catch {
      return false;
    }
  }

  async getData(): Promise<OllamaData> {
    const models = await this.listModels();
    return { models };
  }

  async listModels(): Promise<OllamaModel[]> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/api/tags`);
    if (!res.ok) throw new Error(`Ollama répond ${res.status}`);
    const data = (await res.json()) as { models: OllamaModel[] };
    return data.models ?? [];
  }

  async chat(
    model: string,
    messages: OllamaChatMessage[],
    stream = false
  ): Promise<Response> {
    return this.fetchWithTimeout(
      `${this.baseUrl}/api/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream }),
      },
      120000 // 2 min pour les longues réponses
    );
  }
}

export function getOllamaClient(): OllamaClient {
  const url = process.env["OLLAMA_URL"] ?? "http://localhost:11434";
  return new OllamaClient(url);
}
