import type { NextRequest } from "next/server";

import { searchKnowledge } from "@/lib/knowledge/engine";
import { KNOWLEDGE_CATEGORIES } from "@/lib/knowledge/types";
import { failure, json } from "@/lib/server-api";
import { ApiError, choice } from "@/lib/validation";

const budget = new Map<string, { started: number; count: number }>();

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get("q") ?? "";
    const query = raw.replace(/\s+/g, " ").trim();
    if (query.length < 3 || query.length > 160 || /[\r\n]/.test(raw))
      throw new ApiError(400, "Search query must be 3–160 characters.");
    if (/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(query) || /\b\d{9,}\b/.test(query))
      throw new ApiError(400, "Remove personal contact details before searching external sources.");
    const category = choice(req.nextUrl.searchParams.get("category") ?? "all", KNOWLEDGE_CATEGORIES);
    const address = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const key = address.slice(0, 100);
    const now = Date.now();
    const usage = budget.get(key);
    if (usage && now - usage.started < 60_000 && usage.count >= 20)
      throw new ApiError(429, "Search limit reached. Wait a minute and retry.");
    if (budget.size > 500) budget.clear();
    budget.set(key, usage && now - usage.started < 60_000
      ? { started: usage.started, count: usage.count + 1 }
      : { started: now, count: 1 });
    return json(await searchKnowledge(query, category));
  } catch (error) {
    return failure(error);
  }
}
