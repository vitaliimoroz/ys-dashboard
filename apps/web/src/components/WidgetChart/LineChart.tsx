import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartColors, chartTooltipStyle, formatAxisDate, formatTooltipDate } from "../../utils/chart";
import type { ChartComponentProps } from "../../types/chart";

export function LineChart({ detail, rows }: ChartComponentProps) {
  return (
    <div className="chart-area">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={rows} margin={{ top: 8, right: 10, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="#e9eeea" vertical={false} />
          <XAxis dataKey={detail.payload.xKey} axisLine={false} tickLine={false} tick={{ fill: "#78827d", fontSize: 11 }} tickFormatter={formatAxisDate} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#78827d", fontSize: 11 }} />
          <Tooltip contentStyle={chartTooltipStyle} labelFormatter={formatTooltipDate} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11, maxHeight: 48, overflowY: "auto", overflowX: "hidden" }} />
          {detail.payload.series.map((item, index) => (
            <Line key={item.key} type="monotone" dataKey={item.key} name={item.label} stroke={chartColors[index % chartColors.length]} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
