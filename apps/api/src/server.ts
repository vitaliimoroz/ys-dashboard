import Fastify from "fastify";
import cors from "@fastify/cors";
import { createCorsOptions } from "./cors.js";
import { registerRoutes } from "./application.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

const app = Fastify({ logger: true });
const webOrigins = (process.env.WEB_ORIGIN ?? "")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

app.register(cors, createCorsOptions(webOrigins));
registerRoutes(app);

app.listen({ port, host });
