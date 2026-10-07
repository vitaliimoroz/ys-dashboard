import { z } from "zod";
import { SOURCE_KINDS, WIDGET_TYPES } from "./widget-types.js";

export const widgetTypeSchema = z.enum(WIDGET_TYPES);
export const sourceKindSchema = z.enum(SOURCE_KINDS);

export const cellValueSchema = z.union([z.string(), z.number(), z.null()]);
export const tabularRowSchema = z.record(z.string(), cellValueSchema);

/** Extensible chart mapping stored on the widget. Extra keys are preserved for later features. */
export const chartConfigSchema = z
  .object({
    xKey: z.string().optional(),
    yKey: z.string().optional(),
    seriesKey: z.string().optional(),
    stackKeys: z.array(z.string()).optional(),
    categoryKey: z.string().optional(),
    valueKey: z.string().optional(),
  })
  .passthrough();

export type ChartConfig = z.infer<typeof chartConfigSchema>;

export const widgetListItemSchema = z.object({
  id: z.string().uuid(),
  type: widgetTypeSchema,
  title: z.string(),
  position: z.number().int(),
});

export type WidgetListItem = z.infer<typeof widgetListItemSchema>;

export const chartSeriesSchema = z.object({
  key: z.string(),
  label: z.string(),
});

export const chartPayloadSchema = z.object({
  kind: z.literal("chart"),
  xKey: z.string(),
  series: z.array(chartSeriesSchema),
  points: z.array(tabularRowSchema),
});

export const textPayloadSchema = z.object({
  kind: z.literal("text"),
  content: z.string(),
});

export const widgetPayloadSchema = z.discriminatedUnion("kind", [
  chartPayloadSchema,
  textPayloadSchema,
]);

export type WidgetPayload = z.infer<typeof widgetPayloadSchema>;

export const widgetDetailSchema = widgetListItemSchema.extend({
  datasetId: z.string().uuid().nullable(),
  chartConfig: chartConfigSchema.nullable(),
  payload: widgetPayloadSchema,
});

export type WidgetDetail = z.infer<typeof widgetDetailSchema>;

export const createWidgetBodySchema = z.object({
  type: widgetTypeSchema,
  title: z.string().min(1).max(120).optional(),
});

export type CreateWidgetBody = z.infer<typeof createWidgetBodySchema>;

export const patchWidgetBodySchema = z
  .object({
    title: z.string().min(1).max(120).optional(),
    content: z.string().max(20_000).optional(),
    chartConfig: chartConfigSchema.optional(),
    datasetId: z.string().uuid().nullable().optional(),
  })
  .refine(
    (body) =>
      body.title !== undefined ||
      body.content !== undefined ||
      body.chartConfig !== undefined ||
      body.datasetId !== undefined,
    { message: "At least one field is required" },
  );

export type PatchWidgetBody = z.infer<typeof patchWidgetBodySchema>;

export const datasetSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  sourceFilename: z.string(),
  sheetName: z.string().nullable(),
  sourceKind: sourceKindSchema,
  columns: z.array(z.string()),
  rowCount: z.number().int().nonnegative(),
});

export type DatasetSummary = z.infer<typeof datasetSummarySchema>;
