import type {
  ChartConfig,
  WidgetDetail,
  WidgetType,
} from "@ys-dashboard/shared";
import { chartColors } from "../constants/dashboard";
import type { ChartRow } from "../types/dashboard";

const axisDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});
const tooltipDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function parseChartDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatAxisDate(value: unknown): string {
  const date = parseChartDate(value);
  if (!date) return String(value ?? "");
  const parts = axisDateFormatter.formatToParts(date);
  const month = parts.find((part) => part.type === "month")?.value;
  const year = parts.find((part) => part.type === "year")?.value;
  return month && year ? `${month} '${year}` : axisDateFormatter.format(date);
}

export function formatTooltipDate(value: unknown): string {
  const date = parseChartDate(value);
  return date ? tooltipDateFormatter.format(date) : String(value ?? "");
}

export function chartConfigFor(type: WidgetType, columns: string[]): ChartConfig {
  const normalize = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const find = (names: string[]) => columns.find((column) => names.includes(normalize(column)));
  const categoryKey = find(["campaign", "brand", "category", "name", "label", "date"]) ?? columns[0];
  const dateKey = find(["date", "day", "month", "time", "timestamp"]);
  const campaignKey = find(["campaign"]);
  const numericColumns = columns.filter((column) =>
    ["result", "value", "amount", "count", "total", "positive", "neutral", "negative", "organic", "direct"].includes(normalize(column)),
  );
  const valueKey = find(["result", "value", "amount", "count", "total"]) ?? numericColumns[0];

  if (type === "pie") return { categoryKey, valueKey };
  if (type === "line" && dateKey && campaignKey && dateKey !== campaignKey) {
    return { xKey: dateKey, yKey: valueKey, seriesKey: campaignKey };
  }
  if (type === "stacked_bar") {
    return { xKey: categoryKey, stackKeys: numericColumns.length > 1 ? numericColumns : valueKey ? [valueKey] : [] };
  }
  return { xKey: categoryKey, ...(valueKey ? { yKey: valueKey } : {}) };
}

export function chartRows(detail: WidgetDetail): ChartRow[] {
  if (detail.payload.kind !== "chart") return [];
  const points = detail.payload.points as ChartRow[];
  const seriesKey = detail.chartConfig?.seriesKey;
  const valueKey = detail.chartConfig?.yKey ?? detail.chartConfig?.valueKey;
  if (!seriesKey || !valueKey) return points;

  const grouped = new Map<string, ChartRow>();
  for (const point of points) {
    const category = String(point[detail.payload.xKey] ?? "");
    const series = String(point[seriesKey] ?? "");
    const existing = grouped.get(category) ?? { [detail.payload.xKey]: point[detail.payload.xKey] };
    existing[series] = point[valueKey];
    grouped.set(category, existing);
  }
  return [...grouped.values()];
}

export const chartTooltipStyle = {
  border: "1px solid #dce3dd",
  borderRadius: 6,
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(24, 42, 35, 0.08)",
};

export { chartColors };