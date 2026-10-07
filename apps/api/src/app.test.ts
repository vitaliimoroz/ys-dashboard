import { afterAll, describe, expect, it } from "vitest";
import { buildApp } from "./application.js";

describe("Fastify app", () => {
  it("exports a Fastify server and serves the health route", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
    await app.close();
  });
});