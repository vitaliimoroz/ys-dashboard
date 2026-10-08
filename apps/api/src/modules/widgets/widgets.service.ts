import {
  chartConfigSchema,
  type ChartConfig,
  type ChartWidgetType,
  type CreateWidgetBody,
  type PatchWidgetBody,
  type WidgetDetail,
} from "@ys-dashboard/shared";
import { inferChartConfig, type ParsedRow } from "../../imports/parser.js";
import type { DatasetRepository, NewDatasetRow } from "../datasets/datasets.repository.js";
import type {
  WidgetRepository,
  WidgetRow,
} from "./widgets.repository.js";

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
  datasetRepository: DatasetRepository,
): Promise<WidgetDetail> {
  if (widget.type === "text") {
    return {
      ...toWidgetListItem(widget),
      datasetId: widget.datasetId,
      chartConfig: null,
      payload: { kind: "text", content: widget.content ?? "" },
    };
  }

  const dataset = widget.datasetId
    ? await datasetRepository.getDataset(widget.datasetId)
    : null;
  const chartConfig =
    widget.chartConfig ??
    (dataset ? inferChartConfig(widget.type, dataset.columns, dataset.rows) : null);
  const config = chartConfigSchema.safeParse(chartConfig ?? {}).data ?? {};
  const xKey = config.xKey ?? config.categoryKey ?? dataset?.columns[0] ?? "";

  return {
    ...toWidgetListItem(widget),
    datasetId: widget.datasetId,
    chartConfig,
    payload: {
      kind: "chart",
      xKey,
      series: dataset ? chartSeries(widget.type, config, dataset.columns, dataset.rows) : [],
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

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createRandomChartDataset(type: ChartWidgetType, title: string): NewDatasetRow {
  const categories = Array.from({ length: 6 }, (_, index) => `Category ${index + 1}`);

  if (type === "line") {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const rows = months.flatMap((month) =>
      ["Series A", "Series B", "Series C"].map((series) => ({
        Month: month,
        Series: series,
        Value: randomInt(15, 100),
      })),
    );
    return {
      name: `${title} sample data`,
      sourceFilename: "generated:line",
      sheetName: null,
      sourceKind: "generated",
      columns: ["Month", "Series", "Value"],
      rowCount: rows.length,
      rows,
    };
  }

  if (type === "pie") {
    const rows = categories.map((Category) => ({ Category, Value: randomInt(10, 100) }));
    return {
      name: `${title} sample data`,
      sourceFilename: "generated:pie",
      sheetName: null,
      sourceKind: "generated",
      columns: ["Category", "Value"],
      rowCount: rows.length,
      rows,
    };
  }

  if (type === "stacked_bar") {
    const rows = categories.map((Brand) => ({
      Brand,
      Positive: randomInt(15, 100),
      Neutral: randomInt(15, 100),
      Negative: randomInt(15, 100),
    }));
    return {
      name: `${title} sample data`,
      sourceFilename: "generated:stacked_bar",
      sheetName: null,
      sourceKind: "generated",
      columns: ["Brand", "Positive", "Neutral", "Negative"],
      rowCount: rows.length,
      rows,
    };
  }

  const rows = categories.map((Category) => ({ Category, Value: randomInt(15, 100) }));
  return {
    name: `${title} sample data`,
    sourceFilename: "generated:bar",
    sheetName: null,
    sourceKind: "generated",
    columns: ["Category", "Value"],
    rowCount: rows.length,
    rows,
  };
}

function randomChartConfig(type: ChartWidgetType): ChartConfig {
  if (type === "pie") return { categoryKey: "Category", valueKey: "Value" };
  if (type === "line") return { xKey: "Month", yKey: "Value", seriesKey: "Series" };
  if (type === "stacked_bar") {
    return { xKey: "Brand", stackKeys: ["Positive", "Neutral", "Negative"] };
  }
  return { xKey: "Category", yKey: "Value" };
}

export async function listWidgets(repository: WidgetRepository) {
  return (await repository.listWidgets()).map(toWidgetListItem);
}

export async function getWidgetDetail(
  widgetRepository: WidgetRepository,
  datasetRepository: DatasetRepository,
  id: string,
) {
  const widget = await widgetRepository.getWidget(id);
  return widget ? toWidgetDetail(widget, datasetRepository) : null;
}

export async function createWidget(
  widgetRepository: WidgetRepository,
  datasetRepository: DatasetRepository,
  input: CreateWidgetBody,
) {
  const { type, title } = input;
  const chartType = type === "text" ? null : type;
  const chartTitle = title ?? defaultTitles[type];
  const dataset = chartType
    ? await datasetRepository.createDataset(createRandomChartDataset(chartType, chartTitle))
    : null;
  const existingWidgets = await widgetRepository.listWidgets();
  const widget = await widgetRepository.createWidget({
    type,
    title: chartTitle,
    position: existingWidgets.reduce((max, item) => Math.max(max, item.position), -1) + 1,
    datasetId: dataset?.id ?? null,
    chartConfig: chartType ? randomChartConfig(chartType) : null,
    content: type === "text" ? "" : null,
  });

  return toWidgetDetail(widget, datasetRepository);
}

export async function updateWidget(
  widgetRepository: WidgetRepository,
  datasetRepository: DatasetRepository,
  id: string,
  patch: PatchWidgetBody,
) {
  const current = await widgetRepository.getWidget(id);
  if (!current) return { kind: "not-found" as const };

  const changesChart = patch.chartConfig !== undefined || patch.datasetId !== undefined;
  if (
    (current.type === "text" && changesChart) ||
    (current.type !== "text" && patch.content !== undefined)
  ) {
    return { kind: "invalid-patch" as const };
  }
  if (
    typeof patch.datasetId === "string" &&
    !(await datasetRepository.getDataset(patch.datasetId))
  ) {
    return { kind: "dataset-not-found" as const };
  }

  const updated = await widgetRepository.updateWidget(id, patch);
  if (!updated) return { kind: "not-found" as const };
  return {
    kind: "updated" as const,
    widget: await toWidgetDetail(updated, datasetRepository),
  };
}

export function deleteWidget(repository: WidgetRepository, id: string) {
  return repository.deleteWidget(id);
}