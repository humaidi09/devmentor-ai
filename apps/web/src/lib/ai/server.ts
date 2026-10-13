import "server-only";
import { MockProvider, type AiProvider } from "./provider";
import { GeminiProvider } from "./gemini";
import { externalFetch } from "../integrations/http";
export function realAiAvailable() {
  return (
    process.env.AI_PROVIDER === "gemini" &&
    !!(process.env.AI_API_KEY || process.env.GEMINI_API_KEY)
  );
}
export function aiProvider(useAi: boolean): AiProvider {
  return useAi && realAiAvailable()
    ? new GeminiProvider(
        process.env.AI_API_KEY || process.env.GEMINI_API_KEY!,
        process.env.AI_MODEL || "gemini-3.1-flash-lite-preview",
        externalFetch,
      )
    : new MockProvider();
}
