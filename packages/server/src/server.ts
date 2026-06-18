import { buildApp } from "./app";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const app = buildApp();
const dist = join(dirname(fileURLToPath(import.meta.url)), "../../web/dist");
app.register(fastifyStatic, { root: dist });
app.setNotFoundHandler((_req, reply) => reply.sendFile("index.html"));
app.listen({ port: Number(process.env.PORT) || 3000, host: "0.0.0.0" }).then(() => console.log("listening"));
