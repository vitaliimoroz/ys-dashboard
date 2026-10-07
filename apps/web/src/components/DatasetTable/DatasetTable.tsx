import type { DatasetSummary } from "@ys-dashboard/shared";
import "./index.scss";

export function DatasetTable({ datasets, loading }: { datasets: DatasetSummary[]; loading: boolean }) {
  return (
    <section className="dataset-table-wrap">
      <table className="dataset-table">
        <thead><tr><th>Dataset</th><th>Source file</th><th>Format</th><th>Columns</th><th className="numeric-cell">Rows</th></tr></thead>
        <tbody>
          {datasets.map((dataset) => (
            <tr key={dataset.id}>
              <td><strong>{dataset.name}</strong><span className="table-secondary">{dataset.sheetName ?? "Single table"}</span></td>
              <td>{dataset.sourceFilename}</td>
              <td><span className="format-tag">{dataset.sourceKind.toUpperCase()}</span></td>
              <td><div className="column-tags">{dataset.columns.map((column) => <span key={column}>{column}</span>)}</div></td>
              <td className="numeric-cell">{dataset.rowCount.toLocaleString()}</td>
            </tr>
          ))}
          {!loading && datasets.length === 0 && <tr><td colSpan={5} className="table-empty">No datasets imported yet.</td></tr>}
        </tbody>
      </table>
    </section>
  );
}