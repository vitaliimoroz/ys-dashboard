import type { DatasetSummary, WidgetDetail, WidgetListItem } from "@ys-dashboard/shared";

export type ActiveView = "dashboard" | "datasets";
export type ChartRow = Record<string, string | number | null>;

export interface DashboardContextValue {
  datasets: DatasetSummary[];
  widgets: WidgetListItem[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  loadDashboard(): Promise<void>;
  addWidget(type: WidgetDetail["type"]): Promise<void>;
  removeWidget(widgetId: string): void;
  dismissError(): void;
}