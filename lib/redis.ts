import Redis from "ioredis";

// Singleton Redis pour partager la connexion
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const redisUrl = process.env["REDIS_URL"] ?? "redis://localhost:6379";

  const client = new Redis(redisUrl, {
    // Reconnexion automatique avec backoff exponentiel
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    // Timeout de connexion
    connectTimeout: 10000,
    // Désactiver les logs verbeux en production
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
  });

  client.on("error", (error) => {
    console.error("[Redis] Erreur de connexion:", error);
  });

  client.on("connect", () => {
    if (process.env["NODE_ENV"] === "development") {
      console.warn("[Redis] Connexion établie");
    }
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env["NODE_ENV"] !== "production") {
  globalForRedis.redis = redis;
}

// Helpers utilitaires pour le cache
export const cache = {
  /**
   * Récupère une valeur du cache, ou exécute la fonction et la stocke
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds = 60
  ): Promise<T> {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }

    const data = await fetcher();
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
    return data;
  },

  /**
   * Invalide une ou plusieurs clés de cache
   */
  async invalidate(...keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};
