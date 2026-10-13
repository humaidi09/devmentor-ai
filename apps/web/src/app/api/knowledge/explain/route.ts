import type { NextRequest } from "next/server";

import { realAiAvailable } from "@/lib/ai/server";
import { explainKnowledge } from "@/lib/knowledge/explain";
import { KNOWLEDGE_CATEGORIES } from "@/lib/knowledge/types";
import { account, dbResult, failure, json } from "@/lib/server-api";
import { ApiError, bool, choice, exact, object } from "@/lib/validation";
import { requestJson } from "@/lib/validation/request";

export async function GET() { return json({ available: realAiAvailable() }); }

export async function POST(req: NextRequest) {
  try {
    const { db } = await account(req);
    const body = object(await requestJson(req));
    exact(body, ["query", "category", "confirmed"]);
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (query.length < 3 || query.length > 160 || /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(query) || /\b\d{9,}\b/.test(query))
      throw new ApiError(400, "Search query must omit personal details.");
    if (!bool(body.confirmed)) throw new ApiError(403, "Confirm sharing this search and public metadata with AI.");
    if (!realAiAvailable()) throw new ApiError(503, "AI explanation is not configured.");
    if (!dbResult(await db.rpc("consume_close_ai_budget", { service_name: "ai" })))
      throw new ApiError(429, "AI request limit reached.");
    const category = choice(body.category, KNOWLEDGE_CATEGORIES);
    return json(await explainKnowledge(query, category));
  } catch (error) { return failure(error); }
}
