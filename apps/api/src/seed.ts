import { readFile, readdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import type { ChartWidgetType } from "@ys-dashboard/shared";
import { createDb } from "./db/client.js";
import { datasets, widgets } from "./db/schema.js";
import { inferChartConfig, parseCsvBuffer, parseXlsxSheetsBuffer } from "./imports/parser.js";

const dataDirectory = fileURLToPath(new URL("../data/", import.meta.url));

async function seed() {
  const db = createDb();
  const files = (await readdir(dataDirectory, { withFileTypes: true }))
    .filter(
      (entry) =>
        entry.isFile() && /\.(csv|xlsx)$/i.test(entry.name),
    )
    .map((entry) => entry.name)
    .sort();

  if (files.length === 0) {
    throw new Error(`No .csv or .xlsx seed files found in ${dataDirectory}`);
  }

  for (const sourceFilename of files) {
    const existing = await db
      .select({ id: datasets.id, sheetName: datasets.sheetName, sourceKind: datasets.sourceKind })
      .from(datasets)
      .where(eq(datasets.sourceFilename, sourceFilename));

    const bytes = await readFile(join(dataDirectory, sourceFilename));
    const extension = extname(sourceFilename).toLowerCase();
    const sourceKind = extension === ".csv" ? "csv" : "xlsx";
    const parsedTables =
      sourceKind === "csv"
        ? [parseCsvBuffer(bytes)]
        : await parseXlsxSheetsBuffer(bytes);

    for (const parsed of parsedTables) {
      const baseName = basename(sourceFilename, extension);
      const name = parsed.sheetName ? `${baseName} - ${parsed.sheetName}` : baseName;
      const existingDataset = existing.find((dataset) => dataset.sheetName === parsed.sheetName);

      if (existingDataset) {
        if (existingDataset.sourceKind !== sourceKind) {
          await db
            .update(datasets)
            .set({ name, sourceKind })
            .where(eq(datasets.id, existingDataset.id));
          console.log(`Updated dataset metadata: ${sourceFilename} (${parsed.sheetName ?? "CSV"})`);
        } else {
          console.log(`Skipping existing dataset: ${sourceFilename} (${parsed.sheetName ?? "CSV"})`);
        }
        continue;
      }

      await db.insert(datasets).values({
        name,
        sourceFilename,
        sheetName: parsed.sheetName,
        sourceKind,
        columns: parsed.columns,
        rowCount: parsed.rows.length,
        rows: parsed.rows,
      });

      console.log(
        `Imported ${sourceFilename} (${parsed.sheetName ?? "CSV"}): ${parsed.rows.length} rows`,
      );
    }
  }

  const importedDatasets = await db.select().from(datasets);
  const existingWidgets = await db
    .select({ datasetId: widgets.datasetId, position: widgets.position })
    .from(widgets);
  let nextPosition = existingWidgets.reduce(
    (max, widget) => Math.max(max, widget.position),
    -1,
  ) + 1;

  for (const dataset of importedDatasets) {
    if (existingWidgets.some((widget) => widget.datasetId === dataset.id)) continue;

    const sheetName = dataset.sheetName?.toLowerCase() ?? "";
    const type: ChartWidgetType = sheetName.includes("pie")
      ? "pie"
      : sheetName.includes("line")
        ? "line"
        : dataset.sourceKind === "csv"
          ? "stacked_bar"
          : "bar";
    const title = type === "pie"
      ? "Campaign breakdown"
      : type === "line"
        ? "Campaign performance"
        : type === "stacked_bar"
          ? "Brand sentiment"
          : dataset.name;

    await db.insert(widgets).values({
      type,
      title,
      position: nextPosition++,
      datasetId: dataset.id,
      chartConfig: inferChartConfig(type, dataset.columns, dataset.rows),
      content: null,
    });
    console.log(`Created default ${type} widget for ${dataset.name}`);
  }
}

await seed();