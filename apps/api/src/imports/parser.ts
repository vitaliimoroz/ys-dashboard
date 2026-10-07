import ExcelJS from "exceljs";
import { parse as parseCsv } from "csv-parse/sync";
import type { ChartConfig, ChartWidgetType } from "@ys-dashboard/shared";

export type ParsedCell = string | number | null;
export type ParsedRow = Record<string, ParsedCell>;

export interface ParsedTable {
  sheetName: string | null;
  columns: string[];
  rows: ParsedRow[];
}

function normalizeCell(value: unknown): ParsedCell {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" || typeof value === "number") return value;
  if (value instanceof Date) return value.toISOString();

  if (typeof value === "object") {
    const cell = value as { result?: unknown; text?: unknown; richText?: { text: string }[] };
    if (cell.result !== undefined) return normalizeCell(cell.result);
    if (typeof cell.text === "string") return cell.text;
    if (Array.isArray(cell.richText)) {
      return cell.richText.map((part) => part.text).join("");
    }
  }

  return String(value);
}

function toTable(records: unknown[][], sheetName: string | null): ParsedTable {
  const nonEmptyRecords = records.filter((record) =>
    record.some((value) => value !== null && value !== undefined && value !== ""),
  );
  const [headerRecord, ...dataRecords] = nonEmptyRecords;

  if (!headerRecord) {
    throw new Error("The file does not contain a header row");
  }

  const columns = headerRecord.map((value, index) => {
    const label = String(normalizeCell(value) ?? "").trim();
    return label || `Column ${index + 1}`;
  });

  const rows = dataRecords
    .filter((record) =>
      record.some((value) => value !== null && value !== undefined && value !== ""),
    )
    .map((record) =>
      Object.fromEntries(
        columns.map((column, index) => [column, normalizeCell(record[index])]),
      ),
    );

  return { sheetName, columns, rows };
}

export function parseCsvBuffer(buffer: Buffer): ParsedTable {
  const records = parseCsv(buffer, {
    bom: true,
    skip_empty_lines: false,
    cast: (value: string) => {
      const trimmed = value.trim();
      if (trimmed === "") return null;
      if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) return Number(trimmed);
      return value;
    },
  }) as unknown[][];

  return toTable(records, null);
}

export async function parseXlsxSheetsBuffer(buffer: Buffer): Promise<ParsedTable[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Uint8Array.from(buffer).buffer);
  const worksheets = workbook.worksheets.filter((sheet) => sheet.actualRowCount > 0);

  if (worksheets.length === 0) {
    throw new Error("The workbook does not contain a non-empty worksheet");
  }

  return worksheets.map((worksheet) => {
    const records: unknown[][] = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      records.push(
        Array.from({ length: worksheet.actualColumnCount }, (_, index) =>
          row.getCell(index + 1).value,
        ),
      );
    });

    return toTable(records, worksheet.name);
  });
}

export async function parseXlsxBuffer(buffer: Buffer): Promise<ParsedTable> {
  const [firstSheet] = await parseXlsxSheetsBuffer(buffer);
  return firstSheet;
}

export async function parseTabularFile(
  filename: string,
  buffer: Buffer,
): Promise<ParsedTable> {
  const extension = filename.toLowerCase().split(".").at(-1);
  if (extension === "csv") return parseCsvBuffer(buffer);
  if (extension === "xlsx") return parseXlsxBuffer(buffer);
  throw new Error("Only .csv and .xlsx files are supported");
}

function findNamedColumn(columns: string[], names: string[]): string | undefined {
  return columns.find((column) =>
    names.includes(column.trim().toLowerCase().replace(/[^a-z0-9]/g, "")),
  );
}

export function inferChartConfig(
  type: ChartWidgetType,
  columns: string[],
  rows: ParsedRow[],
): ChartConfig {
  const categoryKey =
    findNamedColumn(columns, ["campaign", "category", "name", "label", "date"]) ??
    columns[0];
  const valueKey =
    findNamedColumn(columns, ["result", "value", "amount", "count", "total"]) ??
    columns.find((column) => rows.some((row) => typeof row[column] === "number"));
  const seriesKey = findNamedColumn(columns, ["series", "metric", "channel"]);
  const numericColumns = columns.filter(
    (column) =>
      column !== categoryKey &&
      column !== seriesKey &&
      rows.some((row) => typeof row[column] === "number"),
  );

  if (type === "pie") {
    return { categoryKey, valueKey: valueKey ?? numericColumns[0] };
  }

  if (type === "stacked_bar" && !seriesKey && numericColumns.length > 1) {
    return { xKey: categoryKey, stackKeys: numericColumns };
  }

  return {
    xKey: categoryKey,
    ...(valueKey ? { yKey: valueKey } : {}),
    ...(seriesKey ? { seriesKey } : {}),
  };
}