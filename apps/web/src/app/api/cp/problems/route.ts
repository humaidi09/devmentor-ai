import type { NextRequest } from "next/server";

import { CODEFORCES_TAG, CP_TOPICS, CURATED_PROBLEMS, filterProblems, normalizeCodeforces } from "@/lib/cp/library";
import { codeforces } from "@/lib/integrations/codeforces/server";
import { failure, json } from "@/lib/server-api";
import { ApiError, choice } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const topic = choice(req.nextUrl.searchParams.get("topic"), CP_TOPICS);
    const raw = req.nextUrl.searchParams.get("page") ?? "1";
    const page = Number(raw);
    if (!Number.isInteger(page) || page < 1 || page > 20) throw new ApiError(400, "Invalid page.");
    const tag = CODEFORCES_TAG[topic];
    const curated = filterProblems(CURATED_PROBLEMS, { topic });
    if (!tag) return json({ problems: curated, page, hasMore: false, live: false, reason: "No supported Codeforces tag for this topic." });
    try {
      const live = (await codeforces.problems(tag)).map(normalizeCodeforces);
      const merged = [...curated, ...live.filter((problem) => !curated.some((item) => item.id === problem.id))];
      const matching = filterProblems(merged, { topic });
      const start = (page - 1) * 20;
      return json({ problems: matching.slice(start, start + 20), page, hasMore: matching.length > start + 20, live: matching.some((item) => item.source === "codeforces-api"), reason: null });
    } catch {
      return json({ problems: page === 1 ? curated : [], page, hasMore: false, live: false, reason: "Codeforces is unavailable. Showing curated links." });
    }
  } catch (error) { return failure(error); }
}
