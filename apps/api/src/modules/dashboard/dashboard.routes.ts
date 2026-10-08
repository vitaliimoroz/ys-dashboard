import type { FastifyInstance } from "fastify";
import type { StoreProvider } from "../store-provider.js";
import { healthHandler, listDatasetsHandler } from "./dashboard.handlers.js";
import {
  datasetSummariesResponseSchema,
  healthResponseSchema,
} from "./dashboard.schema.js";

export function registerDashboardRoutes(app: FastifyInstance, getStore: StoreProvider) {
  app.get("/health", { schema: { response: { 200: healthResponseSchema } } }, healthHandler);
  app.get(
    "/api/datasets",
    { schema: { response: { 200: datasetSummariesResponseSchema } } },
    listDatasetsHandler(getStore),
  );
}