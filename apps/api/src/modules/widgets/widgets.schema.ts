import { WIDGET_TYPES } from "@ys-dashboard/shared";

export const widgetIdParamsSchema = {
  type: "object",
  properties: { id: { type: "string", format: "uuid" } },
  required: ["id"],
} as const;

export const createWidgetBodyJsonSchema = {
  type: "object",
  properties: {
    type: { type: "string", enum: WIDGET_TYPES },
    title: { type: "string", minLength: 1, maxLength: 120 },
  },
  required: ["type"],
} as const;

const chartConfigJsonSchema = {
  type: "object",
  properties: {
    xKey: { type: "string" },
    yKey: { type: "string" },
    seriesKey: { type: "string" },
    stackKeys: { type: "array", items: { type: "string" } },
    categoryKey: { type: "string" },
    valueKey: { type: "string" },
  },
} as const;

export const patchWidgetBodyJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string", minLength: 1, maxLength: 120 },
    content: { type: "string", maxLength: 20_000 },
    chartConfig: chartConfigJsonSchema,
    datasetId: { anyOf: [{ type: "string", format: "uuid" }, { type: "null" }] },
  },
  anyOf: [
    { required: ["title"] },
    { required: ["content"] },
    { required: ["chartConfig"] },
    { required: ["datasetId"] },
  ],
} as const;