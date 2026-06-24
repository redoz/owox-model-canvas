import type { FastifyInstance } from "fastify";
import { generateQuestions, GeminiRateLimitError, type GenerateInput } from "../llm/gemini";

interface Body {
  niche?: unknown;
  goal?: unknown;
  focus?: { marts?: unknown; joins?: unknown };
}

function validate(body: Body): GenerateInput | null {
  if (typeof body.niche !== "string" || !body.niche.trim()) return null;
  if (typeof body.goal !== "string" || !body.goal.trim()) return null;
  const focus = body.focus;
  if (!focus || !Array.isArray(focus.marts) || focus.marts.length === 0) return null;
  if (!Array.isArray(focus.joins)) return null;
  return body as unknown as GenerateInput;
}

export async function questionsRoutes(app: FastifyInstance) {
  app.post(
    "/api/questions",
    {
      // Tighter than the global cap to protect the shared Gemini quota.
      config: {
        rateLimit: {
          max: Number(process.env.QUESTIONS_RATE_LIMIT_MAX) || 30,
          timeWindow: process.env.QUESTIONS_RATE_LIMIT_WINDOW || "1 minute",
        },
      },
    },
    async (req, reply) => {
      const input = validate(req.body as Body);
      if (!input) return reply.code(400).send({ error: "niche, goal and a non-empty focus.marts are required" });
      try {
        const questions = await generateQuestions(input);
        return { questions };
      } catch (err) {
        // Quota / spend-cap exhaustion → 429 "ai_limit" so the client can show a
        // friendly "limit reached" message; everything else stays a 502 failure.
        if (err instanceof GeminiRateLimitError) return reply.code(429).send({ error: "ai_limit" });
        throw err;
      }
    },
  );
}
