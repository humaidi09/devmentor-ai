import type { NextRequest } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { dbResult, json, failure } from "@/lib/server-api";
import { id } from "@/lib/validation";
export async function GET(req: NextRequest) {
  try {
    const db = await serverSupabase();
    let query = db
      .from("support_resources")
      .select("*,resource_sources(source_title,source_url,checked_at)")
      .order("name")
      .limit(100);
    const campus = req.nextUrl.searchParams.get("campus");
    if (campus) query = query.eq("campus_id", id(campus));
    const resource = req.nextUrl.searchParams.get("id");
    if (resource) query = query.eq("id", id(resource));
    const rows = dbResult(await query);
    const campuses = dbResult(
      await db.from("campuses").select("id,name,status").order("name"),
    );
    const categories = dbResult(
      await db
        .from("support_categories")
        .select("id,label,label_bn")
        .order("label"),
    );
    return json({
      resources: rows.map((r) => ({
        id: r.id,
        campusId: r.campus_id,
        category: r.category_id,
        name: r.name,
        description: r.description,
        eligibility: r.eligibility_summary,
        cost: r.cost_summary,
        location: r.location_summary,
        officialContact: r.contact_summary,
        source: {
          label: r.resource_sources?.[0]?.source_title ?? "Source not provided",
          url: r.resource_sources?.[0]?.source_url ?? r.official_url ?? "",
        },
        verification:
          r.verification_state === "verified" &&
          ((r.next_review_at && Date.parse(r.next_review_at) <= Date.now()) ||
            (r.time_sensitive_date &&
              Date.parse(r.time_sensitive_date) <= Date.now()))
            ? "expired"
            : r.verification_state,
        lastCheckedAt: r.last_verified_at,
        nextReviewAt: r.next_review_at,
        timeSensitiveDate: r.time_sensitive_date,
        isDemo: r.is_demo,
      })),
      campuses,
      categories: categories.map((c) => ({
        id: c.id,
        label: c.label,
        labelBn: c.label_bn,
      })),
    });
  } catch (e) {
    return failure(e);
  }
}
