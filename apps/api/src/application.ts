import type { FastifyInstance } from "fastify";
import {
  chartConfigSchema,
  createWidgetBodySchema,
  isChartWidgetType,
  patchWidgetBodySchema,
  widgetListItemSchema,
  type ChartConfig,
  type ChartWidgetType,
  type WidgetDetail,
} from "@ys-dashboard/shared";
import { inferChartConfig, type ParsedRow } from "./imports/parser.js";
import { createDashboardStore, type DashboardStore, type WidgetRow } from "./db/store.js";

interface RouteOptions {
  store?: DashboardStore;
}

function toWidgetListItem(widget: WidgetRow) {
  return {
    id: widget.id,
    type: widget.type,
    title: widget.title,
    position: widget.position,
  };
}

function chartSeries(
  type: ChartWidgetType,
  config: ChartConfig,
  columns: string[],
  rows: ParsedRow[],
) {
  if (type === "pie") {
    const valueKey = config.valueKey ?? config.yKey ?? columns[1];
    return valueKey ? [{ key: valueKey, label: valueKey }] : [];
  }

  if (type === "stacked_bar" && config.stackKeys?.length) {
    return config.stackKeys.map((key) => ({ key, label: key }));
  }

  if (config.seriesKey) {
    const values = new Set(
      rows
        .map((row) => row[config.seriesKey!])
        .filter((value) => value !== null && value !== undefined)
        .map(String),
    );
    return [...values].map((value) => ({ key: value, label: value }));
  }

  const valueKey = config.yKey ?? columns.find((column) =>
    rows.some((row) => typeof row[column] === "number"),
  );
  return valueKey ? [{ key: valueKey, label: valueKey }] : [];
}

async function toWidgetDetail(
  widget: WidgetRow,
  store: DashboardStore,
): Promise<WidgetDetail> {
  if (widget.type === "text") {
    return {
      ...toWidgetListItem(widget),
      datasetId: widget.datasetId,
      chartConfig: null,
      payload: { kind: "text", content: widget.content ?? "" },
    };
  }

  const dataset = widget.datasetId ? await store.getDataset(widget.datasetId) : null;
  const chartConfig =
    widget.chartConfig ??
    (dataset ? inferChartConfig(widget.type, dataset.columns, dataset.rows) : null);
  const config = chartConfigSchema.safeParse(chartConfig ?? {}).data ?? {};
  const xKey =
    config.xKey ?? config.categoryKey ?? dataset?.columns[0] ?? "";

  return {
    ...toWidgetListItem(widget),
    datasetId: widget.datasetId,
    chartConfig,
    payload: {
      kind: "chart",
      xKey,
      series: dataset
        ? chartSeries(widget.type, config, dataset.columns, dataset.rows)
        : [],
      points: dataset?.rows ?? [],
    },
  };
}

const defaultTitles = {
  line: "Line chart",
  bar: "Bar chart",
  stacked_bar: "Stacked bar chart",
  pie: "Pie chart",
  text: "Text",
} as const;

export function registerRoutes(app: FastifyInstance, options: RouteOptions = {}) {
  let store = options.store;
  const getStore = () => {
    store ??= createDashboardStore();
    return store;
  };

  app.get("/health", async () => ({ ok: true as const }));

  app.get("/api/datasets", async () => getStore().listDatasetSummaries());

  app.get("/api/widgets", async () =>
    (await getStore().listWidgets()).map(toWidgetListItem),
  );

  app.get<{ Params: { id: string } }>("/api/widgets/:id", async (request, reply) => {
    const id = widgetListItemSchema.shape.id.safeParse(request.params.id);
    if (!id.success) return reply.code(400).send({ error: "Invalid widget id" });

    const widget = await getStore().getWidget(id.data);
    if (!widget) return reply.code(404).send({ error: "Widget not found" });
    return toWidgetDetail(widget, getStore());
  });

  app.post("/api/widgets", async (request, reply) => {
    const parsed = createWidgetBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid body" });
    }

    const { type, title, datasetId } = parsed.data;
    const routeStore = getStore();
    const dataset = isChartWidgetType(type)
      ? datasetId
        ? await routeStore.getDataset(datasetId)
        : await routeStore.getFirstDataset()
      : null;
    if (isChartWidgetType(type) && !dataset) {
      return datasetId
        ? reply.code(404).send({ error: "Dataset not found" })
        : reply.code(409).send({ error: "Import a dataset before adding a chart" });
    }

    const existingWidgets = await routeStore.listWidgets();
    const widget = await routeStore.createWidget({
      type,
      title: title ?? defaultTitles[type],
      position: existingWidgets.reduce((max, item) => Math.max(max, item.position), -1) + 1,
      datasetId: dataset?.id ?? null,
      chartConfig:
        dataset && isChartWidgetType(type)
          ? inferChartConfig(type, dataset.columns, dataset.rows)
          : null,
      content: type === "text" ? "" : null,
    });

    return reply.code(201).send(await toWidgetDetail(widget, routeStore));
  });

  app.patch<{ Params: { id: string } }>("/api/widgets/:id", async (request, reply) => {
    const id = widgetListItemSchema.shape.id.safeParse(request.params.id);
    if (!id.success) return reply.code(400).send({ error: "Invalid widget id" });

    const parsed = patchWidgetBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid body" });
    }

    const routeStore = getStore();
    const current = await routeStore.getWidget(id.data);
    if (!current) return reply.code(404).send({ error: "Widget not found" });

    const patch = parsed.data;
    const changesChart = patch.chartConfig !== undefined || patch.datasetId !== undefined;
    if ((current.type === "text" && changesChart) || (current.type !== "text" && patch.content !== undefined)) {
      return reply.code(400).send({ error: "Patch fields do not match the widget type" });
    }
    if (typeof patch.datasetId === "string" && !(await routeStore.getDataset(patch.datasetId))) {
      return reply.code(404).send({ error: "Dataset not found" });
    }

    const updated = await routeStore.updateWidget(id.data, patch);
    if (!updated) return reply.code(404).send({ error: "Widget not found" });
    return toWidgetDetail(updated, routeStore);
  });

  app.delete<{ Params: { id: string } }>("/api/widgets/:id", async (request, reply) => {
    const id = widgetListItemSchema.shape.id.safeParse(request.params.id);
    if (!id.success) return reply.code(400).send({ error: "Invalid widget id" });

    const deleted = await getStore().deleteWidget(id.data);
    if (!deleted) return reply.code(404).send({ error: "Widget not found" });
    return reply.code(204).send();
  });
}