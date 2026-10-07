import {
  Activity,
  BarChart3,
  ChartNoAxesColumn,
  Pencil,
  TableProperties,
  type LucideIcon,
} from "lucide-react";
import type { WidgetType } from "@ys-dashboard/shared";

export const chartColors = ["#28796d", "#d85a48", "#c39136", "#617d8a", "#374c45"];

export const widgetChoices: { type: WidgetType; label: string; icon: LucideIcon }[] = [
  { type: "line", label: "Line chart", icon: Activity },
  { type: "bar", label: "Bar chart", icon: BarChart3 },
  { type: "stacked_bar", label: "Stacked bar", icon: ChartNoAxesColumn },
  { type: "pie", label: "Pie chart", icon: TableProperties },
  { type: "text", label: "Text block", icon: Pencil },
];