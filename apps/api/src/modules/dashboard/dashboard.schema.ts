const datasetSummaryJsonSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    sourceFilename: { type: "string" },
    sheetName: { type: ["string", "null"] },
    sourceKind: { type: "string" },
    columns: { type: "array", items: { type: "string" } },
    rowCount: { type: "integer", minimum: 0 },
  },
  required: ["id", "name", "sourceFilename", "sheetName", "sourceKind", "columns", "rowCount"],
} as const;

export const healthResponseSchema = {
  type: "object",
  properties: { ok: { type: "boolean" } },
  required: ["ok"],
} as const;

export const datasetSummariesResponseSchema = {
  type: "array",
  items: datasetSummaryJsonSchema,
} as const;