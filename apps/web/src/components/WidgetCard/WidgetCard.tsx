import { useEffect, useState } from "react";
import { ChevronDown, Database, Pencil, RefreshCw, Trash2, X } from "lucide-react";
import type {
  DatasetSummary,
  PatchWidgetBody,
  WidgetDetail,
  WidgetListItem,
} from "@ys-dashboard/shared";
import { chartConfigFor } from "../../utils/chart";
import { WidgetChart } from "../WidgetChart";
import "./index.scss";

interface WidgetCardProps {
  detail: WidgetDetail;
  datasets: DatasetSummary[];
  busy: boolean;
  error: string | null;
  onDismissError(): void;
  onPatch(id: string, patch: PatchWidgetBody): Promise<void>;
  onDelete(widget: WidgetListItem): void;
}

export function WidgetCard({ detail, datasets, busy, error, onDismissError, onPatch, onDelete }: WidgetCardProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(detail.title);
  const textContent = detail.payload.kind === "text" ? detail.payload.content : "";
  const [contentDraft, setContentDraft] = useState(textContent);

  useEffect(() => {
    setTitleDraft(detail.title);
    setContentDraft(textContent);
  }, [detail, textContent]);

  const saveTitle = () => {
    setEditingTitle(false);
    if (titleDraft.trim() && titleDraft.trim() !== detail.title) {
      void onPatch(detail.id, { title: titleDraft.trim() });
    }
  };
  const dataset = datasets.find((item) => item.id === detail.datasetId);

  return (
    <article className={`widget-card widget-card--${detail.type}`}>
      <header className="widget-card__header">
        <div className="widget-title-wrap">
          {editingTitle ? (
            <input autoFocus className="widget-title-input" value={titleDraft} onChange={(event) => setTitleDraft(event.target.value)} onBlur={saveTitle} onKeyDown={(event) => {
              if (event.key === "Enter") saveTitle();
              if (event.key === "Escape") { setTitleDraft(detail.title); setEditingTitle(false); }
            }} aria-label="Widget title" />
          ) : <h2>{detail.title}</h2>}
          <span className="widget-type-label">{detail.type.replaceAll("_", " ")}</span>
        </div>
        <div className="widget-actions">
          <button className="icon-button" type="button" title="Edit title" aria-label={`Edit title for ${detail.title}`} onClick={() => setEditingTitle(true)}><Pencil size={15} /></button>
          <button className="icon-button icon-button--danger" type="button" title="Delete widget" aria-label={`Delete ${detail.title}`} onClick={() => onDelete(detail)}><Trash2 size={15} /></button>
        </div>
      </header>
      <div className="widget-card__source">
        {detail.payload.kind === "chart" ? (
          <label>
            <Database size={13} aria-hidden="true" />
            <select aria-label={`Dataset for ${detail.title}`} value={detail.datasetId ?? ""} onChange={(event) => {
              const selected = datasets.find((item) => item.id === event.target.value);
              void onPatch(detail.id, { datasetId: selected?.id ?? null, chartConfig: selected ? chartConfigFor(detail.type, selected.columns) : {} });
            }}>
              <option value="">No dataset</option>
              {datasets.map((item) => <option key={item.id} value={item.id}>{item.name}{item.sheetName ? ` · ${item.sheetName}` : ""}</option>)}
            </select>
            <ChevronDown size={13} aria-hidden="true" />
          </label>
        ) : <span><Pencil size={13} aria-hidden="true" /> Editable text</span>}
        {dataset && <span className="row-count">{dataset.rowCount.toLocaleString()} rows</span>}
      </div>
      {busy && <div className="widget-status" role="status"><RefreshCw className="spin" size={13} /> Saving changes…</div>}
      {error && <div className="widget-error" role="alert"><span>{error}</span><button type="button" className="icon-button" aria-label={`Dismiss error for ${detail.title}`} onClick={onDismissError}><X size={13} /></button></div>}
      {detail.payload.kind === "text" ? (
        <div className="text-widget-content">
          <textarea aria-label={`Text content for ${detail.title}`} value={contentDraft} maxLength={20_000} placeholder="Write a note…" onChange={(event) => setContentDraft(event.target.value)} onBlur={() => {
            if (contentDraft !== textContent) void onPatch(detail.id, { content: contentDraft });
          }} />
        </div>
      ) : <WidgetChart detail={detail} />}
    </article>
  );
}