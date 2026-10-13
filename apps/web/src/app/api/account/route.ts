import type { NextRequest } from "next/server";
import {
  account,
  dbResult,
  json,
  failure,
  storageConsent,
} from "@/lib/server-api";
import {
  object,
  exact,
  choice,
  text,
  timezone,
  ApiError,
} from "@/lib/validation";
export async function GET(req: NextRequest) {
  try {
    const { db, user } = await account(req);
    const results = await Promise.all([
      db
        .from("profiles")
        .select(
          "id,display_name,preferred_language,campus_id,timezone,onboarding_completed,quiet_hours_start,quiet_hours_end",
        )
        .eq("id", user.id)
        .single(),
      db.from("modules_enabled").select("*").eq("user_id", user.id).single(),
      db.from("saved_resources").select("resource_id").eq("user_id", user.id),
      db
        .from("action_plans")
        .select("id,title,status,related_resource_id")
        .eq("user_id", user.id)
        .order("created_at"),
      db
        .from("action_steps")
        .select("id,action_plan_id,title,description,status,position")
        .eq("user_id", user.id)
        .order("position"),
      db
        .from("reminders")
        .select("action_step_id,enabled")
        .eq("user_id", user.id),
      db
        .from("consent_records")
        .select("id,consent_type,granted,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      db.from("resource_roles").select("campus_id,role").eq("user_id", user.id),
      db
        .from("developer_path_progress")
        .select("pathway,milestone_key,status")
        .eq("user_id", user.id),
      db
        .from("cp_manual_progress")
        .select("problem_key,status")
        .eq("user_id", user.id),
      db
        .from("cp_preferences")
        .select("codeforces_handle,codeforces_connected_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      db
        .from("learning_progress")
        .select("kind,topic_key,status,position,updated_at")
        .eq("user_id", user.id),
    ]);
    results.forEach(dbResult);
    const p = results[0].data!;
    const m = results[1].data!;
    return json({
      profile: p,
      preferences: {
        campus: p.campus_id ?? "not-listed",
        support: m.student_support_enabled,
        modules: {
          academic: m.academic_study_enabled,
          developer: m.developer_path_enabled,
          cp: m.cp_coach_enabled,
        },
        reminders: m.reminders_enabled,
        quietStart: p.quiet_hours_start?.slice(0, 5) ?? "22:00",
        quietEnd: p.quiet_hours_end?.slice(0, 5) ?? "08:00",
        onboarded: p.onboarding_completed,
      },
      savedIds: results[2].data!.map((r) => r.resource_id),
      plans: results[3].data,
      steps: results[4].data!.map((s) => ({
        id: s.id,
        planId: s.action_plan_id,
        title: s.title,
        detail: s.description,
        status: s.status,
        position: s.position,
        source: "manual",
      })),
      reminders: results[5]
        .data!.filter((r) => r.enabled && r.action_step_id)
        .map((r) => r.action_step_id),
      consents: results[6].data,
      roles: results[7].data,
      developerDone: Object.fromEntries(
        results[8].data!.map((r) => [
          `${r.pathway}:${r.milestone_key}`,
          r.status === "completed",
        ]),
      ),
      cpStatus: Object.fromEntries(
        results[9].data!.map((r) => [r.problem_key, r.status]),
      ),
      cpHandle: results[10].data?.codeforces_handle ?? "",
      cpConnected: !!results[10].data?.codeforces_connected_at,
      learningProgress: results[11].data ?? [],
    });
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(req: NextRequest) {
  try {
    const { db, user } = await account(req);
    const b = object(await req.json());
    exact(b, ["display_name", "preferred_language", "timezone"]);
    const value: Record<string, string> = {};
    if ("display_name" in b && text(b.display_name, 100, true))
      await storageConsent(db, user.id, "optional_profile_data");
    if ("display_name" in b)
      value.display_name = text(b.display_name, 100, true);
    if ("preferred_language" in b)
      value.preferred_language = choice(b.preferred_language, ["en", "bn"]);
    if ("timezone" in b) value.timezone = timezone(b.timezone);
    dbResult(await db.from("profiles").update(value).eq("id", user.id));
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: NextRequest) {
  try {
    const { db } = await account(req);
    const b = object(await req.json());
    exact(b, ["confirmation"]);
    if (b.confirmation !== "ERASE APP DATA")
      throw new ApiError(400, "Confirmation required.");
    dbResult(await db.rpc("erase_close_ai_data"));
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
