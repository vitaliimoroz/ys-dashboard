import { BarChart3, Database, TableProperties } from "lucide-react";
import type { DatasetSummary, WidgetListItem } from "@ys-dashboard/shared";
import "./index.scss";

interface MetricGridProps {
  datasets: DatasetSummary[];
  widgets: WidgetListItem[];
  loading: boolean;
}

export function MetricGrid({ datasets, widgets, loading }: MetricGridProps) {
  const totalRows = datasets.reduce((sum, dataset) => sum + dataset.rowCount, 0);
  return (
    <section className="metric-grid" aria-label="Dataset summary">
      <div className="metric-card"><span className="metric-label">IMPORTED TABLES</span><strong>{loading ? "—" : datasets.length}</strong><span className="metric-foot"><Database size={14} /> Source sheets and files</span></div>
      <div className="metric-card metric-card--accent"><span className="metric-label">AVAILABLE ROWS</span><strong>{loading ? "—" : totalRows.toLocaleString()}</strong><span className="metric-foot"><TableProperties size={14} /> Parsed data rows</span></div>
      <div className="metric-card"><span className="metric-label">DASHBOARD WIDGETS</span><strong>{loading ? "—" : widgets.length}</strong><span className="metric-foot"><BarChart3 size={14} /> Charts and notes</span></div>
    </section>
  );
}