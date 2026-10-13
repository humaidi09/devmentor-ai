# Close AI database

Migrations 0001–0004 preserve the older DevMentor schema. Apply them in order before 0005 (Close AI core/RLS/roles), 0006 (atomic ordering, consent/data controls, study tasks), and later migrations through 0010 (saved knowledge and CP progress). Do not rename or rewrite already-applied versions.

`seed-demo.sql` contains only fictional Close AI campus/resources/categories and is re-runnable. Every synthetic resource has `is_demo=true`; it grants no student/staff permissions and creates no Auth users. `seed.sql` is the old snippet seed and is not needed for Close AI. Regenerate the new seed from the repository root with `apps/web/node_modules/.bin/tsx scripts/seed-close-ai.ts`.

Hosted workflow: link the intended Supabase project, inspect the migration impact, then use `supabase db push`. Seed using a trusted SQL operator. Do not run `db reset` against hosted user data. 0005 revokes client access to unused old private tables and adds a cross-owner course constraint; inspect old inconsistent relationships before applying it to a shared legacy deployment.

For disposable local verification, use `bash supabase/test-stack.sh reset`. The fixture uses actual PostgreSQL, GoTrue and PostgREST on loopback and public test-only credentials. `tests/auth-compat.sql` adapts standalone GoTrue's old UID bootstrap to modern PostgREST JSON JWT claims; it is **not a hosted application migration**. Operator grants are exercised only inside this disposable stack.

Every application table has RLS. Campus resource roles do not grant private student access. Only a reviewer can verify a resource with checked evidence; edits invalidate verified content and append internal audit events. Student-owned relationships enforce parent ownership independently of frontend filtering.

See [web setup/test commands](../apps/web/README.md) and [Phase 3 report](../PHASE_3_REPORT.md).
