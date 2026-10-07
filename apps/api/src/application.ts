import type { FastifyInstance } from "fastify";

export function registerRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({ ok: true as const }));
}