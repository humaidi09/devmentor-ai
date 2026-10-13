import type { NextRequest } from "next/server";
import { account, dbResult, json, failure } from "@/lib/server-api";
export async function GET(req: NextRequest) {
  try {
    const { db, user } = await account(req);
    const result: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
    };
    result.profile = dbResult(
      await db
        .from("profiles")
        .select(
          "display_name,preferred_language,campus_id,timezone,quiet_hours_start,quiet_hours_end,onboarding_completed",
        )
        .eq("id", user.id),
    );
    for (const table of [
      "modules_enabled",
      "saved_resources",
      "saved_knowledge",
      "action_plans",
      "action_steps",
      "reminders",
      "consent_records",
      "courses",
      "deadlines",
      "developer_path_progress",
      "cp_preferences",
      "cp_manual_progress",
      "learning_tasks",
      "learning_progress",
      "notification_preferences",
      "notifications",
    ]) {
      const rows: unknown[] = [];
      const order = [
        "modules_enabled",
        "notification_preferences",
        "learning_progress",
      ].includes(table)
        ? "user_id"
        : table === "cp_manual_progress"
          ? "problem_key"
          : table === "saved_knowledge"
            ? "external_id"
          : "id";
      for (let offset = 0; ; offset += 500) {
        let query = db
          .from(table)
          .select("*")
          .eq("user_id", user.id)
          .order(order)
          .range(offset, offset + 499);
        if (table === "learning_progress")
          query = query.order("kind").order("topic_key");
        const batch = dbResult(await query);
        rows.push(...batch);
        if (batch.length < 500) break;
      }
      result[table] = rows;
    }
    return json(result);
  } catch (e) {
    return failure(e);
  }
}
