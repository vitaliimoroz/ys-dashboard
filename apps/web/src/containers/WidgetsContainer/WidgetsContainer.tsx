import { RefreshCw } from "lucide-react";
import type { WidgetListItem } from "@ys-dashboard/shared";
import { WidgetCard } from "../../components/WidgetCard";
import { useDashboardContext } from "../../contexts/DashboardContext";
import "./index.scss";

export function WidgetsContainer({ widgets }: { widgets: WidgetListItem[] }) {
  const { datasets, loadDashboard } = useDashboardContext();

  return (
    <section className="widget-grid" aria-label="Dashboard widgets">
      {widgets.map((widget) => <WidgetCard key={widget.id} id={widget.id} title={widget.title} datasets={datasets} />)}
    </section>
  );
}