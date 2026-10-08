import type { DatasetRepository } from "./datasets/datasets.repository.js";
import type { WidgetRepository } from "./widgets/widgets.repository.js";

export interface ApiRepositories {
  datasets: DatasetRepository;
  widgets: WidgetRepository;
}

export type RepositoryProvider = () => ApiRepositories;