import type { NextRequest } from "next/server";
import {
  account,
  dbResult,
  failure,
  json,
  storageConsent,
} from "@/lib/server-api";
import {
  object,
  exact,
  text,
  id,
  uuid,
  bool,
  date,
  integer,
  choice,
  STEP_STATUSES,
  CONSENT_TYPES,
  validatePreferences,
  ApiError,
} from "@/lib/validation";
type Context = { params: Promise<{ kind: string }> };
async function write(req: NextRequest, ctx: Context) {
  try {
    const { db, user } = await account(req);
    const { kind } = await ctx.params;
    const b = object(await req.json());
    const uid = user.id;
    const method = req.method;
    if (kind === "preferences" && method === "POST") {
      dbResult(
        await db.rpc("save_close_ai_preferences", {
          settings: validatePreferences(b),
        }),
      );
    } else if (kind === "saved") {
      exact(b, ["resourceId"]);
      const resourceId = id(b.resourceId);
      if (method === "POST") {
        await storageConsent(db, uid);
        dbResult(
          await db
            .from("saved_resources")
            .upsert(
              { user_id: uid, resource_id: resourceId },
              { onConflict: "user_id,resource_id" },
            ),
        );
      } else if (method === "DELETE") {
        dbResult(
          await db
            .from("saved_resources")
            .delete()
            .eq("user_id", uid)
            .eq("resource_id", resourceId),
        );
      } else throw new ApiError(405, "Method not allowed.");
    } else if (kind === "consent" && method === "POST") {
      exact(b, ["type", "granted"]);
      const type = choice(b.type, CONSENT_TYPES);
      if (type === "reminders")
        throw new ApiError(400, "Use reminder preferences.");
      dbResult(
        await db.from("consent_records").insert({
          user_id: uid,
          consent_type: type,
          granted: bool(b.granted),
        }),
      );
    } else if (kind === "plans") {
      if (method === "POST") {
        exact(b, ["title", "resourceId"]);
        await storageConsent(db, uid);
        const data = dbResult(
          await db
            .from("action_plans")
            .insert({
              user_id: uid,
              title: text(b.title),
              related_resource_id: b.resourceId ? id(b.resourceId) : null,
            })
            .select("id")
            .single(),
        );
        return json(data, 201);
      }
      if (method === "DELETE") {
        exact(b, ["id"]);
        dbResult(
          await db
            .from("action_plans")
            .delete()
            .eq("id", uuid(b.id))
            .eq("user_id", uid),
        );
      } else throw new ApiError(405, "Method not allowed.");
    } else if (kind === "steps") {
      if (method === "POST") {
        exact(b, ["planId", "title"]);
        await storageConsent(db, uid);
        const planId = uuid(b.planId);
        const positions = dbResult(
          await db
            .from("action_steps")
            .select("position")
            .eq("action_plan_id", planId)
            .eq("user_id", uid)
            .order("position", { ascending: false })
            .limit(1),
        );
        dbResult(
          await db.from("action_steps").insert({
            user_id: uid,
            action_plan_id: planId,
            title: text(b.title),
            position: (positions?.[0]?.position ?? -1) + 1,
          }),
        );
      } else if (method === "PATCH") {
        exact(b, ["id", "title", "status", "position"]);
        const value: Record<string, string | number> = {};
        if ("title" in b) value.title = text(b.title);
        if ("status" in b) value.status = choice(b.status, STEP_STATUSES);
        if ("position" in b) value.position = integer(b.position);
        const data = dbResult(
          await db
            .from("action_steps")
            .update(value)
            .eq("id", uuid(b.id))
            .eq("user_id", uid)
            .select("id"),
        );
        if (!data.length) throw new ApiError(404, "Step not found.");
      } else if (method === "DELETE") {
        exact(b, ["id"]);
        dbResult(
          await db
            .from("action_steps")
            .delete()
            .eq("id", uuid(b.id))
            .eq("user_id", uid),
        );
      } else throw new ApiError(405, "Method not allowed.");
    } else if (kind === "reorder" && method === "POST") {
      exact(b, ["planId", "ids"]);
      if (!Array.isArray(b.ids) || b.ids.length > 100)
        throw new ApiError(400, "Invalid order.");
      const ids = b.ids.map(uuid);
      if (new Set(ids).size !== ids.length)
        throw new ApiError(400, "Duplicate step.");
      dbResult(
        await db.rpc("reorder_close_ai_steps", {
          plan: uuid(b.planId),
          ordered: ids,
        }),
      );
    } else if (kind === "reminders" && method === "POST") {
      exact(b, ["stepId", "enabled", "scheduledFor"]);
      dbResult(
        await db.from("reminders").upsert(
          {
            user_id: uid,
            action_step_id: uuid(b.stepId),
            enabled: bool(b.enabled),
            scheduled_for:
              b.scheduledFor === undefined ? null : date(b.scheduledFor),
          },
          { onConflict: "user_id,action_step_id" },
        ),
      );
    } else if (kind === "developer" && method === "POST") {
      exact(b, ["pathway", "milestone", "completed"]);
      dbResult(
        await db.from("developer_path_progress").upsert(
          {
            user_id: uid,
            pathway: id(b.pathway),
            milestone_key: id(b.milestone),
            status: bool(b.completed) ? "completed" : "not_started",
          },
          { onConflict: "user_id,pathway,milestone_key" },
        ),
      );
    } else if (kind === "cp" && method === "POST") {
      exact(b, ["problem", "status"]);
      dbResult(
        await db.from("cp_manual_progress").upsert(
          {
            user_id: uid,
            problem_key: id(b.problem),
            status: choice(b.status, [
              "none",
              "attempted",
              "solved",
              "skipped",
              "need_hint",
              "upsolved",
            ]),
          },
          { onConflict: "user_id,problem_key" },
        ),
      );
    } else if (kind === "cp-handle") {
      throw new ApiError(
        400,
        "Preview and confirm the Codeforces connection in CP Coach.",
      );
    } else if (kind === "study-tasks") {
      if (method === "POST") {
        exact(b, ["title", "plannedFor"]);
        dbResult(
          await db.from("learning_tasks").insert({
            user_id: uid,
            title: text(b.title),
            planned_for: b.plannedFor === undefined ? null : date(b.plannedFor),
          }),
        );
      } else if (method === "PATCH") {
        exact(b, ["id", "completed", "title", "plannedFor"]);
        const changes: Record<string, unknown> = {};
        if ("completed" in b) changes.completed = bool(b.completed);
        if ("title" in b) changes.title = text(b.title);
        if ("plannedFor" in b) changes.planned_for = date(b.plannedFor);
        dbResult(
          await db
            .from("learning_tasks")
            .update(changes)
            .eq("id", uuid(b.id))
            .eq("user_id", uid),
        );
      } else if (method === "DELETE") {
        exact(b, ["id"]);
        dbResult(
          await db
            .from("learning_tasks")
            .delete()
            .eq("id", uuid(b.id))
            .eq("user_id", uid),
        );
      } else throw new ApiError(405, "Method not allowed.");
    } else if (kind === "courses") {
      if (method === "POST") {
        exact(b, ["title", "code"]);
        dbResult(
          await db.from("courses").insert({
            user_id: uid,
            title: text(b.title),
            code: text(b.code ?? "", 20, true),
          }),
        );
      } else if (method === "DELETE") {
        exact(b, ["id"]);
        dbResult(
          await db
            .from("courses")
            .delete()
            .eq("id", uuid(b.id))
            .eq("user_id", uid),
        );
      } else throw new ApiError(405, "Method not allowed.");
    } else if (kind === "deadlines") {
      if (method === "POST") {
        exact(b, ["title", "courseId", "dueAt"]);
        const due = date(b.dueAt);
        if (!due) throw new ApiError(400, "Due date required.");
        dbResult(
          await db.from("deadlines").insert({
            user_id: uid,
            title: text(b.title),
            course_id: b.courseId ? uuid(b.courseId) : null,
            due_at: due,
            type: "assignment",
          }),
        );
      } else if (method === "PATCH") {
        exact(b, ["id", "status"]);
        dbResult(
          await db
            .from("deadlines")
            .update({
              status: choice(b.status, ["pending", "completed", "cancelled"]),
            })
            .eq("id", uuid(b.id))
            .eq("user_id", uid),
        );
      } else if (method === "DELETE") {
        exact(b, ["id"]);
        dbResult(
          await db
            .from("deadlines")
            .delete()
            .eq("id", uuid(b.id))
            .eq("user_id", uid),
        );
      } else throw new ApiError(405, "Method not allowed.");
    } else throw new ApiError(404, "Operation not found.");
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export const POST = write;
export const PATCH = write;
export const DELETE = write;
export async function GET(req: NextRequest, ctx: Context) {
  try {
    const { db, user } = await account(req);
    const { kind } = await ctx.params;
    if (kind !== "study") throw new ApiError(404, "Not found.");
    const courses = dbResult(
      await db
        .from("courses")
        .select("id,title,code")
        .eq("user_id", user.id)
        .order("created_at"),
    );
    const deadlines = dbResult(
      await db
        .from("deadlines")
        .select("id,title,due_at,status,course_id")
        .eq("user_id", user.id)
        .order("due_at"),
    );
    const tasks = dbResult(
      await db
        .from("learning_tasks")
        .select("id,title,completed,planned_for")
        .eq("user_id", user.id)
        .order("created_at"),
    );
    return json({ courses, deadlines, tasks });
  } catch (e) {
    return failure(e);
  }
}
