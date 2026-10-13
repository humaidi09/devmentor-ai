const { localDockerEnv } = require("./docker-env.cjs");
const assert = require("node:assert/strict");
const { createClient } = require("@supabase/supabase-js");
const { execFileSync } = require("node:child_process");
const { jwt } = require("./local-gateway.cjs");
const url = "http://127.0.0.1:54321",
  key = jwt("anon");
const password = "Close-AI-test-password-927!";
const clients = [];
function sql(statement) {
  return execFileSync(
    "docker",
    [
      "--host=unix:///var/run/docker.sock",
      "compose",
      "-p",
      "close-ai-phase3",
      "-f",
      "../../supabase/compose.test.yml",
      "exec",
      "-T",
      "db",
      "psql",
      "-U",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-Atc",
      statement,
    ],
    { encoding: "utf8", env: localDockerEnv() },
  ).trim();
}
async function user(label) {
  const db = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  clients.push(db);
  const email = `phase3-${label}-${crypto.randomUUID()}@example.test`;
  const result = await db.auth.signUp({ email, password });
  assert.equal(result.error, null, result.error?.message);
  assert.ok(result.data.session);
  return { db, id: result.data.user.id, email };
}
async function ok(result) {
  const value = await result;
  assert.equal(value.error, null, value.error?.message);
  return value.data;
}
async function denied(result) {
  const value = await result;
  assert.ok(value.error, "Expected database rejection");
}
(async () => {
  try {
    const a = await user("a"),
      b = await user("b"),
      m = await user("maintainer"),
      r = await user("reviewer");
    await ok(a.db.auth.signOut());
    assert.equal((await a.db.auth.getUser()).data.user, null);
    await ok(a.db.auth.signInWithPassword({ email: a.email, password }));
    assert.equal((await a.db.auth.getUser()).data.user.id, a.id);
    console.log(
      "PASS real local Supabase signup, signin, signout and session validation",
    );
    assert.equal(
      (await ok(a.db.from("profiles").select("id").eq("id", b.id))).length,
      0,
    );
    assert.equal(
      (
        await ok(
          a.db
            .from("profiles")
            .update({ display_name: "intrusion" })
            .eq("id", b.id)
            .select(),
        )
      ).length,
      0,
    );
    assert.equal(
      (await ok(a.db.from("modules_enabled").select().eq("user_id", b.id)))
        .length,
      0,
    );
    await denied(
      a.db
        .from("resource_roles")
        .insert({ user_id: a.id, campus_id: "demo-u", role: "admin" }),
    );
    await denied(
      a.db
        .from("profiles")
        .update({ display_name: "Optional name" })
        .eq("id", a.id),
    );
    await ok(
      a.db.from("consent_records").insert({
        user_id: a.id,
        consent_type: "optional_profile_data",
        granted: true,
      }),
    );
    await ok(
      a.db
        .from("profiles")
        .update({ display_name: "Consented name" })
        .eq("id", a.id),
    );
    await denied(
      a.db
        .from("saved_resources")
        .insert({ user_id: a.id, resource_id: "r-house-office" }),
    );
    await ok(
      a.db.from("consent_records").insert({
        user_id: a.id,
        consent_type: "support_data_storage",
        granted: true,
      }),
    );
    await ok(
      b.db.from("consent_records").insert({
        user_id: b.id,
        consent_type: "support_data_storage",
        granted: true,
      }),
    );
    await ok(
      a.db
        .from("saved_resources")
        .insert({ user_id: a.id, resource_id: "r-house-office" }),
    );
    await ok(
      a.db
        .from("saved_resources")
        .delete()
        .eq("user_id", a.id)
        .eq("resource_id", "r-house-office"),
    );
    assert.equal((await ok(a.db.from("saved_resources").select())).length, 0);
    await ok(
      a.db
        .from("saved_resources")
        .insert({ user_id: a.id, resource_id: "r-house-office" }),
    );
    assert.equal((await ok(b.db.from("saved_resources").select())).length, 0);
    await denied(
      b.db
        .from("saved_resources")
        .insert({ user_id: a.id, resource_id: "r-house-office" }),
    );
    await ok(a.db.from("saved_knowledge").insert({
      user_id: a.id, external_id: "crossref:10.1234/test", provider: "crossref",
      category: "research", collection: "study", title: "Test paper",
      url: "https://doi.org/10.1234/test", source: "Crossref", summary: "Metadata",
      retrieved_at: new Date().toISOString(),
    }));
    assert.equal((await ok(a.db.from("saved_knowledge").select())).length, 1);
    assert.equal((await ok(b.db.from("saved_knowledge").select())).length, 0);
    await denied(b.db.from("saved_knowledge").insert({
      user_id: a.id, external_id: "crossref:forged", provider: "crossref",
      category: "research", title: "Forgery", url: "https://doi.org/test",
      source: "Crossref", retrieved_at: new Date().toISOString(),
    }));
    await ok(a.db.from("cp_manual_progress").upsert({
      user_id: a.id, problem_key: "lc-two-sum", status: "upsolve", attempts: 1,
      first_attempt_at: new Date().toISOString(),
    }));
    assert.equal((await ok(a.db.from("cp_manual_progress").select("status")))[0].status, "upsolve");
    assert.equal((await ok(b.db.from("cp_manual_progress").select())).length, 0);
    const plan = await ok(
      a.db
        .from("action_plans")
        .insert({ user_id: a.id, title: "My private plan" })
        .select()
        .single(),
    );
    const step = await ok(
      a.db
        .from("action_steps")
        .insert({
          user_id: a.id,
          action_plan_id: plan.id,
          title: "Private first step",
        })
        .select()
        .single(),
    );
    const second = await ok(
      a.db
        .from("action_steps")
        .insert({
          user_id: a.id,
          action_plan_id: plan.id,
          title: "Private second step",
          position: 1,
        })
        .select()
        .single(),
    );
    assert.equal((await ok(b.db.from("action_plans").select())).length, 0);
    assert.equal((await ok(b.db.from("action_steps").select())).length, 0);
    await denied(
      b.db.from("action_steps").insert({
        user_id: b.id,
        action_plan_id: plan.id,
        title: "Wrong parent",
      }),
    );
    assert.equal(
      (
        await ok(
          b.db
            .from("action_steps")
            .update({ title: "Hacked" })
            .eq("id", step.id)
            .select(),
        )
      ).length,
      0,
    );
    await denied(
      b.db.rpc("reorder_close_ai_steps", {
        plan: plan.id,
        ordered: [step.id, second.id],
      }),
    );
    await denied(
      a.db.rpc("reorder_close_ai_steps", {
        plan: plan.id,
        ordered: [step.id, step.id],
      }),
    );
    await ok(
      a.db.rpc("reorder_close_ai_steps", {
        plan: plan.id,
        ordered: [second.id, step.id],
      }),
    );
    assert.equal(
      (await ok(a.db.from("action_steps").select("id").order("position")))[0]
        .id,
      second.id,
    );
    await denied(
      a.db
        .from("reminders")
        .insert({ user_id: a.id, action_step_id: step.id, enabled: true }),
    );
    await ok(
      a.db
        .from("modules_enabled")
        .update({ reminders_enabled: true })
        .eq("user_id", a.id),
    );
    assert.equal(
      (
        await ok(
          a.db.from("consent_records").select().eq("consent_type", "reminders"),
        )
      )[0].granted,
      true,
    );
    await ok(
      a.db
        .from("reminders")
        .insert({ user_id: a.id, action_step_id: step.id, enabled: true }),
    );
    await ok(
      a.db
        .from("modules_enabled")
        .update({ reminders_enabled: false })
        .eq("user_id", a.id),
    );
    assert.equal((await ok(a.db.from("reminders").select()))[0].enabled, false);
    const course = await ok(
      b.db
        .from("courses")
        .insert({ user_id: b.id, title: "B private course" })
        .select()
        .single(),
    );
    await denied(
      a.db.from("deadlines").insert({
        user_id: a.id,
        course_id: course.id,
        title: "Wrong owner",
        type: "assignment",
        due_at: "2027-01-01",
      }),
    );
    console.log(
      "PASS two-user RLS, cross-parent ownership, explicit consent, reminder withdrawal and atomic reordering",
    );
    sql(
      `insert into public.resource_roles(user_id,campus_id,role) values('${m.id}','demo-u','resource_maintainer'),('${r.id}','demo-u','resource_reviewer');`,
    );
    assert.equal(
      (await ok(m.db.from("profiles").select().eq("id", a.id))).length,
      0,
    );
    assert.equal((await ok(m.db.from("action_plans").select())).length, 0);
    await denied(
      a.db.from("support_resources").insert({
        campus_id: "demo-u",
        category_id: "academic",
        name: "Student-created resource",
      }),
    );
    await denied(
      m.db.from("support_resources").insert({
        campus_id: "demo-u",
        category_id: "academic",
        name: "Fake verification",
        verification_state: "verified",
      }),
    );
    const resource = await ok(
      m.db
        .from("support_resources")
        .insert({
          campus_id: "demo-u",
          category_id: "academic",
          name: "DEMO test resource",
          is_demo: true,
        })
        .select()
        .single(),
    );
    assert.equal(
      (await ok(a.db.from("support_resources").select().eq("id", resource.id)))
        .length,
      0,
    );
    await denied(
      m.db
        .from("support_resources")
        .update({
          verification_state: "needs_review",
          last_verified_at: new Date().toISOString(),
        })
        .eq("id", resource.id),
    );
    await denied(
      m.db.rpc("review_resource", {
        resource: resource.id,
        state: "verified",
        note: "Not a reviewer",
      }),
    );
    await denied(
      r.db.rpc("review_resource", {
        resource: resource.id,
        state: "verified",
        note: "Missing checked evidence",
      }),
    );
    await ok(
      m.db.from("resource_sources").insert({
        resource_id: resource.id,
        source_title: "DEMO source",
        source_url: "https://example.test/demo",
        checked_at: new Date().toISOString(),
      }),
    );
    await ok(
      m.db
        .from("support_resources")
        .update({ verification_state: "needs_review" })
        .eq("id", resource.id),
    );
    assert.equal(
      (await ok(a.db.from("support_resources").select().eq("id", resource.id)))
        .length,
      0,
    );
    await ok(
      r.db.rpc("review_resource", {
        resource: resource.id,
        state: "verified",
        note: "Fictional fixture reviewed",
      }),
    );
    assert.equal(
      (
        await ok(a.db.from("support_resources").select().eq("id", resource.id))
      )[0].verification_state,
      "verified",
    );
    assert.equal(
      (await ok(a.db.from("resource_verification_events").select())).length,
      0,
    );
    await denied(
      r.db
        .from("support_resources")
        .update({ name: "Reviewer editing content" })
        .eq("id", resource.id),
    );
    await denied(
      m.db
        .from("support_resources")
        .update({ is_demo: false })
        .eq("id", resource.id),
    );
    await ok(
      m.db
        .from("support_resources")
        .update({ description: "Changed information" })
        .eq("id", resource.id),
    );
    assert.equal(
      (
        await ok(a.db.from("support_resources").select().eq("id", resource.id))
      )[0].verification_state,
      "needs_review",
    );
    const events = await ok(
      r.db
        .from("resource_verification_events")
        .select()
        .eq("resource_id", resource.id),
    );
    assert.ok(events.some((e) => e.note === "Fictional fixture reviewed"));
    await denied(
      a.db
        .from("resource_verification_events")
        .insert({ resource_id: resource.id, new_state: "verified" }),
    );
    await denied(a.db.from("conversations").select());
    await denied(m.db.from("conversations").select());
    await denied(r.db.from("chat_messages").select());
    console.log(
      "PASS student/staff separation, campus roles, checked verification, audit notes, immutable DEMO and edit downgrade",
    );
    await ok(
      a.db
        .from("action_steps")
        .update({ status: "not_relevant" })
        .eq("id", step.id),
    );
    assert.equal(
      (
        await ok(a.db.from("action_steps").select("status").eq("id", step.id))
      )[0].status,
      "not_relevant",
    );
    await ok(a.db.from("action_steps").delete().eq("id", step.id));
    assert.equal((await ok(a.db.from("reminders").select())).length, 0);
    await ok(a.db.rpc("erase_close_ai_data"));
    assert.equal((await ok(a.db.from("action_plans").select())).length, 0);
    assert.equal((await ok(a.db.from("saved_resources").select())).length, 0);
    assert.equal((await ok(a.db.from("saved_knowledge").select())).length, 0);
    assert.equal((await ok(b.db.from("courses").select()))[0].id, course.id);
    console.log("PASS transactional own-data reset preserves another user");
    const tables = sql(
      `select count(*) from pg_tables where schemaname='public' and not rowsecurity;`,
    );
    assert.equal(tables, "0");
    console.log("PASS RLS enabled on every public table");
  } finally {
    clients.forEach((c) => c.auth.stopAutoRefresh());
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
