/**
 * Classe de base pour tous les clients d'intégration.
 * Chaque intégration étend cette classe et implémente test() et getData().
 */
export abstract class IntegrationClient<T> {
  protected baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Supprimer le slash final
  }

  /** Teste la connexion à l'intégration — retourne true si OK */
  abstract test(): Promise<boolean>;

  /** Récupère les données principales de l'intégration */
  abstract getData(): Promise<T>;

  /** Helper pour les requêtes fetch avec timeout */
  protected async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs = 10000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
