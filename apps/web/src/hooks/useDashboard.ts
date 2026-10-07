import { useEffect, useState } from "react";
import type {
  DatasetSummary,
  PatchWidgetBody,
  WidgetDetail,
  WidgetListItem,
  WidgetType,
} from "@ys-dashboard/shared";
import type { DashboardContextValue } from "../types/dashboard";
import { apiRequest } from "../utils/api";

export function useDashboard(): DashboardContextValue {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [widgets, setWidgets] = useState<WidgetListItem[]>([]);
  const [details, setDetails] = useState<Record<string, WidgetDetail>>({});
  const [widgetErrors, setWidgetErrors] = useState<Record<string, string>>({});
  const [widgetBusy, setWidgetBusy] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const [datasetList, widgetList] = await Promise.all([
        apiRequest<DatasetSummary[]>("/api/datasets"),
        apiRequest<WidgetListItem[]>("/api/widgets"),
      ]);
      const widgetResults = await Promise.allSettled(
        widgetList.map((widget) => apiRequest<WidgetDetail>(`/api/widgets/${widget.id}`)),
      );
      const loadedDetails: Record<string, WidgetDetail> = {};
      const detailErrors: Record<string, string> = {};
      widgetResults.forEach((result, index) => {
        const widget = widgetList[index];
        if (!widget) return;
        if (result.status === "fulfilled") loadedDetails[widget.id] = result.value;
        else detailErrors[widget.id] = result.reason instanceof Error ? result.reason.message : "Unable to load this widget";
      });
      setDatasets(datasetList);
      setWidgets(widgetList.sort((left, right) => left.position - right.position));
      setDetails(loadedDetails);
      setWidgetErrors(detailErrors);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadDashboard(); }, []);

  async function addWidget(type: WidgetType) {
    setCreating(true);
    setError(null);
    try {
      const detail = await apiRequest<WidgetDetail>("/api/widgets", {
        method: "POST",
        body: JSON.stringify({ type }),
      });
      setWidgets((current) => [...current, detail].sort((left, right) => left.position - right.position));
      setDetails((current) => ({ ...current, [detail.id]: detail }));
      try {
        setDatasets(await apiRequest<DatasetSummary[]>("/api/datasets"));
      } catch (cause) {
        setWidgetErrors((current) => ({
          ...current,
          [detail.id]: cause instanceof Error ? `Chart created, but its data source list did not refresh: ${cause.message}` : "Chart created, but its data source list did not refresh",
        }));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create widget");
    } finally {
      setCreating(false);
    }
  }

  async function patchWidget(id: string, patch: PatchWidgetBody) {
    setWidgetErrors((current) => { const next = { ...current }; delete next[id]; return next; });
    setWidgetBusy((current) => ({ ...current, [id]: true }));
    try {
      const detail = await apiRequest<WidgetDetail>(`/api/widgets/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      setDetails((current) => ({ ...current, [id]: detail }));
      setWidgets((current) => current.map((widget) => widget.id === id ? { ...widget, title: detail.title } : widget));
    } catch (cause) {
      setWidgetErrors((current) => ({ ...current, [id]: cause instanceof Error ? cause.message : "Unable to update widget" }));
    } finally {
      setWidgetBusy((current) => ({ ...current, [id]: false }));
    }
  }

  async function deleteWidget(widget: WidgetListItem) {
    if (!window.confirm(`Delete "${widget.title}"?`)) return;
    setWidgetErrors((current) => { const next = { ...current }; delete next[widget.id]; return next; });
    setWidgetBusy((current) => ({ ...current, [widget.id]: true }));
    try {
      await apiRequest<void>(`/api/widgets/${widget.id}`, { method: "DELETE" });
      setWidgets((current) => current.filter((item) => item.id !== widget.id));
      setDetails((current) => { const next = { ...current }; delete next[widget.id]; return next; });
    } catch (cause) {
      setWidgetErrors((current) => ({ ...current, [widget.id]: cause instanceof Error ? cause.message : "Unable to delete widget" }));
    } finally {
      setWidgetBusy((current) => ({ ...current, [widget.id]: false }));
    }
  }

  function dismissWidgetError(id: string) {
    setWidgetErrors((current) => { const next = { ...current }; delete next[id]; return next; });
  }

  function dismissError() {
    setError(null);
  }

  return {
    datasets,
    widgets,
    details,
    widgetErrors,
    widgetBusy,
    loading,
    error,
    creating,
    loadDashboard,
    addWidget,
    patchWidget,
    deleteWidget,
    dismissWidgetError,
    dismissError,
  };
}