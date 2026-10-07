import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { ChartConfig, SourceKind, WidgetType } from "@ys-dashboard/shared";

export const sourceKindEnum = pgEnum("source_kind", ["xlsx", "csv", "generated"]);
export const widgetTypeEnum = pgEnum("widget_type", [
  "line",
  "bar",
  "stacked_bar",
  "pie",
  "text",
]);

export const datasets = pgTable("datasets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  sourceFilename: text("source_filename").notNull(),
  sheetName: text("sheet_name"),
  sourceKind: sourceKindEnum("source_kind").$type<SourceKind>().notNull(),
  columns: text("columns").array().notNull(),
  rowCount: integer("row_count").notNull(),
  rows: jsonb("rows")
    .$type<Array<Record<string, string | number | null>>>()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const widgets = pgTable("widgets", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: widgetTypeEnum("type").$type<WidgetType>().notNull(),
  title: text("title").notNull(),
  position: integer("position").notNull(),
  datasetId: uuid("dataset_id").references(() => datasets.id, {
    onDelete: "set null",
  }),
  chartConfig: jsonb("chart_config").$type<ChartConfig>(),
  content: text("content"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});