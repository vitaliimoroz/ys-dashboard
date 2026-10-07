import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerRoutes } from "./application.js";

describe("Fastify app", () => {
  it("registers a health route that returns ok", async () => {
    const app = Fastify();
    registerRoutes(app);
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
    await app.close();
  });
});