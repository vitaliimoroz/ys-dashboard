import { ChevronDown, Plus, RefreshCw } from "lucide-react";
import { widgetChoices } from "../../constants/dashboard";
import { useDashboardContext } from "../../contexts/DashboardContext";
import type { ActiveView } from "../../types/dashboard";
import type { WidgetType } from "@ys-dashboard/shared";
import "./index.scss";

interface TopBarProps {
  activeView: ActiveView;
  menuOpen: boolean;
  onToggleMenu(): void;
  onSelectWidget(type: WidgetType): void;
}

export function TopBar({ activeView, menuOpen, onToggleMenu, onSelectWidget }: TopBarProps) {
  const { loading, creating, loadDashboard } = useDashboardContext();

  return (
    <header className="topbar">
      <div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-separator">/</span><strong>{activeView === "dashboard" ? "Overview" : "Datasets"}</strong></div>
      <div className="topbar-actions">
        <span className="updated-label">{loading ? "Syncing data" : "Live data"}</span>
        <button className="icon-button" type="button" title="Refresh data" aria-label="Refresh data" onClick={() => void loadDashboard()}><RefreshCw size={16} /></button>
        {activeView === "dashboard" && (
          <div className="add-widget-wrap">
            <button className="primary-button" type="button" onClick={onToggleMenu} disabled={creating}>
              {creating ? <RefreshCw className="spin" size={16} /> : <Plus size={17} />}<span>New widget</span><ChevronDown size={14} />
            </button>
            {menuOpen && <div className="widget-menu" role="menu" aria-label="Choose widget type">
              {widgetChoices.map(({ type, label, icon: Icon }) => <button key={type} type="button" role="menuitem" onClick={() => onSelectWidget(type)}><Icon size={17} /><span>{label}</span></button>)}
            </div>}
          </div>
        )}
      </div>
    </header>
  );
}