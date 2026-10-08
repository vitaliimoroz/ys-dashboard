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
      setDatasets(datasetList);
      setWidgets(widgetList.sort((left, right) => left.position - right.position));
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
      try {
        setDatasets(await apiRequest<DatasetSummary[]>("/api/datasets"));
      } catch (cause) {
        setError(cause instanceof Error ? `Chart created, but its data source list did not refresh: ${cause.message}` : "Chart created, but its data source list did not refresh");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create widget");
    } finally {
      setCreating(false);
    }
  }

  function removeWidget(widgetId: string) {
    setWidgets((current) => current.filter((widget) => widget.id !== widgetId));
  }

  function dismissError() {
    setError(null);
  }

  return {
    datasets,
    widgets,
    loading,
    error,
    creating,
    loadDashboard,
    addWidget,
    removeWidget,
    dismissError,
  };
}