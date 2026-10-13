import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { requestOrigin } from "@/lib/auth/origin";
import { ApiError } from "@/lib/validation";
import { DEMO_MODE } from "@/lib/config";
export function checkOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin || origin !== requestOrigin(req))
    throw new ApiError(403, "Request not allowed.");
}
export async function account(req: NextRequest) {
  if (DEMO_MODE) throw new ApiError(503, "Account service unavailable.");
  if (req.method !== "GET") checkOrigin(req);
  const db = await serverSupabase();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user)
    throw new ApiError(401, "Session expired. Sign in again.");
  return { db, user };
}
export function dbResult<T>(result: {
  data: T;
  error: { code?: string } | null;
}): NonNullable<T> {
  if (result.error) {
    const code = result.error.code;
    throw new ApiError(
      code === "42501"
        ? 403
        : code === "23505"
          ? 409
          : code?.startsWith("22") || code?.startsWith("23")
            ? 400
            : 503,
      code === "42501"
        ? "Permission denied."
        : "Unable to complete the request.",
    );
  }
  return result.data as NonNullable<T>;
}
export function json(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
export function failure(error: unknown) {
  return json(
    {
      error:
        error instanceof ApiError
          ? error.message
          : "Service unavailable. Try again.",
    },
    error instanceof ApiError ? error.status : 503,
  );
}
export async function storageConsent(
  db: Awaited<ReturnType<typeof serverSupabase>>,
  userId: string,
  type = "support_data_storage",
) {
  const rows = dbResult(
    await db
      .from("consent_records")
      .select("granted")
      .eq("user_id", userId)
      .eq("consent_type", type)
      .order("created_at", { ascending: false })
      .limit(1),
  );
  if (!rows?.[0]?.granted)
    throw new ApiError(
      403,
      "Enable the relevant data-storage consent in Settings first.",
    );
}
