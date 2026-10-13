import {
  STEP_KEYS,
  SYSTEM_PROMPT,
  type AiProvider,
  type ProviderContext,
} from "./provider";
export class GeminiProvider implements AiProvider {
  readonly name = "gemini" as const;
  constructor(
    private key: string,
    private model: string,
    private request: typeof fetch = fetch,
  ) {
    if (!/^[a-zA-Z0-9.-]+$/.test(model)) throw Error("invalid_model");
  }
  async decide(c: ProviderContext) {
    const response = await this.request(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.key,
        },
        signal: AbortSignal.timeout(12000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: JSON.stringify({
                    message: c.message,
                    language: c.language,
                    untrustedResources: c.resources.map((r) => ({
                      id: r.id,
                      name: r.name,
                      category: r.category,
                      description: r.description.slice(0, 800),
                    })),
                  }),
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0,
            maxOutputTokens: 2048,
            responseSchema: {
              type: "OBJECT",
              properties: {
                resourceIds: {
                  type: "ARRAY",
                  maxItems: 3,
                  items: { type: "STRING", enum: c.resources.map((r) => r.id) },
                },
                steps: {
                  type: "ARRAY",
                  maxItems: 3,
                  items: { type: "STRING", enum: [...STEP_KEYS] },
                },
              },
              required: ["resourceIds", "steps"],
            },
          },
        }),
      },
    );
    if (!response.ok)
      throw Object.assign(
        Error(
          response.status === 429
            ? "provider_rate_limit"
            : "provider_unavailable",
        ),
        { status: response.status },
      );
    const raw = await response.text();
    if (raw.length > 32000) throw Error("provider_format");
    const data = JSON.parse(raw);
    const output = data.candidates?.[0]?.content?.parts?.find(
      (p: { text?: unknown; thought?: boolean }) =>
        typeof p.text === "string" && !p.thought,
    )?.text;
    if (typeof output !== "string") throw Error("provider_format");
    return JSON.parse(output);
  }
}
