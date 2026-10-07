import type {
  DatasetSummary,
  PatchWidgetBody,
  WidgetDetail,
  WidgetListItem,
} from "@ys-dashboard/shared";

export type ActiveView = "dashboard" | "datasets";
export type ChartRow = Record<string, string | number | null>;

export interface DashboardContextValue {
  datasets: DatasetSummary[];
  widgets: WidgetListItem[];
  details: Record<string, WidgetDetail>;
  widgetErrors: Record<string, string>;
  widgetBusy: Record<string, boolean>;
  loading: boolean;
  error: string | null;
  creating: boolean;
  loadDashboard(): Promise<void>;
  addWidget(type: WidgetDetail["type"]): Promise<void>;
  patchWidget(id: string, patch: PatchWidgetBody): Promise<void>;
  deleteWidget(widget: WidgetListItem): Promise<void>;
  dismissWidgetError(id: string): void;
  dismissError(): void;
}