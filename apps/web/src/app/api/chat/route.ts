import { NextResponse, type NextRequest } from "next/server";

import { buildDemoReply } from "@/lib/support-engine";

/**
 * Chat endpoint. Server-side boundary where a real AI provider adapter plugs
 * in later (its key never reaches the browser). Phase 1 uses a deterministic
 * demo provider that only surfaces verified resources and never invents one.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const payload = body as { message?: unknown; lang?: unknown };
  const message = typeof payload.message === "string" ? payload.message.slice(0, 2000) : "";
  const lang = payload.lang === "bn" ? "bn" : "en";

  if (!message.trim()) {
    return NextResponse.json({ error: "Empty message." }, { status: 400 });
  }

  const reply = buildDemoReply(message, lang);
  return NextResponse.json(reply);
}
