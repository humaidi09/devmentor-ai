import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_MODE, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";
import { requestOrigin } from "@/lib/auth/origin";
import { protectedPath } from "@/lib/auth/paths";
export async function middleware(request: NextRequest) {
  if (DEMO_MODE || request.cookies.get("close-ai-mode")?.value === "demo") {
    const response = NextResponse.next();
    response.headers.set("X-Close-AI-Cache", "public-demo");
    return response;
  }
  let response = NextResponse.next({ request });
  const client = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if ((!user || error) && protectedPath(request.nextUrl.pathname)) {
    const url = new URL(request.nextUrl.pathname, requestOrigin(request));
    url.pathname = "/auth";
    url.search = "";
    url.searchParams.set("next", request.nextUrl.pathname);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|offline.html).*)"],
};
