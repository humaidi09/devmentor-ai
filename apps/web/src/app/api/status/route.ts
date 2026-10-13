import { DEMO_MODE, SUPABASE_CONFIGURED } from "@/lib/config";

export function GET() {
  return Response.json(
    {
      mode: DEMO_MODE ? "demo" : "account",
      supabaseConfigured: SUPABASE_CONFIGURED,
      revision: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
