import type { FastifyReply, FastifyRequest } from "fastify";
import type { StoreProvider } from "../store-provider.js";
import { listDatasets } from "./dashboard.service.js";

export async function healthHandler() {
  return { ok: true as const };
}

export function listDatasetsHandler(getStore: StoreProvider) {
  return async (_request: FastifyRequest, _reply: FastifyReply) =>
    listDatasets(getStore());
}