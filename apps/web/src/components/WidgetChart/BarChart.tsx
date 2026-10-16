import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartColors, chartTooltipStyle } from "../../utils/chart";
import type { ChartComponentProps } from "../../types/chart";

export function BarChart({ detail, rows }: ChartComponentProps) {
  return (
    <div className="chart-area">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={rows} margin={{ top: 8, right: 10, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="#e9eeea" vertical={false} />
          <XAxis dataKey={detail.payload.xKey} axisLine={false} tickLine={false} tick={{ fill: "#78827d", fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#78827d", fontSize: 11 }} />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11, maxHeight: 48, overflowY: "auto", overflowX: "hidden" }} />
          {detail.payload.series.map((item, index) => (
            <Bar key={item.key} dataKey={item.key} name={item.label} fill={chartColors[index % chartColors.length]} radius={[3, 3, 0, 0]} />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
