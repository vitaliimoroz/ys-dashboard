import { afterAll, describe, expect, it } from "vitest";
import app from "./app.js";

describe("Fastify app", () => {
  afterAll(async () => {
    await app.close();
  });

  it("exports a Fastify server and serves the health route", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
  });
});