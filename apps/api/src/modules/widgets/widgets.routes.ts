import type { FastifyInstance } from "fastify";
import type { CreateWidgetBody, PatchWidgetBody } from "@ys-dashboard/shared";
import type { StoreProvider } from "../store-provider.js";
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

export function registerWidgetRoutes(app: FastifyInstance, getStore: StoreProvider) {
  app.get("/api/widgets", listWidgetsHandler(getStore));
  app.get<{ Params: WidgetParams }>(
    "/api/widgets/:id",
    { attachValidation: true, schema: { params: widgetIdParamsSchema } },
    getWidgetHandler(getStore),
  );
  app.post<{ Body: CreateWidgetBody }>(
    "/api/widgets",
    { attachValidation: true, schema: { body: createWidgetBodyJsonSchema } },
    createWidgetHandler(getStore),
  );
  app.patch<{ Params: WidgetParams; Body: PatchWidgetBody }>(
    "/api/widgets/:id",
    {
      attachValidation: true,
      schema: { params: widgetIdParamsSchema, body: patchWidgetBodyJsonSchema },
    },
    updateWidgetHandler(getStore),
  );
  app.delete<{ Params: WidgetParams }>(
    "/api/widgets/:id",
    { attachValidation: true, schema: { params: widgetIdParamsSchema } },
    deleteWidgetHandler(getStore),
  );
}