import { asc, eq } from "drizzle-orm";
import type { DatasetSummary } from "@ys-dashboard/shared";
import { createDb, type Database } from "./client.js";
import { datasets, widgets } from "./schema.js";

export type DatasetRow = typeof datasets.$inferSelect;
export type NewDatasetRow = typeof datasets.$inferInsert;
export type WidgetRow = typeof widgets.$inferSelect;
export type NewWidgetRow = typeof widgets.$inferInsert;
export type WidgetPatch = Partial<
  Pick<WidgetRow, "title" | "content" | "chartConfig" | "datasetId">
>;

export interface DashboardStore {
  listDatasetSummaries(): Promise<DatasetSummary[]>;
  createDataset(input: NewDatasetRow): Promise<DatasetRow>;
  getFirstDataset(): Promise<DatasetRow | null>;
  getDataset(id: string): Promise<DatasetRow | null>;
  listWidgets(): Promise<WidgetRow[]>;
  getWidget(id: string): Promise<WidgetRow | null>;
  createWidget(input: NewWidgetRow): Promise<WidgetRow>;
  updateWidget(id: string, patch: WidgetPatch): Promise<WidgetRow | null>;
  deleteWidget(id: string): Promise<boolean>;
}

export function createDashboardStore(db: Database = createDb()): DashboardStore {
  return {
    listDatasetSummaries: () =>
      db
        .select({
          id: datasets.id,
          name: datasets.name,
          sourceFilename: datasets.sourceFilename,
          sheetName: datasets.sheetName,
          sourceKind: datasets.sourceKind,
          columns: datasets.columns,
          rowCount: datasets.rowCount,
        })
        .from(datasets)
        .orderBy(asc(datasets.name), asc(datasets.sheetName)),
    createDataset: async (input) => {
      const [dataset] = await db.insert(datasets).values(input).returning();
      if (!dataset) throw new Error("Dataset insert returned no row");
      return dataset;
    },
    getFirstDataset: async () => {
      const [dataset] = await db
        .select()
        .from(datasets)
        .orderBy(asc(datasets.name), asc(datasets.sheetName))
        .limit(1);
      return dataset ?? null;
    },
    getDataset: async (id) => {
      const [dataset] = await db
        .select()
        .from(datasets)
        .where(eq(datasets.id, id))
        .limit(1);
      return dataset ?? null;
    },
    listWidgets: () => db.select().from(widgets).orderBy(asc(widgets.position)),
    getWidget: async (id) => {
      const [widget] = await db
        .select()
        .from(widgets)
        .where(eq(widgets.id, id))
        .limit(1);
      return widget ?? null;
    },
    createWidget: async (input) => {
      const [widget] = await db.insert(widgets).values(input).returning();
      if (!widget) throw new Error("Widget insert returned no row");
      return widget;
    },
    updateWidget: async (id, patch) => {
      const [widget] = await db
        .update(widgets)
        .set(patch)
        .where(eq(widgets.id, id))
        .returning();
      return widget ?? null;
    },
    deleteWidget: async (id) => {
      const deleted = await db
        .delete(widgets)
        .where(eq(widgets.id, id))
        .returning({ id: widgets.id });
      return deleted.length > 0;
    },
  };
}