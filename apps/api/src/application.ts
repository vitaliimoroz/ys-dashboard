import type { FastifyInstance } from "fastify";
import { createDashboardStore, type DashboardStore } from "./db/store.js";
import { registerDashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import { registerWidgetRoutes } from "./modules/widgets/widgets.routes.js";

export interface RouteOptions {
  store?: DashboardStore;
}

export function registerRoutes(app: FastifyInstance, options: RouteOptions = {}) {
  let store = options.store;
  const getStore = () => {
    store ??= createDashboardStore();
    return store;
  };

  registerDashboardRoutes(app, getStore);
  registerWidgetRoutes(app, getStore);
}