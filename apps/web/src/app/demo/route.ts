import { requestOrigin } from "@/lib/auth/origin";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
export function GET(req: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/dashboard", requestOrigin(req)),
  );
  response.cookies.set("close-ai-mode", "demo", {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: requestOrigin(req).startsWith("https:"),
  });
  return response;
}
