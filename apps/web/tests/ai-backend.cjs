const assert = require("node:assert/strict");
const { createClient } = require("@supabase/supabase-js");
const { jwt } = require("./local-gateway.cjs");
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
      email: `phase4-${crypto.randomUUID()}@example.test`,
      password: "CloseAI-fixture-password-123!",
    }),
  );
  return { db, id: r.user.id };
}
(async () => {
  const a = await user(),
    b = await user();
  try {
    const rows = await ok(
      a.db.rpc("search_close_ai_resources", {
        campus: "demo-u",
        category: "financial",
        search_text: "tuition",
      }),
    );
    assert.ok(rows.length);
    assert.ok(
      rows.every(
        (r) => r.verification_state === "verified" && r.campus_id === "demo-u",
      ),
    );
    assert.deepEqual(
      await ok(
        a.db.rpc("search_close_ai_resources", {
          campus: "not-real",
          category: null,
          search_text: "fee",
        }),
      ),
      [],
    );
    const resource = rows[0].id,
      token = crypto.randomUUID(),
      draft = {
        title: "Approved draft",
        resource,
        steps: ["Check eligibility", "Decide whether to contact"],
        token,
        confirmed: true,
      };
    await denied(a.db.rpc("save_close_ai_draft", draft));
    await ok(
      a.db
        .from("consent_records")
        .insert({
          user_id: a.id,
          consent_type: "support_data_storage",
          granted: true,
        }),
    );
    await denied(
      a.db.rpc("save_close_ai_draft", { ...draft, confirmed: false }),
    );
    await denied(
      a.db.rpc("save_close_ai_draft", { ...draft, steps: ["Valid", {}] }),
    );
    assert.equal((await ok(a.db.from("action_plans").select())).length, 0);
    const plan = await ok(a.db.rpc("save_close_ai_draft", draft));
    assert.equal(await ok(a.db.rpc("save_close_ai_draft", draft)), plan);
    assert.equal((await ok(a.db.from("action_plans").select())).length, 1);
    assert.equal((await ok(a.db.from("action_steps").select())).length, 2);
    assert.equal((await ok(a.db.from("reminders").select())).length, 0);
    assert.deepEqual(
      await ok(b.db.from("action_plans").select().eq("id", plan)),
      [],
    );
    assert.deepEqual(
      await ok(b.db.from("action_steps").select().eq("action_plan_id", plan)),
      [],
    );
    await denied(a.db.from("conversations").select());
    await denied(b.db.from("chat_messages").select());
    await denied(
      a.db.rpc("consume_close_ai_budget", { service_name: "admin" }),
    );
    for (let i = 0; i < 20; i++)
      assert.equal(
        await ok(a.db.rpc("consume_close_ai_budget", { service_name: "ai" })),
        true,
      );
    assert.equal(
      await ok(a.db.rpc("consume_close_ai_budget", { service_name: "ai" })),
      false,
    );
    assert.equal(
      await ok(b.db.rpc("consume_close_ai_budget", { service_name: "ai" })),
      true,
    );
    await denied(
      a.db
        .from("integration_usage")
        .update({ requests: 0 })
        .eq("user_id", a.id),
    );
    assert.deepEqual(
      await ok(b.db.from("integration_usage").select().eq("user_id", a.id)),
      [],
    );
    console.log(
      "PASS verified campus retrieval, approval/consent, atomic/idempotent drafts, no automatic reminders, owner isolation and durable AI limits",
    );
  } finally {
    a.db.auth.stopAutoRefresh();
    b.db.auth.stopAutoRefresh();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
