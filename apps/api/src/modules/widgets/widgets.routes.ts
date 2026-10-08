import type { FastifyInstance } from "fastify";
import type { CreateWidgetBody, PatchWidgetBody } from "@ys-dashboard/shared";
import type { RepositoryProvider } from "../repository-provider.js";
import {
  createWidgetHandler,
  deleteWidgetHandler,
  getWidgetHandler,
  listWidgetsHandler,
  updateWidgetHandler,
} from "./widgets.handlers.js";
import {
  createWidgetBodyJsonSchema,
  patchWidgetBodyJsonSchema,
  widgetIdParamsSchema,
} from "./widgets.schema.js";

interface WidgetParams {
  id: string;
}

export function registerWidgetRoutes(app: FastifyInstance, getRepositories: RepositoryProvider) {
  app.get("/api/widgets", listWidgetsHandler(getRepositories));
  app.get<{ Params: WidgetParams }>(
    "/api/widgets/:id",
    { attachValidation: true, schema: { params: widgetIdParamsSchema } },
    getWidgetHandler(getRepositories),
  );
  app.post<{ Body: CreateWidgetBody }>(
    "/api/widgets",
    { attachValidation: true, schema: { body: createWidgetBodyJsonSchema } },
    createWidgetHandler(getRepositories),
  );
  app.patch<{ Params: WidgetParams; Body: PatchWidgetBody }>(
    "/api/widgets/:id",
    {
      attachValidation: true,
      schema: { params: widgetIdParamsSchema, body: patchWidgetBodyJsonSchema },
    },
    updateWidgetHandler(getRepositories),
  );
  app.delete<{ Params: WidgetParams }>(
    "/api/widgets/:id",
    { attachValidation: true, schema: { params: widgetIdParamsSchema } },
    deleteWidgetHandler(getRepositories),
  );
}