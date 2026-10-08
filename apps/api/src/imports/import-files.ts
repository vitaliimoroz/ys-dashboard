import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { createDb, type Database } from "../db/client.js";
import { createDatasetRepository } from "../modules/datasets/datasets.repository.js";
import { parseCsvBuffer, parseXlsxSheetsBuffer, type ParsedTable } from "./parser.js";

export interface ImportedTableResult {
  sourceFilename: string;
  sheetName: string | null;
  name: string;
  sourceKind: "csv" | "xlsx";
  rowCount: number;
  columnCount: number;
  action: "inserted" | "updated";
}

export async function importFiles(
  filePaths: string[],
  db: Database = createDb(),
): Promise<ImportedTableResult[]> {
  if (filePaths.length === 0) {
    throw new Error("Provide at least one .csv or .xlsx file path");
  }

  const datasetRepository = createDatasetRepository(db);
  const results: ImportedTableResult[] = [];
  for (const filePath of filePaths) {
    const sourceFilename = basename(filePath);
    const extension = extname(filePath).toLowerCase();
    if (extension !== ".csv" && extension !== ".xlsx") {
      throw new Error(`Unsupported file format: ${filePath}. Use .csv or .xlsx`);
    }

    const sourceKind = extension === ".csv" ? "csv" : "xlsx";
    const buffer = await readFile(filePath);
    const tables: ParsedTable[] = sourceKind === "csv"
      ? [parseCsvBuffer(buffer)]
      : await parseXlsxSheetsBuffer(buffer);

    for (const table of tables) {
      const name = table.sheetName
        ? `${basename(sourceFilename, extension)} - ${table.sheetName}`
        : basename(sourceFilename, extension);
      const action = await datasetRepository.upsertBySource({
        name,
        sourceFilename,
        sheetName: table.sheetName,
        sourceKind,
        columns: table.columns,
        rowCount: table.rows.length,
        rows: table.rows,
      });

      results.push({
        sourceFilename,
        sheetName: table.sheetName,
        name,
        sourceKind,
        rowCount: table.rows.length,
        columnCount: table.columns.length,
        action,
      });
    }
  }

  return results;
}