import { RefreshCw } from "lucide-react";
import type { WidgetListItem } from "@ys-dashboard/shared";
import { useDashboardContext } from "../../contexts/DashboardContext";
import { WidgetCard } from "../WidgetCard";
import "./index.scss";

export function WidgetGrid({ widgets }: { widgets: WidgetListItem[] }) {
  const { details, datasets, widgetBusy, widgetErrors, deleteWidget, patchWidget, dismissWidgetError, loadDashboard } = useDashboardContext();

  return (
    <section className="widget-grid" aria-label="Dashboard widgets">
      {widgets.map((widget) => {
        const detail = details[widget.id];
        if (detail) {
          return <WidgetCard key={widget.id} detail={detail} datasets={datasets} busy={widgetBusy[widget.id] ?? false} error={widgetErrors[widget.id] ?? null} onDismissError={() => dismissWidgetError(widget.id)} onPatch={patchWidget} onDelete={deleteWidget} />;
        }
        return (
          <article className="widget-card widget-load-card" key={widget.id}>
            <h2>{widget.title}</h2>
            {widgetErrors[widget.id]
              ? <div className="widget-error" role="alert"><span>{widgetErrors[widget.id]}</span><button type="button" className="icon-button" aria-label={`Retry loading ${widget.title}`} onClick={() => void loadDashboard()}><RefreshCw size={13} /></button></div>
              : <div className="widget-status" role="status"><RefreshCw className="spin" size={13} /> Loading widget…</div>}
          </article>
        );
      })}
    </section>
  );
}