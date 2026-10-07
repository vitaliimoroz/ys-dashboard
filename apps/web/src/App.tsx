import { WIDGET_TYPES } from "@ys-dashboard/shared";

export function App() {
  return (
    <main>
      <h1>YouScan Dashboard</h1>
      <p>Widget types: {WIDGET_TYPES.join(", ")}</p>
    </main>
  );
}
