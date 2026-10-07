import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  ChartNoAxesColumn,
  ChevronDown,
  Database,
  LayoutDashboard,
  Pencil,
  Plus,
  RefreshCw,
  TableProperties,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  ChartConfig,
  DatasetSummary,
  PatchWidgetBody,
  WidgetDetail,
  WidgetListItem,
  WidgetType,
} from "@ys-dashboard/shared";

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const chartColors = ["#28796d", "#d85a48", "#c39136", "#617d8a", "#374c45"];
const axisDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});
const tooltipDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function parseChartDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatAxisDate(value: unknown): string {
  const date = parseChartDate(value);
  if (!date) return String(value ?? "");
  const parts = axisDateFormatter.formatToParts(date);
  const month = parts.find((part) => part.type === "month")?.value;
  const year = parts.find((part) => part.type === "year")?.value;
  return month && year ? `${month} '${year}` : axisDateFormatter.format(date);
}

function formatTooltipDate(value: unknown): string {
  const date = parseChartDate(value);
  return date ? tooltipDateFormatter.format(date) : String(value ?? "");
}

const widgetChoices: { type: WidgetType; label: string; icon: LucideIcon }[] = [
  { type: "line", label: "Line chart", icon: Activity },
  { type: "bar", label: "Bar chart", icon: BarChart3 },
  { type: "stacked_bar", label: "Stacked bar", icon: ChartNoAxesColumn },
  { type: "pie", label: "Pie chart", icon: TableProperties },
  { type: "text", label: "Text block", icon: Pencil },
];

type ChartRow = Record<string, string | number | null>;

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (response.status === 204) return undefined as T;

  const result = (await response.json().catch(() => null)) as { error?: string } | T | null;
  if (!response.ok) {
    const message = result && typeof result === "object" && "error" in result ? result.error : undefined;
    throw new Error(message || `Request failed (${response.status})`);
  }
  return result as T;
}

function suggestedDataset(type: WidgetType, datasets: DatasetSummary[]) {
  const sheetMatch = datasets.find((dataset) => {
    const sheetName = (dataset.sheetName ?? "").toLowerCase();
    if (type === "pie") return sheetName.includes("pie");
    if (type === "stacked_bar") return sheetName.includes("stack") || sheetName.includes("bar");
    if (type === "line") return sheetName.includes("line");
    return false;
  });
  if (sheetMatch) return sheetMatch;

  const match = datasets.find((dataset) => {
    const label = dataset.name.toLowerCase();
    if (type === "pie") return label.includes("pie");
    if (type === "stacked_bar") return label.includes("stack") || label.includes("bar");
    if (type === "line") return label.includes("line");
    return false;
  });
  return match ?? datasets[0];
}

function chartConfigFor(type: WidgetType, columns: string[]): ChartConfig {
  const normalize = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const find = (names: string[]) => columns.find((column) => names.includes(normalize(column)));
  const categoryKey = find(["campaign", "brand", "category", "name", "label", "date"]) ?? columns[0];
  const dateKey = find(["date", "day", "month", "time", "timestamp"]);
  const campaignKey = find(["campaign"]);
  const numericColumns = columns.filter((column) =>
    ["result", "value", "amount", "count", "total", "positive", "neutral", "negative", "organic", "direct"].includes(normalize(column)),
  );
  const valueKey = find(["result", "value", "amount", "count", "total"]) ?? numericColumns[0];

  if (type === "pie") return { categoryKey, valueKey };
  if (type === "line" && dateKey && campaignKey && dateKey !== campaignKey) {
    return { xKey: dateKey, yKey: valueKey, seriesKey: campaignKey };
  }
  if (type === "stacked_bar") {
    return { xKey: categoryKey, stackKeys: numericColumns.length > 1 ? numericColumns : valueKey ? [valueKey] : [] };
  }
  return { xKey: categoryKey, ...(valueKey ? { yKey: valueKey } : {}) };
}

