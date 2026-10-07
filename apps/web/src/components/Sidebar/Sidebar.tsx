import { ChevronDown, Database, LayoutDashboard } from "lucide-react";
import { useDashboardContext } from "../../contexts/DashboardContext";
import type { ActiveView } from "../../types/dashboard";
import "./index.scss";

interface SidebarProps {
  activeView: ActiveView;
  onChangeView(view: ActiveView): void;
}

export function Sidebar({ activeView, onChangeView }: SidebarProps) {
  const { datasets, loading, error } = useDashboardContext();

  return (
    <aside className="sidebar">
      <a className="brand" href="#dashboard" onClick={() => onChangeView("dashboard")}>
        <span className="brand-mark" aria-hidden="true"><span /></span>
        <span>YouScan<span className="brand-sub">INSIGHTS</span></span>
      </a>
      <div className="workspace-switcher">
        <span className="workspace-avatar">YS</span>
        <span className="workspace-copy"><strong>Campaign workspace</strong><span>Analytics team</span></span>
        <ChevronDown size={15} />
      </div>
      <nav className="primary-nav" aria-label="Main navigation">
        <span className="nav-section-label">WORKSPACE</span>
        <button className={activeView === "dashboard" ? "nav-item is-active" : "nav-item"} type="button" onClick={() => onChangeView("dashboard")}><LayoutDashboard size={17} /> Overview</button>
        <button className={activeView === "datasets" ? "nav-item is-active" : "nav-item"} type="button" onClick={() => onChangeView("datasets")}><Database size={17} /> Datasets <span className="nav-count">{datasets.length}</span></button>
      </nav>
      <div className="sidebar-bottom">
        <div className="connection-status"><span className={loading ? "status-dot is-loading" : error ? "status-dot is-error" : "status-dot"} />{loading ? "Connecting" : error ? "Needs attention" : "Data connected"}</div>
        <div className="profile-row"><div className="profile-avatar">VM</div><div><strong>Workspace owner</strong><span>Dashboard admin</span></div><ChevronDown size={15} /></div>
      </div>
    </aside>
  );
}