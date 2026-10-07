import { readFile, readdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { createDb } from "./db/client.js";
import { datasets } from "./db/schema.js";
import { parseTabularFile } from "./imports/parser.js";

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
    const [existing] = await db
      .select({ id: datasets.id })
      .from(datasets)
      .where(eq(datasets.sourceFilename, sourceFilename))
      .limit(1);

    if (existing) {
      console.log(`Skipping existing dataset: ${sourceFilename}`);
      continue;
    }

    const bytes = await readFile(join(dataDirectory, sourceFilename));
    const parsed = await parseTabularFile(sourceFilename, bytes);
    const extension = extname(sourceFilename).toLowerCase();
    const sourceKind = extension === "csv" ? "csv" : "xlsx";

    await db.insert(datasets).values({
      name: basename(sourceFilename, extension),
      sourceFilename,
      sheetName: parsed.sheetName,
      sourceKind,
      columns: parsed.columns,
      rowCount: parsed.rows.length,
      rows: parsed.rows,
    });

    console.log(`Imported ${sourceFilename}: ${parsed.rows.length} rows`);
  }
}

await seed();