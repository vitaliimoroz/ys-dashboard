import type { DatasetSummary } from "@ys-dashboard/shared";
import { asc, eq } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import { datasets } from "../../db/schema.js";

export type DatasetRow = typeof datasets.$inferSelect;
export type NewDatasetRow = typeof datasets.$inferInsert;

export interface DatasetRepository {
  listDatasetSummaries(): Promise<DatasetSummary[]>;
  createDataset(input: NewDatasetRow): Promise<DatasetRow>;
  getDataset(id: string): Promise<DatasetRow | null>;
  upsertBySource(input: NewDatasetRow): Promise<"inserted" | "updated">;
}

export function createDatasetRepository(db: Database): DatasetRepository {
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
    getDataset: async (id) => {
      const [dataset] = await db
        .select()
        .from(datasets)
        .where(eq(datasets.id, id))
        .limit(1);
      return dataset ?? null;
    },
    upsertBySource: async (input) => {
      const matches = await db
        .select({ id: datasets.id, sheetName: datasets.sheetName })
        .from(datasets)
        .where(eq(datasets.sourceFilename, input.sourceFilename));
      const existing = matches.find((item) => item.sheetName === input.sheetName);

      if (existing) {
        await db
          .update(datasets)
          .set({
            name: input.name,
            sourceKind: input.sourceKind,
            columns: input.columns,
            rowCount: input.rowCount,
            rows: input.rows,
          })
          .where(eq(datasets.id, existing.id));
        return "updated";
      }

      await db.insert(datasets).values(input);
      return "inserted";
    },
  };
}