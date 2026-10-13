import { requestOrigin } from "@/lib/auth/origin";
import { NextResponse, type NextRequest } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/config";
import { validateAuth } from "@/lib/validation";
import { checkOrigin } from "@/lib/server-api";
export async function POST(req: NextRequest) {
  try {
    checkOrigin(req);
    if (DEMO_MODE)
      return NextResponse.json(
        { error: "Account service unavailable." },
        { status: 503 },
      );
    const body = validateAuth(await req.json());
    const client = await serverSupabase();
    const result =
      body.action === "signup"
        ? await client.auth.signUp({
            email: body.email,
            password: body.password,
            options: {
              emailRedirectTo: new URL("/auth/callback", requestOrigin(req))
                .href,
            },
          })
        : await client.auth.signInWithPassword({
            email: body.email,
            password: body.password,
          });
    if (result.error)
      return NextResponse.json(
        { error: "Check your credentials or try again later." },
        { status: 400 },
      );
    const response = NextResponse.json({ confirmation: !result.data.session });
    response.cookies.set("close-ai-mode", "account", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: requestOrigin(req).startsWith("https:"),
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid request or account service unavailable." },
      { status: 400 },
    );
  }
}
export async function DELETE(req: NextRequest) {
  try {
    checkOrigin(req);
    const client = await serverSupabase();
    const { error } = await client.auth.signOut();
    if (error) throw error;
    const response = NextResponse.json({ ok: true });
    response.cookies.delete("close-ai-mode");
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to sign out. Try again." },
      { status: 503 },
    );
  }
}
