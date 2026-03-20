/**
 * server.ts — Serveur Node.js custom pour Phase 2
 *
 * Ce fichier est PRÉVU pour la Phase 2 du projet.
 * Il remplacera le serveur Next.js standard pour ajouter :
 *   - WebSocket server (ws ou socket.io) pour métriques temps réel
 *   - SSH Terminal (ssh2 + xterm.js)
 *   - Éventuellement d'autres fonctionnalités nécessitant un serveur custom
 *
 * PHASE 2 TODO :
 * ─────────────────────────────────────────────────
 * import { createServer } from "http";
 * import { parse } from "url";
 * import next from "next";
 * import { WebSocketServer } from "ws";
 * import { handleSSHConnection } from "./lib/ssh/handler";
 * import { broadcastMetrics } from "./lib/metrics/broadcaster";
 *
 * const dev = process.env.NODE_ENV !== "production";
 * const app = next({ dev });
 * const handle = app.getRequestHandler();
 *
 * app.prepare().then(() => {
 *   const server = createServer((req, res) => {
 *     const parsedUrl = parse(req.url!, true);
 *     handle(req, res, parsedUrl);
 *   });
 *
 *   // WebSocket server pour métriques
 *   const wss = new WebSocketServer({ server, path: "/ws/metrics" });
 *   wss.on("connection", broadcastMetrics);
 *
 *   // WebSocket server pour SSH terminal
 *   const sshWss = new WebSocketServer({ server, path: "/ws/ssh" });
 *   sshWss.on("connection", handleSSHConnection);
 *
 *   server.listen(3000, () => {
 *     console.log("> Ready on http://localhost:3000");
 *   });
 * });
 * ─────────────────────────────────────────────────
 */

export {};
