import type { FastifyReply, FastifyRequest } from "fastify";
import type { CreateWidgetBody, PatchWidgetBody } from "@ys-dashboard/shared";
import type { RepositoryProvider } from "../repository-provider.js";
import {
  createWidget,
  deleteWidget,
  getWidgetDetail,
  listWidgets,
  updateWidget,
} from "./widgets.service.js";

interface WidgetParams {
  id: string;
}

function validationError(reply: FastifyReply, request: FastifyRequest) {
  return reply.code(400).send({ error: request.validationError?.message ?? "Invalid request" });
}

export function listWidgetsHandler(getRepositories: RepositoryProvider) {
  return async (_request: FastifyRequest, _reply: FastifyReply) =>
    listWidgets(getRepositories().widgets);
}

export function getWidgetHandler(getRepositories: RepositoryProvider) {
  return async (request: FastifyRequest<{ Params: WidgetParams }>, reply: FastifyReply) => {
    if (request.validationError) return validationError(reply, request);
    const repositories = getRepositories();
    const widget = await getWidgetDetail(
      repositories.widgets,
      repositories.datasets,
      request.params.id,
    );
    if (!widget) return reply.code(404).send({ error: "Widget not found" });
    return widget;
  };
}

export function createWidgetHandler(getRepositories: RepositoryProvider) {
  return async (
    request: FastifyRequest<{ Body: CreateWidgetBody }>,
    reply: FastifyReply,
  ) => {
    if (request.validationError) return validationError(reply, request);
    const repositories = getRepositories();
    return reply.code(201).send(
      await createWidget(repositories.widgets, repositories.datasets, request.body),
    );
  };
}

export function updateWidgetHandler(getRepositories: RepositoryProvider) {
  return async (
    request: FastifyRequest<{ Params: WidgetParams; Body: PatchWidgetBody }>,
    reply: FastifyReply,
  ) => {
    if (request.validationError) return validationError(reply, request);
    const repositories = getRepositories();
    const result = await updateWidget(
      repositories.widgets,
      repositories.datasets,
      request.params.id,
      request.body,
    );
    if (result.kind === "not-found") return reply.code(404).send({ error: "Widget not found" });
    if (result.kind === "dataset-not-found") return reply.code(404).send({ error: "Dataset not found" });
    if (result.kind === "invalid-patch") {
      return reply.code(400).send({ error: "Patch fields do not match the widget type" });
    }
    return result.widget;
  };
}

export function deleteWidgetHandler(getRepositories: RepositoryProvider) {
  return async (request: FastifyRequest<{ Params: WidgetParams }>, reply: FastifyReply) => {
    if (request.validationError) return validationError(reply, request);
    const deleted = await deleteWidget(getRepositories().widgets, request.params.id);
    if (!deleted) return reply.code(404).send({ error: "Widget not found" });
    return reply.code(204).send();
  };
}