import { useState } from "react";
import { useDashboardContext } from "../../contexts/DashboardContext";
import type { ActiveView } from "../../types/dashboard";
import { DatasetTable } from "../../components/DatasetTable";
import { EmptyDashboard } from "../../components/EmptyDashboard";
import { ErrorBanner } from "../../components/ErrorBanner";
import { PageHeading } from "../../components/PageHeading";
import { Sidebar } from "../../components/Sidebar";
import { TopBar } from "../../components/TopBar";
import { WidgetGrid } from "../../components/WidgetGrid";

import "./index.scss";

export function DashboardContainer() {
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { datasets, widgets, loading, error, addWidget, dismissError } = useDashboardContext();

  return (
    <div className={`app-shell${sidebarCollapsed ? " app-shell--sidebar-collapsed" : ""}`}>
      <Sidebar activeView={activeView} onChangeView={setActiveView} onCollapsedChange={setSidebarCollapsed} />
      <main className="main-area">
        <TopBar activeView={activeView} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((open) => !open)} onSelectWidget={(type) => { setMenuOpen(false); void addWidget(type); }} />
        <div className="page-content">
          <PageHeading activeView={activeView} datasetCount={datasets.length} />
          {error && <ErrorBanner message={error} onDismiss={dismissError} />}
          {activeView === "dashboard" ? (
            <>
              {loading ? (
                <div className="dashboard-loading-grid" aria-label="Loading dashboard"><div /><div /><div /></div>
              ) : widgets.length === 0 ? (
                <EmptyDashboard onAddWidget={() => setMenuOpen(true)} />
              ) : (
                <WidgetGrid widgets={widgets} />
              )}
            </>
          ) : <DatasetTable datasets={datasets} loading={loading} />}
        </div>
      </main>
    </div>
  );
}