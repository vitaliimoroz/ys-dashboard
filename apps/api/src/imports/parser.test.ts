import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  inferChartConfig,
  parseCsvBuffer,
  parseXlsxSheetsBuffer,
  parseTabularFile,
  parseXlsxBuffer,
} from "./parser.js";

describe("tabular import parser", () => {
  it("parses CSV headers, numeric cells, and skips empty rows", () => {
    const parsed = parseCsvBuffer(
      Buffer.from("Campaign,Result\nA,1895\n,\nB,1699\n"),
    );

    expect(parsed).toMatchObject({
      columns: ["Campaign", "Result"],
      rows: [
        { Campaign: "A", Result: 1895 },
        { Campaign: "B", Result: 1699 },
      ],
    });
  });

  it("parses the first non-empty XLSX worksheet", async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet("Empty");
    const worksheet = workbook.addWorksheet("Campaigns");
    worksheet.addRow(["Campaign", "Result"]);
    worksheet.addRow(["A", 1895]);
    worksheet.addRow([]);
    worksheet.addRow(["B", 1699]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const parsed = await parseXlsxBuffer(buffer);

    expect(parsed.sheetName).toBe("Campaigns");
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[1]).toEqual({ Campaign: "B", Result: 1699 });
  });

  it("parses every non-empty worksheet using populated columns", async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet("Empty");
    const line = workbook.addWorksheet("Line");
    line.addRow(["Campaign", "Result", "Series"]);
    line.addRow(["A", 10, "Direct"]);
    const pie = workbook.addWorksheet("Pie");
    pie.addRow(["Campaign", "Result"]);
    pie.addRow(["A", 10]);
    pie.getCell("D1").numFmt = "0";
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const parsed = await parseXlsxSheetsBuffer(buffer);

    expect(parsed.map((table) => table.sheetName)).toEqual(["Line", "Pie"]);
    expect(parsed.map((table) => table.columns.length)).toEqual([3, 2]);
    expect(parsed[1]?.rows).toEqual([{ Campaign: "A", Result: 10 }]);
  });

  it("routes by extension and rejects unsupported formats", async () => {
    const parsed = await parseTabularFile(
      "campaigns.CSV",
      Buffer.from("Campaign,Result\nA,3"),
    );
    expect(parsed.rows).toEqual([{ Campaign: "A", Result: 3 }]);
    await expect(parseTabularFile("campaigns.xls", Buffer.alloc(0))).rejects.toThrow(
      "Only .csv and .xlsx files are supported",
    );
  });
});

describe("chart config inference", () => {
  it("uses named columns for long-form line data", () => {
    expect(
      inferChartConfig("line", ["Campaign", "Series", "Result"], [
        { Campaign: "A", Series: "Direct", Result: 5 },
      ]),
    ).toEqual({ xKey: "Campaign", yKey: "Result", seriesKey: "Series" });
  });

  it("uses numeric columns as stacks for wide-form data", () => {
    expect(
      inferChartConfig("stacked_bar", ["Campaign", "Direct", "Organic"], [
        { Campaign: "A", Direct: 5, Organic: 8 },
      ]),
    ).toEqual({ xKey: "Campaign", stackKeys: ["Direct", "Organic"] });
  });

  it("maps named campaign and result columns for pie data", () => {
    expect(
      inferChartConfig("pie", ["Campaign", "Result"], [
        { Campaign: "A", Result: 1895 },
      ]),
    ).toEqual({ categoryKey: "Campaign", valueKey: "Result" });
  });
});