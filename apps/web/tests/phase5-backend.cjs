const { localDockerEnv } = require("./docker-env.cjs");
const assert = require("node:assert/strict");
const { createClient } = require("@supabase/supabase-js");
const { execFileSync } = require("node:child_process");
const { jwt } = require("./local-gateway.cjs");
function sql(text) {
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
      text,
    ],
    { encoding: "utf8", env: localDockerEnv() },
  ).trim();
}
async function ok(p) {
  const r = await p;
  assert.equal(r.error, null, r.error?.message);
  return r.data;
}
async function denied(p) {
  assert.ok((await p).error);
}
async function user() {
  const db = createClient("http://127.0.0.1:54321", jwt("anon"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const r = await ok(
    db.auth.signUp({
      email: `phase5-${crypto.randomUUID()}@example.test`,
      password: "CloseAI-phase5-fixture-123!",
    }),
  );
  return { db, id: r.user.id };
}
const preferences = {
  inApp: true,
  previews: true,
  support: true,
  academic: true,
  cp: true,
  developer: true,
  quiet: true,
  start: "00:00",
  end: "00:00",
  timezone: "UTC",
};
(async () => {
  const a = await user(),
    b = await user();
  try {
    const settings = {
        title: "Sensitive support fixture must never be previewed",
        module: "support",
        recurrence: "once",
        local: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
      },
      token = crypto.randomUUID();
    await denied(
      a.db.rpc("schedule_close_ai_reminder", {
        settings,
        token,
        confirmed: true,
      }),
    );
    await ok(
      a.db
        .from("modules_enabled")
        .update({ reminders_enabled: true })
        .eq("user_id", a.id),
    );
    await denied(
      a.db.rpc("schedule_close_ai_reminder", {
        settings,
        token,
        confirmed: false,
      }),
    );
    const id = await ok(
      a.db.rpc("schedule_close_ai_reminder", {
        settings,
        token,
        confirmed: true,
      }),
    );
    assert.equal(
      await ok(
        a.db.rpc("schedule_close_ai_reminder", {
          settings,
          token,
          confirmed: true,
        }),
      ),
      id,
    );
    assert.deepEqual(
      await ok(b.db.from("reminders").select().eq("id", id)),
      [],
    );
    await ok(
      a.db
        .from("reminders")
        .update({ scheduled_for: new Date(Date.now() - 60000).toISOString() })
        .eq("id", id),
    );
    assert.equal(await ok(a.db.rpc("deliver_close_ai_reminders")), 0);
    await ok(
      a.db.rpc("save_close_ai_notifications", { settings: preferences }),
    );
    assert.equal(await ok(a.db.rpc("deliver_close_ai_reminders")), 0);
    await ok(
      a.db.rpc("save_close_ai_notifications", {
        settings: { ...preferences, quiet: false },
      }),
    );
    assert.equal(await ok(a.db.rpc("deliver_close_ai_reminders")), 1);
    assert.equal(await ok(a.db.rpc("deliver_close_ai_reminders")), 0);
    const notifications = await ok(a.db.from("notifications").select());
    assert.equal(notifications.length, 1);
    const n = notifications[0];
    assert.equal(n.title, "You have a Close AI reminder.");
    assert.equal(n.body, "Open Close AI to review it.");
    assert.ok(!JSON.stringify(n).includes("Sensitive support"));
    assert.deepEqual(
      await ok(b.db.from("notifications").select().eq("id", n.id)),
      [],
    );
    assert.deepEqual(
      await ok(
        b.db
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("id", n.id)
          .select(),
      ),
      [],
    );
    await denied(
      a.db.from("notifications").update({ title: "forged" }).eq("id", n.id),
    );
    await denied(
      a.db
        .from("notifications")
        .insert({ user_id: a.id, title: "forged", type: "support" }),
    );
    await ok(
      a.db
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", n.id),
    );
    assert.ok(
      (await ok(a.db.from("notifications").select().eq("id", n.id)))[0].read_at,
    );
    await ok(
      a.db.from("notifications").update({ read_at: null }).eq("id", n.id),
    );
    await ok(a.db.from("notifications").delete().eq("id", n.id));
    assert.equal(await ok(a.db.rpc("deliver_close_ai_reminders")), 0);
    const daily = await ok(
      a.db
        .from("reminders")
        .insert({
          user_id: a.id,
          title: "CP practice",
          module: "cp",
          recurrence: "daily",
          timezone: "Europe/London",
          scheduled_for: new Date(Date.now() - 86400000 * 3).toISOString(),
          enabled: true,
        })
        .select()
        .single(),
    );
    await ok(
      a.db.rpc("save_close_ai_notifications", {
        settings: { ...preferences, quiet: false, cp: false },
      }),
    );
    assert.equal(await ok(a.db.rpc("deliver_close_ai_reminders")), 0);
    await ok(
      a.db.rpc("save_close_ai_notifications", {
        settings: { ...preferences, quiet: false, cp: true },
      }),
    );
    assert.equal(await ok(a.db.rpc("deliver_close_ai_reminders")), 1);
    const updated = (
      await ok(a.db.from("reminders").select().eq("id", daily.id))
    )[0];
    assert.ok(Date.parse(updated.scheduled_for) > Date.now());
    assert.equal(await ok(a.db.rpc("deliver_close_ai_reminders")), 0);
    assert.equal(
      await ok(
        a.db.rpc("close_ai_next_reminder", {
          scheduled: "2026-03-28T10:00:00Z",
          cadence: "daily",
          zone: "Europe/London",
          as_of: "2026-03-28T10:00:00Z",
        }),
      ),
      "2026-03-29T09:00:00+00:00",
    );
    assert.equal(
      await ok(
        a.db.rpc("close_ai_next_reminder", {
          scheduled: "2026-10-18T09:00:00Z",
          cadence: "weekly",
          zone: "Europe/London",
          as_of: "2026-10-18T09:00:00Z",
        }),
      ),
      "2026-10-25T10:00:00+00:00",
    );
    await denied(
      a.db.from("reminders").insert({
        user_id: a.id,
        title: "wrong owner",
        module: "support",
        action_step_id: crypto.randomUUID(),
        enabled: true,
      }),
    );
    await denied(
      a.db
        .from("notification_preferences")
        .insert({ user_id: b.id, in_app_enabled: true }),
    );
    await denied(
      a.db.from("profiles").update({ timezone: "Invalid/Zone" }).eq("id", a.id),
    );
    await ok(
      a.db.from("consent_records").insert({
        user_id: a.id,
        consent_type: "notifications",
        granted: false,
      }),
    );
    assert.equal(
      (await ok(a.db.from("notification_preferences").select()))[0]
        .in_app_enabled,
      false,
    );
    console.log(
      "PASS approved/idempotent reminders, generic previews, quiet/disabled/category checks, due/daily/weekly/DST, read/unread/delete and wrong-user RLS",
    );
    await denied(
      a.db.rpc("connect_close_ai_codeforces", {
        handle: "tourist",
        confirmed: false,
      }),
    );
    await ok(
      a.db.rpc("connect_close_ai_codeforces", {
        handle: "tourist",
        confirmed: true,
      }),
    );
    assert.equal(
      (await ok(a.db.from("cp_preferences").select()))[0].codeforces_handle,
      "tourist",
    );
    assert.deepEqual(
      await ok(b.db.from("cp_preferences").select().eq("user_id", a.id)),
      [],
    );
    await denied(
      a.db.rpc("connect_close_ai_codeforces", {
        handle: "https://wrong.test",
        confirmed: true,
      }),
    );
    await ok(
      a.db.from("consent_records").insert({
        user_id: a.id,
        consent_type: "optional_profile_data",
        granted: false,
      }),
    );
    assert.equal(
      (await ok(a.db.from("cp_preferences").select()))[0].codeforces_handle,
      null,
    );
    await ok(
      a.db
        .from("cp_manual_progress")
        .upsert({ user_id: a.id, problem_key: "p1", status: "need_hint" }),
    );
    await ok(
      a.db
        .from("cp_manual_progress")
        .upsert({ user_id: a.id, problem_key: "p1", status: "upsolved" }),
    );
    await ok(
      a.db.from("learning_progress").insert({
        user_id: a.id,
        kind: "visual",
        topic_key: "bfs",
        status: "viewed",
        position: 2,
      }),
    );
    await ok(
      a.db.from("learning_progress").insert({
        user_id: a.id,
        kind: "project",
        topic_key: "frontend",
        status: "paused",
      }),
    );
    assert.deepEqual(
      await ok(b.db.from("learning_progress").select().eq("user_id", a.id)),
      [],
    );
    await denied(
      b.db.from("learning_progress").insert({
        user_id: a.id,
        kind: "visual",
        topic_key: "dfs",
        status: "completed",
      }),
    );
    await ok(
      b.db
        .from("learning_tasks")
        .insert({ user_id: b.id, title: "Keep other student task" }),
    );
    await ok(a.db.rpc("erase_close_ai_data"));
    for (const table of [
      "notification_preferences",
      "notifications",
      "reminders",
      "cp_preferences",
      "cp_manual_progress",
      "learning_progress",
    ])
      assert.deepEqual(await ok(a.db.from(table).select()), []);
    assert.equal((await ok(b.db.from("learning_tasks").select())).length, 1);
    assert.equal(
      sql(
        "select count(*) from pg_tables where schemaname='public' and not rowsecurity",
      ),
      "0",
    );
    console.log(
      "PASS explicit integration consent/disconnect, CP/visual/project persistence, learning/support separation, own-data reset and RLS on all public tables",
    );
  } finally {
    a.db.auth.stopAutoRefresh();
    b.db.auth.stopAutoRefresh();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
