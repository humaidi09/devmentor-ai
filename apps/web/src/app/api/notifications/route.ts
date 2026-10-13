import { requestJson } from "@/lib/validation/request";
import type { NextRequest } from "next/server";
import { account, dbResult, failure, json } from "@/lib/server-api";
import {
  object,
  exact,
  choice,
  uuid,
  bool,
  text,
  time,
  timezone,
  ApiError,
} from "@/lib/validation";
export async function GET(req: NextRequest) {
  try {
    const { db, user } = await account(req);
    const [n, r, p] = await Promise.all([
      db
        .from("notifications")
        .select("id,title,body,type,read_at,action_url,created_at")
        .eq("user_id", user.id)
        .eq("channel", "in_app")
        .in("status", ["sent", "read"])
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("reminders")
        .select(
          "id,title,module,recurrence,scheduled_for,timezone,enabled,action_step_id,deadline_id",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    return json({
      notifications: dbResult(n),
      reminders: dbResult(r),
      preferences: dbResult(p),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    const { db, user } = await account(req);
    const b = object(await requestJson(req));
    const action = choice(b.action, [
      "deliver",
      "preferences",
      "schedule",
      "toggle",
      "read",
      "readAll",
      "dismiss",
      "deleteReminder",
    ]);
    if (action === "deliver") {
      exact(b, ["action"]);
      return json({
        delivered: dbResult(await db.rpc("deliver_close_ai_reminders")),
      });
    }
    if (action === "preferences") {
      exact(b, ["action", "settings"]);
      const s = object(b.settings);
      exact(s, [
        "inApp",
        "previews",
        "support",
        "academic",
        "cp",
        "developer",
        "quiet",
        "start",
        "end",
        "timezone",
      ]);
      const settings = {
        inApp: bool(s.inApp),
        previews: bool(s.previews),
        support: bool(s.support),
        academic: bool(s.academic),
        cp: bool(s.cp),
        developer: bool(s.developer),
        quiet: bool(s.quiet),
        start: time(s.start),
        end: time(s.end),
        timezone: timezone(s.timezone),
      };
      dbResult(await db.rpc("save_close_ai_notifications", { settings }));
    }
    if (action === "schedule") {
      exact(b, ["action", "settings", "token", "confirmed"]);
      const s = object(b.settings);
      exact(s, [
        "title",
        "module",
        "recurrence",
        "local",
        "stepId",
        "deadlineId",
      ]);
      const local = text(s.local, 16);
      if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(local))
        throw new ApiError(400, "Choose a valid local time.");
      const settings = {
        title: text(s.title),
        module: choice(s.module, ["support", "academic", "cp", "developer"]),
        recurrence: choice(s.recurrence, ["once", "daily", "weekly"]),
        local,
        stepId: s.stepId ? uuid(s.stepId) : null,
        deadlineId: s.deadlineId ? uuid(s.deadlineId) : null,
      };
      return json(
        {
          id: dbResult(
            await db.rpc("schedule_close_ai_reminder", {
              settings,
              token: uuid(b.token),
              confirmed: bool(b.confirmed),
            }),
          ),
        },
        201,
      );
    }
    if (action === "toggle") {
      exact(b, ["action", "id", "enabled"]);
      dbResult(
        await db
          .from("reminders")
          .update({ enabled: bool(b.enabled) })
          .eq("id", uuid(b.id))
          .eq("user_id", user.id),
      );
    }
    if (action === "read") {
      exact(b, ["action", "id", "read"]);
      dbResult(
        await db
          .from("notifications")
          .update({ read_at: bool(b.read) ? new Date().toISOString() : null })
          .eq("id", uuid(b.id))
          .eq("user_id", user.id),
      );
    }
    if (action === "readAll") {
      exact(b, ["action"]);
      dbResult(
        await db
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .is("read_at", null),
      );
    }
    if (action === "dismiss" || action === "deleteReminder") {
      exact(b, ["action", "id"]);
      dbResult(
        await db
          .from(action === "dismiss" ? "notifications" : "reminders")
          .delete()
          .eq("id", uuid(b.id))
          .eq("user_id", user.id),
      );
    }
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
