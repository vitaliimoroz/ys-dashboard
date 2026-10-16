import type { WidgetDetail } from "@ys-dashboard/shared";
import { chartRows } from "../../utils/chart";
import { BarChart } from "./BarChart";
import { LineChart } from "./LineChart";
import { PieChart } from "./PieChart";
import { StackedBarChart } from "./StackedBarChart";
import type { ChartDetail } from "../../types/chart";
import "./index.scss";

function isChartDetail(detail: WidgetDetail): detail is ChartDetail {
  return detail.payload.kind === "chart";
}

export function WidgetChart({ detail }: { detail: WidgetDetail }) {
  if (!isChartDetail(detail)) return null;
  const rows = chartRows(detail);

  if (!rows.length || !detail.payload.series.length) {
    return <div className="chart-empty">No rows are available for this chart.</div>;
  }

  switch (detail.type) {
    case "line":
      return <LineChart detail={detail} rows={rows} />;
    case "bar":
      return <BarChart detail={detail} rows={rows} />;
    case "stacked_bar":
      return <StackedBarChart detail={detail} rows={rows} />;
    case "pie":
      return <PieChart detail={detail} rows={rows} />;
    default:
      return null;
  }
}
