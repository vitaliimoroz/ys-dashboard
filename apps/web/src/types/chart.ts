import type { WidgetDetail } from "@ys-dashboard/shared";
import type { ChartRow } from "./dashboard";

export type ChartDetail = WidgetDetail & {
  payload: Extract<WidgetDetail["payload"], { kind: "chart" }>;
};

export interface ChartComponentProps {
  detail: ChartDetail;
  rows: ChartRow[];
}
