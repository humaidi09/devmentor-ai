import { writeFileSync } from "node:fs";
import { DEMO_CATEGORIES, DEMO_RESOURCES } from "../apps/web/src/lib/demo-data";
const q = (v: string | null | undefined) =>
  v == null ? "null" : "'" + v.replaceAll("'", "''") + "'";
const rows = [
  `-- Fictional Close AI seed only. Run after all migrations; safe to re-run.\nbegin;\ninsert into public.campuses(id,name,status) values('demo-u','Demo University — fictional','demo') on conflict(id) do nothing;`,
];
for (const c of DEMO_CATEGORIES)
  rows.push(
    `insert into public.support_categories(id,label,label_bn) values(${q(c.id)},${q(c.label)},${q(c.labelBn)}) on conflict(id) do nothing;`,
  );
for (const r of DEMO_RESOURCES) {
  rows.push(
    `insert into public.support_resources(id,campus_id,category_id,name,description,eligibility_summary,cost_summary,location_summary,contact_summary,official_url,verification_state,last_verified_at,next_review_at,time_sensitive_date,is_demo) values(${[r.id, r.campusId, r.category, r.name, r.description, r.eligibility, r.cost, r.location, r.officialContact, r.source.url, "draft", r.lastCheckedAt, r.nextReviewAt, r.timeSensitiveDate].map(q).join(",")},true) on conflict(id) do nothing;`,
  );
  rows.push(
    `insert into public.resource_sources(resource_id,source_title,source_url,source_type,checked_at) select ${q(r.id)},${q(r.source.label)},${q(r.source.url)},'demo',${q(r.lastCheckedAt)} where not exists(select 1 from public.resource_sources where resource_id=${q(r.id)} and source_url=${q(r.source.url)});`,
  );
  rows.push(
    `update public.support_resources set verification_state=${q(r.verification)},last_verified_at=${q(r.lastCheckedAt)} where id=${q(r.id)} and verification_state='draft';`,
  );
}
rows.push("commit;");
writeFileSync("supabase/seed-demo.sql", rows.join("\n") + "\n");
