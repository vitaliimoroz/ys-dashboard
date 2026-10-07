import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WidgetDetail } from "@ys-dashboard/shared";
import { chartColors, chartRows, chartTooltipStyle, formatAxisDate, formatTooltipDate } from "../../utils/chart";
import "./index.scss";

export function WidgetChart({ detail }: { detail: WidgetDetail }) {
  if (detail.payload.kind !== "chart") return null;
  const { payload } = detail;
  const rows = chartRows(detail);
  const series = payload.series;

  if (!rows.length || !series.length) {
    return <div className="chart-empty">No rows are available for this chart.</div>;
  }

  if (detail.type === "pie") {
    const valueKey = detail.chartConfig?.valueKey ?? detail.chartConfig?.yKey ?? series[0]?.key;
    if (!valueKey) return <div className="chart-empty">Choose a value column.</div>;
    return (
      <div className="chart-area chart-area--pie">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip contentStyle={chartTooltipStyle} />
            <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
            <Pie data={rows} dataKey={valueKey} nameKey={payload.xKey} innerRadius={54} outerRadius={88} paddingAngle={3}>
              {rows.map((row, index) => (
                <Cell key={String(row[payload.xKey] ?? index)} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="chart-area">
      <ResponsiveContainer width="100%" height="100%">
        {detail.type === "line" ? (
          <LineChart data={rows} margin={{ top: 8, right: 10, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#e9eeea" vertical={false} />
            <XAxis dataKey={payload.xKey} axisLine={false} tickLine={false} tick={{ fill: "#78827d", fontSize: 11 }} tickFormatter={formatAxisDate} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#78827d", fontSize: 11 }} />
            <Tooltip contentStyle={chartTooltipStyle} labelFormatter={formatTooltipDate} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            {series.map((item, index) => (
              <Line key={item.key} type="monotone" dataKey={item.key} name={item.label} stroke={chartColors[index % chartColors.length]} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            ))}
          </LineChart>
        ) : (
          <BarChart data={rows} margin={{ top: 8, right: 10, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#e9eeea" vertical={false} />
            <XAxis dataKey={payload.xKey} axisLine={false} tickLine={false} tick={{ fill: "#78827d", fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#78827d", fontSize: 11 }} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            {series.map((item, index) => (
              <Bar key={item.key} dataKey={item.key} name={item.label} fill={chartColors[index % chartColors.length]} radius={[3, 3, 0, 0]} stackId={detail.type === "stacked_bar" ? "stack" : undefined} />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}