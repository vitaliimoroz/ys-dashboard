import { BarChart3, Plus } from "lucide-react";
import "./index.scss";

export function EmptyDashboard({ onAddWidget }: { onAddWidget(): void }) {
  return (
    <section className="empty-state">
      <div className="empty-icon"><BarChart3 size={22} /></div>
      <h2>Your dashboard is ready for a first view</h2>
      <p>Choose a chart type to visualize campaign data.</p>
      <button className="primary-button" type="button" onClick={onAddWidget}><Plus size={17} /> Add your first widget</button>
    </section>
  );
}