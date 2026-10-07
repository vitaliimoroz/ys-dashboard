import type { FastifyCorsOptions } from "@fastify/cors";

export function createCorsOptions(webOrigins: string[]): FastifyCorsOptions {
  return {
    origin: webOrigins.length > 0 ? webOrigins : false,
    methods: ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
  };
}