import type { DatasetSummary } from "@ys-dashboard/shared";
import type { DatasetRepository } from "../datasets/datasets.repository.js";

export function listDatasets(repository: DatasetRepository): Promise<DatasetSummary[]> {
  return repository.listDatasetSummaries();
}