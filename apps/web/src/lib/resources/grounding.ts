import type { SupportResource } from "../types";
export function safeSource(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && !u.username && !u.password ? u.href : "";
  } catch {
    return "";
  }
}
export function currentResource(
  r: SupportResource,
  campus: string | null,
  now = Date.now(),
) {
  return (
    r.verification === "verified" &&
    !!r.lastCheckedAt &&
    !!safeSource(r.source.url) &&
    (!campus || r.campusId === campus) &&
    (!r.nextReviewAt || Date.parse(r.nextReviewAt) > now) &&
    (!r.timeSensitiveDate || Date.parse(r.timeSensitiveDate) > now)
  );
}
export function rankResources(
  rows: SupportResource[],
  campus: string | null,
  intent: string | null,
  query: string,
  now = Date.now(),
) {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return rows
    .filter(
      (r) =>
        currentResource(r, campus, now) && (!intent || r.category === intent),
    )
    .map((r) => ({
      r,
      score: words.reduce(
        (n, w) =>
          n + Number(`${r.name} ${r.description}`.toLowerCase().includes(w)),
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score || a.r.name.localeCompare(b.r.name))
    .slice(0, 3)
    .map((x) => x.r);
}
export function resourceDto(r: Record<string, any>): SupportResource {
  // DB rows only, never provider output
  return {
    id: r.id,
    campusId: r.campus_id,
    category: r.category_id,
    name: r.name,
    description: r.description,
    eligibility: r.eligibility_summary ?? "",
    cost: r.cost_summary,
    location: r.location_summary ?? "",
    officialContact: r.contact_summary,
    source: {
      label: r.resource_sources?.[0]?.source_title ?? "Official source",
      url: safeSource(
        r.resource_sources?.[0]?.source_url ?? r.official_url ?? "",
      ),
    },
    verification: r.verification_state,
    lastCheckedAt: r.last_verified_at,
    nextReviewAt: r.next_review_at,
    timeSensitiveDate: r.time_sensitive_date,
    isDemo: r.is_demo,
  };
}
