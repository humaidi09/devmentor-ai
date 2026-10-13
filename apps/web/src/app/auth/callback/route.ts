import { requestOrigin } from "@/lib/auth/origin";
import { NextResponse, type NextRequest } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/paths";
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (code) {
    const client = await serverSupabase();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(
        new URL(
          safeNext(req.nextUrl.searchParams.get("next")),
          requestOrigin(req),
        ),
      );
      response.cookies.set("close-ai-mode", "account", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: requestOrigin(req).startsWith("https:"),
      });
      return response;
    }
  }
  return NextResponse.redirect(
    new URL("/auth?error=confirmation", requestOrigin(req)),
  );
}