function chartRows(detail: WidgetDetail): ChartRow[] {
  if (detail.payload.kind !== "chart") return [];
  const points = detail.payload.points as ChartRow[];
  const seriesKey = detail.chartConfig?.seriesKey;
  const valueKey = detail.chartConfig?.yKey ?? detail.chartConfig?.valueKey;
  if (!seriesKey || !valueKey) return points;

  const grouped = new Map<string, ChartRow>();
  for (const point of points) {
    const category = String(point[detail.payload.xKey] ?? "");
    const series = String(point[seriesKey] ?? "");
    const existing = grouped.get(category) ?? { [detail.payload.xKey]: point[detail.payload.xKey] };
    existing[series] = point[valueKey];
    grouped.set(category, existing);
  }
  return [...grouped.values()];
}

function WidgetChart({ detail }: { detail: WidgetDetail }) {
  if (detail.payload.kind !== "chart") return null;
  const { payload } = detail;
  const rows = chartRows(detail);
  const series = payload.series;
  const tooltipStyle = {
    border: "1px solid #dce3dd",
    borderRadius: 6,
    fontSize: 12,
    boxShadow: "0 8px 24px rgba(24, 42, 35, 0.08)",
  };

  if (!rows.length || !series.length) return <div className="chart-empty">No rows are available for this chart.</div>;

  if (detail.type === "pie") {
    const valueKey = detail.chartConfig?.valueKey ?? detail.chartConfig?.yKey ?? series[0]?.key;
    if (!valueKey) return <div className="chart-empty">Choose a value column.</div>;
    return (
      <div className="chart-area chart-area--pie">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
            <Pie data={rows} dataKey={valueKey} nameKey={payload.xKey} innerRadius={54} outerRadius={88} paddingAngle={3}>
              {rows.map((row, index) => (
                <Cell key={String(row[payload.xKey] ?? index)} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="chart-area">
      <ResponsiveContainer width="100%" height="100%">
        {detail.type === "line" ? (
          <LineChart data={rows} margin={{ top: 8, right: 10, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#e9eeea" vertical={false} />
            <XAxis dataKey={payload.xKey} axisLine={false} tickLine={false} tick={{ fill: "#78827d", fontSize: 11 }} tickFormatter={formatAxisDate} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#78827d", fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={formatTooltipDate} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            {series.map((item, index) => (
              <Line key={item.key} type="monotone" dataKey={item.key} name={item.label} stroke={chartColors[index % chartColors.length]} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            ))}
          </LineChart>
        ) : (
          <BarChart data={rows} margin={{ top: 8, right: 10, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#e9eeea" vertical={false} />
            <XAxis dataKey={payload.xKey} axisLine={false} tickLine={false} tick={{ fill: "#78827d", fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#78827d", fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            {series.map((item, index) => (
              <Bar key={item.key} dataKey={item.key} name={item.label} fill={chartColors[index % chartColors.length]} radius={[3, 3, 0, 0]} stackId={detail.type === "stacked_bar" ? "stack" : undefined} />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

interface WidgetCardProps {
  detail: WidgetDetail;
  datasets: DatasetSummary[];
  onPatch: (id: string, patch: PatchWidgetBody) => Promise<void>;
  onDelete: (widget: WidgetListItem) => void;
}

function WidgetCard({ detail, datasets, onPatch, onDelete }: WidgetCardProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(detail.title);
  const textContent = detail.payload.kind === "text" ? detail.payload.content : "";
  const [contentDraft, setContentDraft] = useState(textContent);

  useEffect(() => {
    setTitleDraft(detail.title);
    setContentDraft(textContent);
  }, [detail]);

  const saveTitle = () => {
    setEditingTitle(false);
    if (titleDraft.trim() && titleDraft.trim() !== detail.title) void onPatch(detail.id, { title: titleDraft.trim() });
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

export function App() {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [widgets, setWidgets] = useState<WidgetListItem[]>([]);
  const [details, setDetails] = useState<Record<string, WidgetDetail>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeView, setActiveView] = useState<"dashboard" | "datasets">("dashboard");

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const [datasetList, widgetList] = await Promise.all([
        apiRequest<DatasetSummary[]>("/api/datasets"),
        apiRequest<WidgetListItem[]>("/api/widgets"),
      ]);
      const widgetDetails = await Promise.all(widgetList.map((widget) => apiRequest<WidgetDetail>(`/api/widgets/${widget.id}`)));
      setDatasets(datasetList);
      setWidgets(widgetList.sort((left, right) => left.position - right.position));
      setDetails(Object.fromEntries(widgetDetails.map((detail) => [detail.id, detail])));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadDashboard(); }, []);

  async function addWidget(type: WidgetType) {
    setCreating(true);
    setMenuOpen(false);
    setError(null);
    try {
      const dataset = type === "text" ? undefined : suggestedDataset(type, datasets);
      const detail = await apiRequest<WidgetDetail>("/api/widgets", {
        method: "POST",
        body: JSON.stringify({ type, ...(dataset ? { datasetId: dataset.id } : {}) }),
      });
      setWidgets((current) => [...current, detail].sort((left, right) => left.position - right.position));
      setDetails((current) => ({ ...current, [detail.id]: detail }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create widget");
    } finally {
      setCreating(false);
    }
  }

  async function patchWidget(id: string, patch: PatchWidgetBody) {
    try {
      const detail = await apiRequest<WidgetDetail>(`/api/widgets/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      setDetails((current) => ({ ...current, [id]: detail }));
      setWidgets((current) => current.map((widget) => widget.id === id ? { ...widget, title: detail.title } : widget));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update widget");
    }
  }

  async function deleteWidget(widget: WidgetListItem) {
    if (!window.confirm(`Delete "${widget.title}"?`)) return;
    try {
      await apiRequest<void>(`/api/widgets/${widget.id}`, { method: "DELETE" });
      setWidgets((current) => current.filter((item) => item.id !== widget.id));
      setDetails((current) => { const next = { ...current }; delete next[widget.id]; return next; });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete widget");
    }
  }

  const totalRows = datasets.reduce((sum, dataset) => sum + dataset.rowCount, 0);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard" onClick={() => setActiveView("dashboard")}>
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>YouScan<span className="brand-sub">INSIGHTS</span></span>
        </a>
        <div className="workspace-switcher">
          <div className="workspace-avatar">YS</div>
          <div><strong>Campaign workspace</strong><span>Analytics team</span></div>
          <ChevronDown size={15} />
        </div>
        <nav className="primary-nav" aria-label="Main navigation">
          <span className="nav-section-label">WORKSPACE</span>
          <button className={activeView === "dashboard" ? "nav-item is-active" : "nav-item"} type="button" onClick={() => setActiveView("dashboard")}><LayoutDashboard size={17} /> Overview</button>
          <button className={activeView === "datasets" ? "nav-item is-active" : "nav-item"} type="button" onClick={() => setActiveView("datasets")}><Database size={17} /> Datasets <span className="nav-count">{datasets.length}</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="connection-status"><span className={loading ? "status-dot is-loading" : error ? "status-dot is-error" : "status-dot"} />{loading ? "Connecting" : error ? "Needs attention" : "Data connected"}</div>
          <div className="profile-row"><div className="profile-avatar">VM</div><div><strong>Workspace owner</strong><span>Dashboard admin</span></div><ChevronDown size={15} /></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-separator">/</span><strong>{activeView === "dashboard" ? "Overview" : "Datasets"}</strong></div>
          <div className="topbar-actions">
            <span className="updated-label">{loading ? "Syncing data" : "Live data"}</span>
            <button className="icon-button" type="button" title="Refresh data" aria-label="Refresh data" onClick={() => void loadDashboard()}><RefreshCw size={16} /></button>
            {activeView === "dashboard" && (
              <div className="add-widget-wrap">
                <button className="primary-button" type="button" onClick={() => setMenuOpen((value) => !value)} disabled={creating}>
                  {creating ? <RefreshCw className="spin" size={16} /> : <Plus size={17} />}<span>New widget</span><ChevronDown size={14} />
                </button>
                {menuOpen && <div className="widget-menu" role="menu" aria-label="Choose widget type">
                  {widgetChoices.map(({ type, label, icon: Icon }) => <button key={type} type="button" role="menuitem" onClick={() => void addWidget(type)}><Icon size={17} /><span>{label}</span></button>)}
                </div>}
              </div>
            )}
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div><div className="eyebrow">CAMPAIGN ANALYTICS</div><h1>{activeView === "dashboard" ? "Performance overview" : "Data library"}</h1><p>{activeView === "dashboard" ? "Explore results across your imported campaign data." : "Imported source files and worksheet dimensions."}</p></div>
            <div className="period-label"><span className="period-mark" />{datasets.length} source tables</div>
          </div>

          {error && <div className="error-banner" role="alert"><span>{error}</span><button type="button" className="icon-button" aria-label="Dismiss error" onClick={() => setError(null)}><X size={15} /></button></div>}

          {activeView === "dashboard" ? <>
            <section className="metric-grid" aria-label="Dataset summary">
              <div className="metric-card"><span className="metric-label">IMPORTED TABLES</span><strong>{loading ? "—" : datasets.length}</strong><span className="metric-foot"><Database size={14} /> Source sheets and files</span></div>
              <div className="metric-card metric-card--accent"><span className="metric-label">AVAILABLE ROWS</span><strong>{loading ? "—" : totalRows.toLocaleString()}</strong><span className="metric-foot"><TableProperties size={14} /> Parsed data rows</span></div>
              <div className="metric-card"><span className="metric-label">DASHBOARD WIDGETS</span><strong>{loading ? "—" : widgets.length}</strong><span className="metric-foot"><BarChart3 size={14} /> Charts and notes</span></div>
            </section>

            {loading ? <div className="loading-grid" aria-label="Loading dashboard"><div /><div /><div /></div> : widgets.length === 0 ? (
              <section className="empty-state"><div className="empty-icon"><BarChart3 size={22} /></div><h2>Your dashboard is ready for a first view</h2><p>Choose a chart type to visualize the imported campaign sheets.</p><button className="primary-button" type="button" onClick={() => setMenuOpen(true)}><Plus size={17} /> Add your first widget</button></section>
            ) : (
              <section className="widget-grid" aria-label="Dashboard widgets">
                {widgets.map((widget) => {
                  const detail = details[widget.id];
                  return detail ? <WidgetCard key={widget.id} detail={detail} datasets={datasets} onPatch={patchWidget} onDelete={deleteWidget} /> : <div className="widget-skeleton" key={widget.id} />;
                })}
              </section>
            )}
            <footer className="page-footnote"><span className="footnote-line" />Data loaded from parsed campaign sources</footer>
          </> : (
            <section className="dataset-table-wrap">
              <table className="dataset-table">
                <thead><tr><th>Dataset</th><th>Source file</th><th>Format</th><th>Columns</th><th className="numeric-cell">Rows</th></tr></thead>
                <tbody>
                  {datasets.map((dataset) => <tr key={dataset.id}><td><strong>{dataset.name}</strong><span className="table-secondary">{dataset.sheetName ?? "Single table"}</span></td><td>{dataset.sourceFilename}</td><td><span className="format-tag">{dataset.sourceKind.toUpperCase()}</span></td><td><div className="column-tags">{dataset.columns.map((column) => <span key={column}>{column}</span>)}</div></td><td className="numeric-cell">{dataset.rowCount.toLocaleString()}</td></tr>)}
                  {!loading && datasets.length === 0 && <tr><td colSpan={5} className="table-empty">No datasets imported yet.</td></tr>}
                </tbody>
              </table>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
