import { ChevronLeft, ChevronRight, Database, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useDashboardContext } from "../../contexts/DashboardContext";
import type { ActiveView } from "../../types/dashboard";
import "./index.scss";

interface SidebarProps {
  activeView: ActiveView;
  onChangeView(view: ActiveView): void;
  onCollapsedChange(collapsed: boolean): void;
}

export function Sidebar({ activeView, onChangeView, onCollapsedChange }: SidebarProps) {
  const { datasets, loading, error } = useDashboardContext();
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    const nextCollapsed = !collapsed;
    setCollapsed(nextCollapsed);
    onCollapsedChange(nextCollapsed);
  };

  return (
    <aside className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
      <a className="brand" href="#dashboard" onClick={() => onChangeView("dashboard")}>
        <span className="brand-mark" aria-hidden="true"><span /></span>
        <span>IScan<span className="brand-sub">INSIGHTS</span></span>
      </a>
      <button
        className="sidebar-collapse-button"
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
      </button>
      <nav className="primary-nav" aria-label="Main navigation">
        <span className="nav-section-label">WORKSPACE</span>
        <button className={activeView === "dashboard" ? "nav-item is-active" : "nav-item"} type="button" onClick={() => onChangeView("dashboard")} title={collapsed ? "Overview" : undefined}>
          <LayoutDashboard size={17} /><span className="nav-item-label">Overview</span>
        </button>
        <button className={activeView === "datasets" ? "nav-item is-active" : "nav-item"} type="button" onClick={() => onChangeView("datasets")} title={collapsed ? "Datasets" : undefined}>
          <Database size={17} /><span className="nav-item-label">Datasets</span><span className="nav-count">{datasets.length}</span>
        </button>
      </nav>
    </aside>
  );
}