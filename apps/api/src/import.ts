import { resolve } from "node:path";
import { importFiles } from "./imports/import-files.js";

const filePaths = process.argv.slice(2).map((filePath) => resolve(filePath));

try {
  const results = await importFiles(filePaths);
  for (const result of results) {
    const sheet = result.sheetName ? ` (${result.sheetName})` : "";
    console.log(
      `${result.action}: ${result.sourceFilename}${sheet} - ${result.rowCount} rows, ${result.columnCount} columns`,
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}