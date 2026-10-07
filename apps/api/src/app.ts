import Fastify from "fastify";

export async function buildApp() {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ ok: true as const }));

  return app;
}
