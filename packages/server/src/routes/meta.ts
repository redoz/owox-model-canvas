import type { FastifyInstance } from "fastify";
import { getSession, clientFor } from "../auth/session";
export async function metaRoutes(app: FastifyInstance) {
  app.get("/api/storages", async (req, reply) => { const s = getSession(req.cookies.mc_sid); if (!s) return reply.code(401).send({ error: "Not connected" }); return clientFor(s).listStorages(); });
  app.get("/api/projects", async (req, reply) => { const s = getSession(req.cookies.mc_sid); if (!s) return reply.code(401).send({ error: "Not connected" }); return [{ title: s.projectTitle }]; });
}
