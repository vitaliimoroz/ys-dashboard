import { useEffect, useState } from "react";
import type {
  DatasetSummary,
  PatchWidgetBody,
  WidgetDetail,
  WidgetListItem,
  WidgetType,
} from "@ys-dashboard/shared";
import { apiRequest } from "../utils/api";

export function useWidget(widgetId: string) {
  const [details, setDetails] = useState<WidgetDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  async function loadWidget() {
    setLoading(true);
    setError(null);
    try {
      const [widgetDetail] = await Promise.all([
        apiRequest<WidgetDetail>(`/api/widgets/${widgetId}`),
      ]);
      setDetails(widgetDetail);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load widget data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadWidget(); }, [widgetId]);

  async function patchWidget(patch: PatchWidgetBody) {
    setError(null);
    setBusy(true);
    try {
      const detail = await apiRequest<WidgetDetail>(`/api/widgets/${widgetId}`, { method: "PATCH", body: JSON.stringify(patch) });
      setDetails(detail);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update widget");
    } finally {
      setBusy(false);
    }
  }

  async function deleteWidget() {
    if (!window.confirm(`Delete "${details?.title}"?`)) return;
    setError(null);
    setBusy(true);
    try {
      await apiRequest<void>(`/api/widgets/${widgetId}`, { method: "DELETE" });
      setDetails(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete widget");
    } finally {
      setBusy(false);
    }
  }

  function dismissError() {
    setError(null);
  }

  return {
    details,
    error,
    busy,
    loading,
    loadWidget,
    patchWidget,
    deleteWidget,
    dismissError,
  };
}