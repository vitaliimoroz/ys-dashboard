import type { ActiveView } from "../../types/dashboard";
import "./index.scss";

interface PageHeadingProps {
  activeView: ActiveView;
  datasetCount: number;
}

export function PageHeading({ activeView, datasetCount }: PageHeadingProps) {
  const dashboard = activeView === "dashboard";
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">CAMPAIGN ANALYTICS</div>
        <h1>{dashboard ? "Performance overview" : "Data library"}</h1>
        <p>{dashboard ? "Explore results across your imported campaign data." : "Imported source files and worksheet dimensions."}</p>
      </div>
      <div className="period-label"><span className="period-mark" />{datasetCount} source tables</div>
    </div>
  );
}