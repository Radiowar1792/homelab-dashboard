/**
 * GET /api/metrics/stream — Server-Sent Events pour les métriques temps réel
 *
 * Phase 1 : SSE basique (CPU, RAM via des endpoints système)
 * Phase 2 : sera remplacé par WebSocket (server.ts)
 */
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Envoi d'un événement de connexion confirmée
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`
        )
      );

      // Envoi périodique de métriques (placeholder)
      const interval = setInterval(() => {
        try {
          const metrics = {
            type: "metrics",
            timestamp: new Date().toISOString(),
            // TODO: Récupérer vraies métriques depuis le serveur (Phase 2)
            cpu: Math.random() * 100,
            memory: Math.random() * 100,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(metrics)}\n\n`));
        } catch {
          clearInterval(interval);
        }
      }, 5000);

      // Nettoyage à la déconnexion du client
      return () => {
        clearInterval(interval);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
