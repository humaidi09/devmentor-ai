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
    ]) {
      const rows: unknown[] = [];
      const order =
        table === "modules_enabled"
          ? "user_id"
          : table === "cp_manual_progress"
            ? "problem_key"
            : "id";
      for (let offset = 0; ; offset += 500) {
        const batch = dbResult(
          await db
            .from(table)
            .select("*")
            .eq("user_id", user.id)
            .order(order)
            .range(offset, offset + 499),
        );
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
