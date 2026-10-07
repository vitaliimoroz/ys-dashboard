import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerRoutes } from "./application.js";
import type { DatasetSummary } from "@ys-dashboard/shared";
import type {
  DashboardStore,
  DatasetRow,
  NewWidgetRow,
  WidgetPatch,
  WidgetRow,
} from "./db/store.js";

const datasetId = "c2d53bd7-2b28-46d1-8bf5-8a294367eea2";

function createTestStore(): DashboardStore {
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
    async listDatasetSummaries(): Promise<DatasetSummary[]> {
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
    async getFirstDataset() {
      return datasets[0] ?? null;
    },
    async getDataset(id) {
      return datasets.find((item) => item.id === id) ?? null;
    },
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
  };
}

describe("Fastify app", () => {
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
    registerRoutes(app, { store: createTestStore() });

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
    registerRoutes(app, { store: createTestStore() });

    const response = await app.inject({
      method: "POST",
      url: "/api/widgets",
      payload: { type: "unknown" },
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it("creates a chart widget from the first dataset", async () => {
    const app = Fastify();
    registerRoutes(app, { store: createTestStore() });

    const response = await app.inject({
      method: "POST",
      url: "/api/widgets",
      payload: { type: "pie" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      type: "pie",
      title: "Pie chart",
      datasetId,
      chartConfig: { categoryKey: "Campaign", valueKey: "Result" },
      payload: {
        kind: "chart",
        xKey: "Campaign",
        points: [
          { Campaign: "A", Result: 10 },
          { Campaign: "B", Result: 20 },
        ],
      },
    });
    await app.close();
  });

  it("creates and deletes a text widget", async () => {
    const app = Fastify();
    registerRoutes(app, { store: createTestStore() });

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