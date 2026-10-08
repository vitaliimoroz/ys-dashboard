import Fastify from "fastify";
import cors from "@fastify/cors";
import { describe, expect, it } from "vitest";
import { createCorsOptions } from "./cors.js";
import { registerRoutes } from "./application.js";
import type { ApiRepositories } from "./modules/repository-provider.js";
import type {
  DatasetRow,
  NewDatasetRow,
} from "./modules/datasets/datasets.repository.js";
import type {
  NewWidgetRow,
  WidgetPatch,
  WidgetRow,
} from "./modules/widgets/widgets.repository.js";

const datasetId = "c2d53bd7-2b28-46d1-8bf5-8a294367eea2";

function createTestRepositories(): ApiRepositories {
  const dataset: DatasetRow = {
    id: datasetId,
    name: "Campaigns",
    sourceFilename: "campaigns.csv",
    sheetName: null,
    sourceKind: "csv",
    columns: ["Campaign", "Result"],
    rowCount: 2,
    rows: [
      { Campaign: "A", Result: 10 },
      { Campaign: "B", Result: 20 },
    ],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };
  const datasets = [dataset];
  const widgets: WidgetRow[] = [];

  return {
    datasets: {
      async listDatasetSummaries() {
        return datasets.map(({ id, name, sourceFilename, sheetName, sourceKind, columns, rowCount }) => ({
          id,
          name,
          sourceFilename,
          sheetName,
          sourceKind,
          columns,
          rowCount,
        }));
      },
      async createDataset(input: NewDatasetRow) {
        const created: DatasetRow = {
          id: "00000000-0000-4000-8000-000000000099",
          name: input.name,
          sourceFilename: input.sourceFilename,
          sheetName: input.sheetName ?? null,
          sourceKind: input.sourceKind,
          columns: input.columns,
          rowCount: input.rowCount,
          rows: input.rows,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
        };
        datasets.push(created);
        return created;
      },
      async getDataset(id) {
        return datasets.find((item) => item.id === id) ?? null;
      },
      async upsertBySource(input: NewDatasetRow) {
        const existing = datasets.find(
          (item) =>
            item.sourceFilename === input.sourceFilename &&
            item.sheetName === (input.sheetName ?? null),
        );
        if (existing) {
          Object.assign(existing, {
            name: input.name,
            sourceKind: input.sourceKind,
            columns: input.columns,
            rowCount: input.rowCount,
            rows: input.rows,
          });
          return "updated" as const;
        }
        datasets.push({
          id: "00000000-0000-4000-8000-000000000098",
          name: input.name,
          sourceFilename: input.sourceFilename,
          sheetName: input.sheetName ?? null,
          sourceKind: input.sourceKind,
          columns: input.columns,
          rowCount: input.rowCount,
          rows: input.rows,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
        });
        return "inserted" as const;
      },
    },
    widgets: {
      async listWidgets() {
        return [...widgets].sort((left, right) => left.position - right.position);
      },
      async getWidget(id) {
        return widgets.find((item) => item.id === id) ?? null;
      },
      async createWidget(input: NewWidgetRow) {
        const widget: WidgetRow = {
          id: `00000000-0000-4000-8000-${String(widgets.length + 1).padStart(12, "0")}`,
          type: input.type,
          title: input.title,
          position: input.position,
          datasetId: input.datasetId ?? null,
          chartConfig: input.chartConfig ?? null,
          content: input.content ?? null,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
        };
        widgets.push(widget);
        return widget;
      },
      async updateWidget(id: string, patch: WidgetPatch) {
        const widget = widgets.find((item) => item.id === id);
        if (!widget) return null;
        Object.assign(widget, patch);
        return widget;
      },
      async deleteWidget(id: string) {
        const index = widgets.findIndex((item) => item.id === id);
        if (index < 0) return false;
        widgets.splice(index, 1);
        return true;
      },
    },
  };
}

