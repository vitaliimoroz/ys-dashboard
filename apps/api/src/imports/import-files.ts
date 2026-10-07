import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { eq } from "drizzle-orm";
import { createDb, type Database } from "../db/client.js";
import { datasets } from "../db/schema.js";
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
      const matches = await db
        .select({ id: datasets.id, sheetName: datasets.sheetName })
        .from(datasets)
        .where(eq(datasets.sourceFilename, sourceFilename));
      const existingTable = matches.find((item) => item.sheetName === table.sheetName);

      if (existingTable) {
        await db.update(datasets).set({
          name,
          sourceKind,
          columns: table.columns,
          rowCount: table.rows.length,
          rows: table.rows,
        }).where(eq(datasets.id, existingTable.id));
      } else {
        await db.insert(datasets).values({
          name,
          sourceFilename,
          sheetName: table.sheetName,
          sourceKind,
          columns: table.columns,
          rowCount: table.rows.length,
          rows: table.rows,
        });
      }

      results.push({
        sourceFilename,
        sheetName: table.sheetName,
        name,
        sourceKind,
        rowCount: table.rows.length,
        columnCount: table.columns.length,
        action: existingTable ? "updated" : "inserted",
      });
    }
  }

  return results;
}