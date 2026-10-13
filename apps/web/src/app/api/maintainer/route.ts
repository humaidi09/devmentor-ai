import type { NextRequest } from "next/server";
import { account, dbResult, json, failure } from "@/lib/server-api";
import {
  object,
  exact,
  id,
  text,
  https,
  date,
  choice,
  bool,
  uuid,
  ApiError,
} from "@/lib/validation";
export async function GET(req: NextRequest) {
  try {
    const { db, user } = await account(req);
    const roles = dbResult(
      await db
        .from("resource_roles")
        .select("campus_id,role")
        .eq("user_id", user.id),
    );
    if (!roles.length)
      throw new ApiError(403, "Resource workspace is restricted.");
    const resources = dbResult(
      await db
        .from("support_resources")
        .select("*,resource_sources(*)")
        .in(
          "campus_id",
          roles.map((r) => r.campus_id),
        )
        .order("updated_at", { ascending: false })
        .limit(100),
    );
    const events = resources.length
      ? dbResult(
          await db
            .from("resource_verification_events")
            .select("id,resource_id,previous_state,new_state,note,created_at")
            .in(
              "resource_id",
              resources.map((r) => r.id),
            )
            .order("created_at", { ascending: false })
            .limit(100),
        )
      : [];
    return json({ roles, resources, events });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    const { db, user } = await account(req);
    const b = object(await req.json());
    const action = choice(b.action, [
      "create",
      "edit",
      "submit",
      "source",
      "review",
    ]);
    const resourceId = action === "create" ? null : id(b.id);
    const current = resourceId
      ? dbResult(
          await db
            .from("support_resources")
            .select("campus_id")
            .eq("id", resourceId)
            .maybeSingle(),
        )
      : null;
    const campus = action === "create" ? id(b.campus_id) : current?.campus_id;
    if (!campus) throw new ApiError(404, "Resource not found.");
    const allowed =
      action === "review"
        ? ["resource_reviewer", "admin"]
        : ["resource_maintainer", "admin"];
    const roles = dbResult(
      await db
        .from("resource_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("campus_id", campus)
        .in("role", allowed),
    );
    if (!roles.length) throw new ApiError(403, "Permission denied.");
    if (action === "create" || action === "edit") {
      exact(b, [
        "action",
        "id",
        "campus_id",
        "category_id",
        "name",
        "description",
        "eligibility_summary",
        "cost_summary",
        "location_summary",
        "contact_summary",
        "official_url",
        "is_demo",
        "next_review_at",
      ]);
      const value = {
        category_id: id(b.category_id),
        name: text(b.name),
        description: text(b.description, 4000, true),
        eligibility_summary: text(b.eligibility_summary ?? "", 2000, true),
        cost_summary: text(b.cost_summary ?? "", 500, true),
        location_summary: text(b.location_summary ?? "", 500, true),
        contact_summary: text(b.contact_summary ?? "", 500, true),
        official_url: b.official_url ? https(b.official_url) : null,
        next_review_at: b.next_review_at ? date(b.next_review_at) : null,
      };
      if (action === "create") {
        dbResult(
          await db
            .from("support_resources")
            .insert({ ...value, campus_id: campus, is_demo: bool(b.is_demo) }),
        );
      } else {
        dbResult(
          await db
            .from("support_resources")
            .update(value)
            .eq("id", resourceId!),
        );
      }
    } else if (action === "submit") {
      exact(b, ["action", "id"]);
      dbResult(
        await db
          .from("support_resources")
          .update({ verification_state: "needs_review" })
          .eq("id", resourceId!),
      );
    } else if (action === "source") {
      exact(b, ["action", "id", "url", "title", "checkedAt"]);
      dbResult(
        await db.from("resource_sources").insert({
          resource_id: resourceId,
          source_url: https(b.url),
          source_title: text(b.title),
          checked_at: b.checkedAt ? date(b.checkedAt) : null,
        }),
      );
    } else {
      exact(b, ["action", "id", "state", "note"]);
      dbResult(
        await db.rpc("review_resource", {
          resource: resourceId,
          state: choice(b.state, [
            "verified",
            "unverified",
            "expired",
            "archived",
            "needs_review",
          ]),
          note: text(b.note, 1000),
        }),
      );
    }
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
