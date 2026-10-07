import { X } from "lucide-react";
import "./index.scss";

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss(): void }) {
  return (
    <div className="error-banner" role="alert">
      <span>{message}</span>
      <button type="button" className="icon-button" aria-label="Dismiss error" onClick={onDismiss}><X size={15} /></button>
    </div>
  );
}