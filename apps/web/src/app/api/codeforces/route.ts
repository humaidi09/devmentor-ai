import { requestJson } from "@/lib/validation/request";
import type { NextRequest } from "next/server";
import { account, dbResult, failure, json } from "@/lib/server-api";
import { object, exact, choice, bool, ApiError } from "@/lib/validation";
import { codeforces } from "@/lib/integrations/codeforces/server";
import {
  validHandle,
  IntegrationError,
  CF_TOPICS,
} from "@/lib/integrations/codeforces/adapter";
function fail(e: unknown) {
  if (e instanceof IntegrationError)
    return failure(
      new ApiError(
        e.kind === "invalid_handle" ? 404 : e.kind === "rate_limit" ? 429 : 503,
        e.kind === "invalid_handle"
          ? "Codeforces handle could not be found."
          : e.kind === "rate_limit"
            ? "Codeforces is busy. Wait a moment and retry."
            : "Codeforces is unavailable. Manual practice remains available.",
      ),
    );
  return failure(e);
}
export async function POST(req: NextRequest) {
  try {
    const { db, user } = await account(req);
    const b = object(await requestJson(req));
    const action = choice(b.action, [
      "preview",
      "confirm",
      "history",
      "problems",
    ]);
    if (
      !dbResult(
        await db.rpc("consume_close_ai_budget", { service_name: "codeforces" }),
      )
    )
      throw new ApiError(429, "Codeforces hourly request limit reached.");
    if (action === "preview" || action === "confirm") {
      exact(
        b,
        action === "preview"
          ? ["action", "handle"]
          : ["action", "handle", "confirmed"],
      );
      if (action === "confirm" && bool(b.confirmed) !== true)
        throw new ApiError(403, "Confirm the connection first.");
      const profile = await codeforces.profile(validHandle(b.handle));
      if (action === "confirm")
        dbResult(
          await db.rpc("connect_close_ai_codeforces", {
            handle: profile.handle,
            confirmed: true,
          }),
        );
      return json({ profile });
    }
    const prefs = dbResult(
      await db
        .from("cp_preferences")
        .select("codeforces_handle,codeforces_connected_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    );
    if (!prefs?.codeforces_handle || !prefs.codeforces_connected_at)
      throw new ApiError(403, "Connect Codeforces first.");
    if (action === "history") {
      exact(b, ["action"]);
      return json({
        submissions: await codeforces.submissions(prefs.codeforces_handle),
      });
    }
    exact(b, ["action", "topic"]);
    const topic = choice(b.topic, CF_TOPICS);
    return json({ problems: await codeforces.problems(topic) });
  } catch (e) {
    return fail(e);
  }
}
export async function DELETE(req: NextRequest) {
  try {
    const { db, user } = await account(req);
    const p = dbResult(
      await db
        .from("cp_preferences")
        .select("codeforces_handle")
        .eq("user_id", user.id)
        .maybeSingle(),
    );
    dbResult(
      await db
        .from("cp_preferences")
        .update({ codeforces_handle: null, codeforces_connected_at: null })
        .eq("user_id", user.id),
    );
    if (p?.codeforces_handle) codeforces.invalidate(p.codeforces_handle);
    return json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
