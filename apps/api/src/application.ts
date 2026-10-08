import type { FastifyInstance } from "fastify";
import { createDb } from "./db/client.js";
import { createDatasetRepository } from "./modules/datasets/datasets.repository.js";
import { registerDashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import type { ApiRepositories } from "./modules/repository-provider.js";
import { registerWidgetRoutes } from "./modules/widgets/widgets.routes.js";
import { createWidgetRepository } from "./modules/widgets/widgets.repository.js";

export interface RouteOptions {
  repositories?: ApiRepositories;
}

export function registerRoutes(app: FastifyInstance, options: RouteOptions = {}) {
  let repositories = options.repositories;
  const getRepositories = () => {
    if (!repositories) {
      const db = createDb();
      repositories = {
        datasets: createDatasetRepository(db),
        widgets: createWidgetRepository(db),
      };
    }
    return repositories;
  };

  registerDashboardRoutes(app, getRepositories);
  registerWidgetRoutes(app, getRepositories);
}