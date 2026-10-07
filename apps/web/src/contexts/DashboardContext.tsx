import { createContext, useContext, type PropsWithChildren } from "react";
import type { DashboardContextValue } from "../types/dashboard";
import { useDashboard } from "../hooks/useDashboard";

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: PropsWithChildren) {
  const dashboard = useDashboard();
  return <DashboardContext.Provider value={dashboard}>{children}</DashboardContext.Provider>;
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboardContext must be used within DashboardProvider");
  return context;
}