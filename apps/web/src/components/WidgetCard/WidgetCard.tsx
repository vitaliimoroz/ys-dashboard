import { useEffect, useState } from "react";
import { Pencil, RefreshCw, Trash2, X } from "lucide-react";
import type {
  DatasetSummary,
  PatchWidgetBody,
  WidgetDetail,
  WidgetListItem,
} from "@ys-dashboard/shared";
import { DatasetSelector } from "../DatasetSelector";
import { WidgetChart } from "../WidgetChart";
import { useWidget } from "../../hooks/useWidget";
import "./index.scss";

interface WidgetCardProps {
  id: string;
  title: string;
  datasets: DatasetSummary[];
}

export function WidgetCard({ id, title, datasets }: WidgetCardProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);
  const [contentDraft, setContentDraft] = useState('');

  const { loading, details, busy, error, loadWidget, patchWidget, deleteWidget, dismissError } = useWidget(id);

  useEffect(() => {
    if (details) {
      const textContent = details.payload.kind === "text" ? details.payload.content : "";
      setTitleDraft(details.title);
      setContentDraft(textContent);
    }
  }, [details]);

  const saveTitle = () => {
    setEditingTitle(false);
    if (titleDraft.trim() && titleDraft.trim() !== details?.title) {
      patchWidget({ title: titleDraft.trim() });
    }
  };

  const onTextareaBlur = () => {
    const textContent = details?.payload?.kind === "text" ? details?.payload?.content : "";
    if (contentDraft !== textContent) {
      patchWidget({ content: contentDraft });
    }
  };

  const dataset = datasets.find((item) => item.id === details?.datasetId);

  return (loading || error || !details) ? (
    <article className="widget-card widget-load-card">
      <h2>{title}</h2>
      {error
        ? <div className="widget-error" role="alert"><span>{error}</span><button type="button" className="icon-button" aria-label={`Retry loading ${title}`} onClick={loadWidget}><RefreshCw size={13} /></button></div>
        : <div className="widget-status" role="status"><RefreshCw className="spin" size={13} /> Loading widget…</div>}
    </article>
  ) : (
    <article className={`widget-card widget-card--${details?.type}`}>
      <header className="widget-card__header">
        <div className="widget-title-wrap">
          {editingTitle ? (
            <input autoFocus className="widget-title-input" value={titleDraft} onChange={(event) => setTitleDraft(event.target.value)} onBlur={saveTitle} onKeyDown={(event) => {
              if (event.key === "Enter") saveTitle();
              if (event.key === "Escape") { setTitleDraft(details?.title); setEditingTitle(false); }
            }} aria-label="Widget title" />
          ) : <h2>{details?.title}</h2>}
        </div>
        <div className="widget-actions">
          <button className="icon-button" type="button" title="Edit title" aria-label={`Edit title for ${details?.title}`} onClick={() => setEditingTitle(true)}><Pencil size={15} /></button>
          <button className="icon-button icon-button--danger" type="button" title="Delete widget" aria-label={`Delete ${details?.title}`} onClick={deleteWidget}><Trash2 size={15} /></button>
        </div>
      </header>
      <div className="widget-card__source">
        {details.payload.kind === "chart" ? (
          <DatasetSelector detail={details} datasets={datasets} onPatch={patchWidget} />
        ) : <span><Pencil size={13} aria-hidden="true" /> Editable text</span>}
      </div>
      {busy && <div className="widget-status" role="status"><RefreshCw className="spin" size={13} /> Saving changes…</div>}
      {error && <div className="widget-error" role="alert"><span>{error}</span><button type="button" className="icon-button" aria-label={`Dismiss error for ${details?.title}`} onClick={dismissError}><X size={13} /></button></div>}
      {details.payload.kind === "text" ? (
        <div className="text-widget-content">
          <textarea aria-label={`Text content for ${details?.title}`} value={contentDraft} maxLength={20_000} placeholder="Write a note…" onChange={(event) => setContentDraft(event.target.value)} onBlur={onTextareaBlur} />
        </div>
      ) : <WidgetChart detail={details} />}
    </article>
  );
}