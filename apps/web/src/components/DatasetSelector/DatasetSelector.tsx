import { ChevronDown, Database } from "lucide-react";
import type {
  DatasetSummary,
  PatchWidgetBody,
  WidgetDetail,
} from "@ys-dashboard/shared";
import { chartConfigFor } from "../../utils/chart";
import "./index.scss";

interface DatasetSelectorProps {
  detail: WidgetDetail;
  datasets: DatasetSummary[];
  onPatch(id: string, patch: PatchWidgetBody): Promise<void>;
}

export function DatasetSelector({ detail, datasets, onPatch }: DatasetSelectorProps) {
  if (detail.payload.kind !== "chart") return null;

  const selectDataset = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const datasetId = event.target.value || null;
    const selected = datasets.find((dataset) => dataset.id === datasetId);
    onPatch(detail.id, {
      datasetId: selected?.id ?? null,
      chartConfig: selected ? chartConfigFor(detail.type, selected.columns) : {},
    });
  };

  return (
    <label className="dataset-selector">
      <Database size={13} aria-hidden="true" />
      <select
        aria-label={`Dataset for ${detail.title}`}
        value={detail.datasetId ?? ""}
        onChange={selectDataset}
      >
        <option value="">No dataset</option>
        {datasets.map((dataset) => (
          <option key={dataset.id} value={dataset.id}>
            {dataset.name}{dataset.sheetName ? ` · ${dataset.sheetName}` : ""}
          </option>
        ))}
      </select>
      <ChevronDown size={13} aria-hidden="true" />
    </label>
  );
}