import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerRoutes } from "./application.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

const app = Fastify({ logger: true });
const webOrigins = (process.env.WEB_ORIGIN ?? "")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

app.register(cors, { origin: webOrigins.length > 0 ? webOrigins : false });
registerRoutes(app);

app.listen({ port, host });
