import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { authRoutes } from "./routes/auth";
import { dataMartRoutes } from "./routes/datamarts";
import { metaRoutes } from "./routes/meta";

export function buildApp() {
  const app = Fastify({ logger: false });
  app.register(cookie);
  app.register(authRoutes);
  app.register(dataMartRoutes);
  app.register(metaRoutes);
  return app;
}
