import { requestJson } from "@/lib/validation/request";
import type { NextRequest } from "next/server";
import { DEMO_MODE } from "@/lib/config";
import { buildDemoReply } from "@/lib/support-engine";
import { account, dbResult, failure, json } from "@/lib/server-api";
import { object, exact, text, choice, bool, ApiError } from "@/lib/validation";
import { aiProvider, realAiAvailable } from "@/lib/ai/server";
import { groundedReply } from "@/lib/ai/controller";
import { classify, retrievalIntent } from "@/lib/safety/classifier";
import { resourceDto } from "@/lib/resources/grounding";
import { learningReply } from "@/lib/chat/learning";
export async function GET() {
  return json({
    provider: !DEMO_MODE && realAiAvailable() ? "gemini" : "mock",
    conversationsStored: false,
  });
}
export async function POST(req: NextRequest) {
  try {
    if (Number(req.headers.get("content-length")) > 12000)
      throw new ApiError(413, "Message too long.");
    const b = object(await requestJson(req));
    exact(b, ["message", "lang", "useAi", "clarified", "contextTopicId"]);
    const message = text(b.message, 2000),
      clarified = b.clarified === undefined ? false : bool(b.clarified);
    const contextTopicId =
      b.contextTopicId === undefined ? undefined : text(b.contextTopicId, 80);
    if (DEMO_MODE || req.cookies.get("close-ai-mode")?.value === "demo") {
      const lesson = learningReply(
        message,
        b.lang === "bn" ? "bn" : "en",
        contextTopicId,
      );
      if (lesson) return json(lesson);
      const reply = buildDemoReply(message, b.lang === "bn" ? "bn" : "en");
      return json({
        ...reply,
        provider: "mock",
        state: reply.uncertain ? "clarification" : "success",
        humanSupportAvailable: reply.humanSupportAvailable,
        draft: reply.sources?.length
          ? {
              resourceId: reply.sources[0].id,
              title:
                b.lang === "bn" ? "প্রস্তাবিত ধাপ" : "Suggested next steps",
              steps:
                b.lang === "bn"
                  ? [
                      "অফিসিয়াল উৎসে যোগ্যতা যাচাই করুন",
                      "অফিসের সাথে যোগাযোগ করবেন কি না সিদ্ধান্ত নিন",
                    ]
                  : [
                      "Check eligibility on the official source",
                      "Decide whether to contact the office",
                    ],
            }
          : undefined,
      });
    }
    const { db, user } = await account(req);
    const profile = dbResult(
      await db
        .from("profiles")
        .select("campus_id,preferred_language")
        .eq("id", user.id)
        .single(),
    );
    const lang =
      b.lang === undefined
        ? profile.preferred_language === "bn"
          ? "bn"
          : "en"
        : choice(b.lang, ["en", "bn"]);
    const lesson = learningReply(message, lang, contextTopicId);
    if (lesson) return json(lesson);
    const provider = aiProvider(b.useAi === undefined ? false : bool(b.useAi));
    if (
      provider.name === "gemini" &&
      !dbResult(await db.rpc("consume_close_ai_budget", { service_name: "ai" }))
    )
      throw new ApiError(
        429,
        "AI request limit reached. Browse resources manually.",
      );
    const c = classify(message);
    const campus = profile.campus_id;
    const matches = campus
      ? dbResult(
          await db.rpc("search_close_ai_resources", {
            campus,
            category: retrievalIntent(c),
            search_text: message,
          }),
        )
      : [];
    const ids = matches.map((r: { id: string }) => r.id);
    const rows = ids.length
      ? dbResult(
          await db
            .from("support_resources")
            .select("*,resource_sources(source_title,source_url)")
            .in("id", ids),
        )
      : [];
    return json(
      await groundedReply(
        message,
        lang,
        rows.map(resourceDto),
        campus,
        provider,
        clarified,
      ),
    );
  } catch (e) {
    if (e instanceof SyntaxError)
      return json({ error: "Invalid request." }, 400);
    return failure(e);
  }
}
