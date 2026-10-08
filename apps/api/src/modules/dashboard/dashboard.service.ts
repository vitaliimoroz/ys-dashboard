import type { DatasetSummary } from "@ys-dashboard/shared";
import type { DashboardStore } from "../../db/store.js";

export function listDatasets(store: DashboardStore): Promise<DatasetSummary[]> {
  return store.listDatasetSummaries();
}