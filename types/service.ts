// Statut possible d'un service
export type ServiceStatus = "online" | "offline" | "degraded" | "unknown";

// Définition d'un service à monitorer
export interface ServiceDefinition {
  id: string;
  name: string;
  url: string;
  icon?: string;
  category?: string;
  expectedStatus?: number; // Code HTTP attendu (défaut: 200)
  timeout?: number; // Timeout en ms (défaut: 5000)
}

// Résultat d'un check de service
export interface ServiceCheckResult {
  id: string;
  name: string;
  url: string;
  status: ServiceStatus;
  responseTime?: number; // En ms
  statusCode?: number;
  lastChecked: Date;
  error?: string;
}
