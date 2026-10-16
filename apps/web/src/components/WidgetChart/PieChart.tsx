import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { chartColors, chartTooltipStyle } from "../../utils/chart";
import type { ChartComponentProps } from "../../types/chart";

export function PieChart({ detail, rows }: ChartComponentProps) {
  const valueKey = detail.chartConfig?.valueKey ?? detail.chartConfig?.yKey ?? detail.payload.series[0]?.key;
  if (!valueKey) return <div className="chart-empty">Choose a value column.</div>;

  return (
    <div className="chart-area chart-area--pie">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Tooltip contentStyle={chartTooltipStyle} />
          <Legend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            iconType="circle"
            wrapperStyle={{ maxHeight: 230, overflowY: "auto", overflowX: "hidden", fontSize: 11 }}
          />
          <Pie data={rows} dataKey={valueKey} nameKey={detail.payload.xKey} innerRadius={54} outerRadius={88} paddingAngle={3}>
            {rows.map((row, index) => (
              <Cell key={String(row[detail.payload.xKey] ?? index)} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
