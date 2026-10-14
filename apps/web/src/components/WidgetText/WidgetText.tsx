import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./index.scss";

interface WidgetTextProps {
  title: string;
  content: string;
  onSave(content: string): void;
}

export function WidgetText({ title, content, onSave }: WidgetTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  useEffect(() => {
    setDraft(content);
  }, [content]);

  const saveDraft = () => {
    if (draft !== content) onSave(draft);
  };

  return (
    <div className="text-widget-content">
      <div className="text-widget-tabs" role="group" aria-label="Text content view">
        <button type="button" aria-pressed={editing} onClick={() => setEditing(true)}>Edit</button>
        <button type="button" aria-pressed={!editing} onClick={() => setEditing(false)}>Preview</button>
      </div>
      {editing ? (
        <textarea
          aria-label={`Text content for ${title}`}
          value={draft}
          maxLength={20_000}
          placeholder="Write a note…"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={saveDraft}
        />
      ) : (
        <div className="text-widget-preview" aria-label={`Text preview for ${title}`}>
          {draft
            ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft}</ReactMarkdown>
            : <p className="text-widget-preview__empty">No content yet. Select Edit to add a note.</p>}
        </div>
      )}
    </div>
  );
}
