import { requestJson } from "@/lib/validation/request";
import type { NextRequest } from "next/server";
import { account, dbResult, failure, json } from "@/lib/server-api";
import { object, exact, choice, id, integer, ApiError } from "@/lib/validation";
import { TOPICS } from "@/lib/visual/topics";
import { DEMO_PATHWAYS } from "@/lib/modules-data";
export async function POST(req: NextRequest) {
  try {
    const { db, user } = await account(req);
    const b = object(await requestJson(req));
    exact(b, ["kind", "key", "status", "position"]);
    const kind = choice(b.kind, ["visual", "project"]),
      key = id(b.key);
    const topic = TOPICS.find((t) => t.id === key);
    if (
      (kind === "visual" && !topic) ||
      (kind === "project" && !DEMO_PATHWAYS.some((p) => p.id === key))
    )
      throw new ApiError(400, "Unknown learning topic.");
    const status = choice(
      b.status,
      kind === "visual"
        ? ["viewed", "completed"]
        : ["planned", "started", "in_progress", "completed", "paused"],
    );
    const position =
      kind === "visual" ? integer(b.position ?? 0, topic!.steps.length - 1) : 0;
    dbResult(
      await db
        .from("learning_progress")
        .upsert(
          { user_id: user.id, kind, topic_key: key, status, position },
          { onConflict: "user_id,kind,topic_key" },
        ),
    );
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: NextRequest) {
  try {
    const { db, user } = await account(req);
    const b = object(await requestJson(req));
    exact(b, ["kind", "key"]);
    dbResult(
      await db
        .from("learning_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("kind", choice(b.kind, ["visual", "project"]))
        .eq("topic_key", id(b.key)),
    );
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
