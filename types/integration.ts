// Types communs aux intégrations externes

export interface IntegrationConfig {
  id: string;
  name: string;
  baseUrl: string;
  token?: string;
  apiKey?: string;
  isEnabled: boolean;
}

// Home Assistant
export interface HAState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

// Vikunja
export interface VikunjaTask {
  id: number;
  title: string;
  description?: string;
  done: boolean;
  due_date?: string;
  priority: number;
  project_id: number;
}

export interface VikunjaProject {
  id: number;
  title: string;
  description?: string;
}

// N8N
export interface N8NWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface N8NExecution {
  id: string;
  workflowId: string;
  status: "success" | "error" | "running" | "waiting";
  startedAt: string;
  finishedAt?: string;
}

// Docmost
export interface DocmostPage {
  id: string;
  title: string;
  updatedAt: string;
  spaceId: string;
}

// Actual Budget
export interface ActualAccount {
  id: string;
  name: string;
  balance: number;
  type: string;
}

// Ollama
export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
}

export interface OllamaChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
}
