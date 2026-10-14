// Explicit operator-run smoke test; public fictional context only, no stored student data.
import { fetch as http, EnvHttpProxyAgent } from "undici";
import { GeminiProvider } from "../src/lib/ai/gemini";
import { validateDecision } from "../src/lib/ai/provider";
import { DEMO_RESOURCES } from "../src/lib/demo-data";
async function main() {
  const key = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw Error("AI key not configured");
  const agent = new EnvHttpProxyAgent();
  try {
    const request: typeof fetch = ((
      url: RequestInfo | URL,
      init?: RequestInit,
    ) =>
      http(
        url as string,
        { ...init, dispatcher: agent } as any,
      )) as unknown as typeof fetch;
    const provider = new GeminiProvider(
      key,
      process.env.AI_MODEL || "gemini-3.1-flash-lite-preview",
      request,
    );
    const resources = [DEMO_RESOURCES[0]];
    const decision = validateDecision(
      await provider.decide({
        message: "Find tuition fee information. Fictional test.",
        language: "en",
        resources,
      }),
      resources,
    );
    const answer = await provider.explainLesson(
      "Explain binary search with a tiny example. Fictional test.",
      "en",
      "Binary search checks the middle of a sorted list, then keeps only the half that can contain the target. Example: in [1, 3, 5], find 5 by checking 3, then 5.",
    );
    if (!answer.toLowerCase().includes("binary search")) throw Error("provider_format");
    console.log(
      JSON.stringify({
        provider: provider.name,
        validated: true,
        lessonExplanationValidated: true,
        resourceCount: decision.resourceIds.length,
        stepCount: decision.steps.length,
      }),
    );
  } finally {
    await agent.close();
  }
}
main().catch((e) => {
  console.error(
    JSON.stringify({
      errorType: e?.name,
      httpStatus: e?.status,
      errorCode: e?.cause?.code,
      providerError: [
        "provider_rate_limit",
        "provider_unavailable",
        "provider_format",
        "provider_grounding",
      ].includes(e?.message)
        ? e.message
        : undefined,
    }),
  );
  console.error(
    "Real Gemini smoke request failed; no message, key or raw provider response logged.",
  );
  process.exitCode = 1;
});
