import Fastify from "fastify";
import { registerRoutes } from "./application.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

const app = Fastify({ logger: true });
registerRoutes(app);

await app.listen({ port, host });
