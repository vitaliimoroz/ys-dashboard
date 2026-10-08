import type { FastifyReply, FastifyRequest } from "fastify";
import type { RepositoryProvider } from "../repository-provider.js";
import { listDatasets } from "./dashboard.service.js";

export async function healthHandler() {
  return { ok: true as const };
}

export function listDatasetsHandler(getRepositories: RepositoryProvider) {
  return async (_request: FastifyRequest, _reply: FastifyReply) =>
    listDatasets(getRepositories().datasets);
}