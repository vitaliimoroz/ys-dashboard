import { DashboardProvider } from "./contexts/DashboardContext";
import { DashboardContainer } from "./containers/DashboardContainer";

export function App() {
  return (
    <DashboardProvider>
      <DashboardContainer />
    </DashboardProvider>
  );
}