export const WIDGET_TYPES = [
  "line",
  "bar",
  "stacked_bar",
  "pie",
  "text",
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number];

export const CHART_WIDGET_TYPES = [
  "line",
  "bar",
  "stacked_bar",
  "pie",
] as const;

export type ChartWidgetType = (typeof CHART_WIDGET_TYPES)[number];

export function isChartWidgetType(
  type: WidgetType,
): type is ChartWidgetType {
  return type !== "text";
}

export const SOURCE_KINDS = ["xlsx", "csv", "generated"] as const;

export type SourceKind = (typeof SOURCE_KINDS)[number];