describe("Fastify app", () => {
  it.each(["PATCH", "DELETE"])("allows browser preflight for %s widget requests", async (method) => {
    const app = Fastify();
    await app.register(cors, createCorsOptions(["https://dashboard.example"]));
    registerRoutes(app, { repositories: createTestRepositories() });

    const response = await app.inject({
      method: "OPTIONS",
      url: "/api/widgets/00000000-0000-4000-8000-000000000001",
      headers: {
        origin: "https://dashboard.example",
        "access-control-request-method": method,
        "access-control-request-headers": "content-type",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe("https://dashboard.example");
    expect(response.headers["access-control-allow-methods"]).toContain(method);
    await app.close();
  });

  it("registers a health route that returns ok", async () => {
    const app = Fastify();
    registerRoutes(app);
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
    await app.close();
  });

  it("lists dataset summaries without exposing imported rows", async () => {
    const app = Fastify();
    registerRoutes(app, { repositories: createTestRepositories() });

    const response = await app.inject({ method: "GET", url: "/api/datasets" });

    expect(response.statusCode).toBe(200);
    expect(response.json()[0]).toMatchObject({
      id: datasetId,
      name: "Campaigns",
      rowCount: 2,
      columns: ["Campaign", "Result"],
    });
    expect(response.json()[0]).not.toHaveProperty("rows");
    await app.close();
  });

  it("returns 400 for an invalid widget POST", async () => {
    const app = Fastify();
    registerRoutes(app, { repositories: createTestRepositories() });

    const response = await app.inject({
      method: "POST",
      url: "/api/widgets",
      payload: { type: "unknown" },
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it("creates a chart widget with randomized generated data", async () => {
    const app = Fastify();
    registerRoutes(app, { repositories: createTestRepositories() });

    const response = await app.inject({
      method: "POST",
      url: "/api/widgets",
      payload: { type: "pie" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      type: "pie",
      title: "Pie chart",
      datasetId: "00000000-0000-4000-8000-000000000099",
      chartConfig: { categoryKey: "Category", valueKey: "Value" },
      payload: {
        kind: "chart",
        xKey: "Category",
      },
    });
    expect(response.json().payload.points).toHaveLength(6);
    expect(response.json().payload.points[0]).toHaveProperty("Value");
    expect(response.json().payload.points[0]).not.toHaveProperty("Campaign");
    await app.close();
  });

  it.each([
    ["line", ["Month", "Series", "Value"], 18],
    ["stacked_bar", ["Brand", "Positive", "Neutral", "Negative"], 6],
    ["bar", ["Category", "Value"], 6],
  ] as const)("creates %s charts from generated data", async (type, expectedColumns, expectedRows) => {
    const app = Fastify();
    registerRoutes(app, { repositories: createTestRepositories() });

    const response = await app.inject({
      method: "POST",
      url: "/api/widgets",
      payload: { type },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().datasetId).not.toBe(datasetId);
    expect(response.json().payload.kind).toBe("chart");
    expect(response.json().payload.points).toHaveLength(expectedRows);
    const firstPoint = response.json().payload.points[0] as Record<string, string | number>;
    expect(Object.keys(firstPoint)).toEqual(expectedColumns);
    for (const value of Object.values(firstPoint)) {
      if (typeof value === "number") expect(value).toBeGreaterThanOrEqual(15);
      if (typeof value === "number") expect(value).toBeLessThanOrEqual(100);
    }
    await app.close();
  });

  it("creates and deletes a text widget", async () => {
    const app = Fastify();
    registerRoutes(app, { repositories: createTestRepositories() });

    const created = await app.inject({
      method: "POST",
      url: "/api/widgets",
      payload: { type: "text", title: "Notes" },
    });
    const deleted = await app.inject({
      method: "DELETE",
      url: `/api/widgets/${created.json().id}`,
    });

    expect(created.statusCode).toBe(201);
    expect(created.json().payload).toEqual({ kind: "text", content: "" });
    expect(deleted.statusCode).toBe(204);
    await app.close();
  });
});