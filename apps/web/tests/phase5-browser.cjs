const { localDockerEnv } = require("./docker-env.cjs");
const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const { execFileSync } = require("node:child_process");
const assert = require("node:assert/strict");
const base = "http://localhost:3002";
function sql(text) {
  execFileSync(
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
      "-c",
      text,
    ],
    { stdio: "pipe", env: localDockerEnv() },
  );
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        timezoneId: "UTC",
      }),
      page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const go = async (path) =>
      page.goto(base + path, { waitUntil: "networkidle" });
    const get = async (path) => (await context.request.get(base + path)).json();
    const post = async (path, data, method = "POST") =>
      context.request.fetch(base + path, {
        method,
        headers: { Origin: base },
        data,
      });
    for (const path of [
      "/api/notifications",
      "/api/codeforces",
      "/api/learning",
    ])
      assert.equal((await post(path, {})).status(), 401);
    await go("/auth");
    await page
      .getByRole("button", { name: "Create a new account", exact: true })
      .click();
    await page
      .getByLabel("Email", { exact: true })
      .fill(`phase5-browser-${crypto.randomUUID()}@example.test`);
    await page
      .getByLabel("Password", { exact: true })
      .fill("CloseAI-phase5-browser-123!");
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await page.waitForURL("**/dashboard");
    const actor = (await get("/api/account")).profile.id;
    assert.equal(
      (
        await context.request.post(base + "/api/notifications", {
          headers: { Origin: "https://wrong.test" },
          data: { action: "deliver" },
        })
      ).status(),
      403,
    );
    await go("/settings");
    await page.getByRole("switch", { name: "Reminders", exact: true }).click();
    await page
      .getByRole("switch", { name: "Reminders", exact: true, checked: true })
      .waitFor();
    await page
      .getByLabel("Enable in-app notifications", { exact: true })
      .check();
    await page
      .getByLabel("Reminder timezone (IANA)", { exact: true })
      .fill("UTC");
    await page
      .getByRole("button", {
        name: "Save notification preferences",
        exact: true,
      })
      .click();
    await page
      .getByText("Notification preferences saved.", { exact: true })
      .waitFor();
    assert.equal(
      (await get("/api/notifications")).preferences.in_app_enabled,
      true,
    );
    await go("/notifications");
    await page
      .getByLabel("Reminder title", { exact: true })
      .fill("Private sensitive support fixture");
    await page
      .getByLabel("Local reminder date and time", { exact: true })
      .fill(new Date(Date.now() + 3600000).toISOString().slice(0, 16));
    await page
      .getByRole("button", { name: "Approve reminder", exact: true })
      .click();
    await page
      .getByText("Private sensitive support fixture · Enabled", { exact: true })
      .waitFor();
    let data = await get("/api/notifications");
    assert.equal(data.reminders.length, 1);
    const reminder = data.reminders[0].id;
    assert.ok(Date.parse(data.reminders[0].scheduled_for) > Date.now());
    sql(
      `update public.reminders set scheduled_for=now()-interval '1 minute' where id='${reminder}' and user_id='${actor}'`,
    );
    await page
      .getByRole("button", { name: "Check due reminders", exact: true })
      .click();
    await page
      .getByText("You have a Close AI reminder.", { exact: true })
      .waitFor();
    data = await get("/api/notifications");
    assert.equal(data.notifications.length, 1);
    assert.ok(
      !JSON.stringify(data.notifications).includes("Private sensitive"),
    );
    await page.getByRole("button", { name: "Mark read", exact: true }).click();
    await page
      .getByRole("button", { name: "Mark unread", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Mark unread", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Mark all read", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Mark unread", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Dismiss", exact: true }).click();
    await page.getByText("No notifications.", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Check due reminders", exact: true })
      .click();
    assert.equal((await get("/api/notifications")).notifications.length, 0);
    console.log(
      "PASS persisted notification preferences, explicit reminder approval, due generic delivery, read/unread/all-read/dismiss and retry dedupe",
    );
    await post("/api/data/deadlines", {
      title: "My SQL exam",
      courseId: null,
      dueAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    });
    await go("/study");
    await page
      .getByRole("button", { name: "Draft study suggestions", exact: true })
      .click();
    await page
      .getByLabel("Suggestion title", { exact: true })
      .first()
      .fill("My approved revision");
    await page
      .getByLabel("Study time (optional, browser timezone)", { exact: true })
      .first()
      .fill(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    assert.equal((await get("/api/data/study")).tasks.length, 0);
    await page
      .getByRole("button", { name: "Approve study task", exact: true })
      .first()
      .click();
    await page
      .getByText("Approved study task saved.", { exact: true })
      .waitFor();
    let study = await get("/api/data/study");
    assert.equal(study.tasks.length, 1);
    assert.ok(study.tasks[0].planned_for);
    await page
      .getByRole("button", { name: "Edit / reschedule task", exact: true })
      .first()
      .click();
    await page
      .getByLabel("Edit task title", { exact: true })
      .fill("My rescheduled revision");
    await page
      .getByRole("button", { name: "Save task changes", exact: true })
      .click();
    await page.getByText("My rescheduled revision", { exact: true }).waitFor();
    assert.equal(
      (await get("/api/data/study")).tasks[0].title,
      "My rescheduled revision",
    );
    await go("/learn");
    await page
      .getByRole("button", { name: "Mark project planned", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Remove project record", exact: true })
      .waitFor();
    await page
      .getByLabel("Project status", { exact: true })
      .selectOption("paused");
    await page.waitForResponse(
      (r) => r.url().endsWith("/api/account") && r.status() === 200,
    );
    assert.ok(
      (await get("/api/account")).learningProgress.some(
        (p) => p.kind === "project" && p.status === "paused",
      ),
    );
    await go("/learn/visual-lab/bfs");
    await page.getByRole("button", { name: "Next step", exact: true }).click();
    await page.getByRole("button", { name: "Next step", exact: true }).click();
    await page
      .getByRole("button", { name: "Remember this step", exact: true })
      .click();
    await page.getByText("Remembered step:", { exact: false }).waitFor();
    await go("/learn/visual-lab");
    await page
      .getByRole("heading", {
        name: "Continue your remembered learning",
        exact: true,
      })
      .waitFor();
    assert.ok(
      (await get("/api/account")).learningProgress.some(
        (p) => p.kind === "visual" && p.topic_key === "bfs" && p.position === 2,
      ),
    );
    await page.locator('a[href="/learn/visual-lab/bfs?step=2"]').click();
    await page.getByText(/^Step 3\//).waitFor();
    console.log(
      "PASS editable approved study suggestions/rescheduling, explicit project progress and optional visual continuation",
    );
    await go("/cp");
    await page
      .getByLabel("Codeforces handle (optional)", { exact: true })
      .fill("bad$handle");
    await page
      .getByRole("button", { name: "Preview public profile", exact: true })
      .click();
    await page
      .getByText("Codeforces handle could not be found.", { exact: true })
      .last()
      .waitFor();
    assert.equal((await get("/api/account")).cpHandle, "");
    const profile = {
      handle: "tourist",
      rating: 3900,
      maxRating: 3979,
      rank: "legendary grandmaster",
      url: "https://codeforces.com/profile/tourist",
    };
    if (process.env.CLOSE_AI_LIVE_TESTS !== "1")
      await page.route("**/api/codeforces", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ profile }),
        }),
      );
    await page
      .getByLabel("Codeforces handle (optional)", { exact: true })
      .fill("tourist");
    await page
      .getByRole("button", { name: "Preview public profile", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirm connection", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Confirm connection", exact: true })
        .isDisabled(),
      true,
    );
    assert.equal((await get("/api/account")).cpHandle, "");
    await page
      .getByLabel(
        "I agree to store this optional public handle and connect Codeforces.",
        { exact: true },
      )
      .check();
    if (process.env.CLOSE_AI_LIVE_TESTS === "1") {
      await page
        .getByRole("button", { name: "Confirm connection", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Disconnect Codeforces", exact: true })
        .waitFor();
      assert.equal((await get("/api/account")).cpHandle, "tourist");
      assert.equal((await get("/api/account")).cpConnected, true);
      await go("/settings");
      await page
        .getByRole("button", { name: "Disconnect Codeforces", exact: true })
        .click();
      await page
        .getByText("Codeforces · Not connected", { exact: true })
        .waitFor();
      assert.equal((await get("/api/account")).cpHandle, "");
      assert.equal((await get("/api/account")).cpConnected, false);
      console.log(
        "PASS real Codeforces preview -> explicit consent/confirm -> stored identifier -> Settings disconnect removes identifier",
      );
      await go("/cp");
    } else {
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await page.unroute("**/api/codeforces");
      console.log(
        "PASS Codeforces preview/approval UI with fixture; real connect/disconnect browser test excluded from CI (separate real smoke and DB consent tests)",
      );
    }
    await page.route("**/api/codeforces", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error:
            "Codeforces is unavailable. Manual practice remains available.",
        }),
      }),
    );
    await page
      .getByLabel("Codeforces handle (optional)", { exact: true })
      .fill("tourist");
    await page
      .getByRole("button", { name: "Preview public profile", exact: true })
      .click();
    await page
      .getByText(
        "Codeforces is unavailable. Manual practice remains available.",
        { exact: true },
      )
      .last()
      .waitFor();
    await page
      .getByRole("button", { name: "Attempted", exact: true })
      .first()
      .click();
    await page.waitForResponse(
      (r) => r.url().endsWith("/api/account") && r.status() === 200,
    );
    assert.equal((await get("/api/account")).cpStatus.p1, "attempted");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal((await get("/api/account")).cpStatus.p1, "attempted");
    await page
      .getByRole("button", { name: "Need Hint", exact: true })
      .first()
      .click();
    await page.waitForResponse(
      (r) => r.url().endsWith("/api/account") && r.status() === 200,
    );
    assert.equal((await get("/api/account")).cpStatus.p1, "need_hint");
    await page
      .getByRole("button", { name: "Need a hint", exact: true })
      .first()
      .click();
    assert.equal((await get("/api/account")).cpStatus.p1, "need_hint");
    await page
      .getByLabel("Practice mode", { exact: true })
      .selectOption("weak");
    await page
      .getByText("Topics from your Attempted/Need Hint records only:", {
        exact: false,
      })
      .waitFor();
    console.log(
      "PASS invalid handles/failure keep identifiers unsaved and manual CP progress persists with transparent weak-topic practice",
    );
    for (const route of [
      "/notifications",
      "/settings",
      "/study",
      "/learn",
      "/cp",
      "/learn/visual-lab/bfs",
    ]) {
      await go(route);
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(scan.violations, [], route + " accessibility");
      await page.setViewportSize({ width: 360, height: 800 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        route + " overflow",
      );
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    await page
      .getByRole("button", { name: "বাংলা", exact: true })
      .first()
      .click();
    for (const route of [
      "/notifications",
      "/settings",
      "/study",
      "/learn",
      "/cp",
      "/learn/visual-lab/bfs",
    ]) {
      await go(route);
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(scan.violations, [], route + " Bangla accessibility");
      await page.setViewportSize({ width: 360, height: 800 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        route + " Bangla overflow",
      );
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    const exported = await get("/api/export");
    assert.equal(exported.profile[0].id, undefined);
    assert.equal(exported.notifications.length, 0);
    assert.equal(exported.learning_tasks[0].title, "My rescheduled revision");
    assert.ok(exported.learning_progress.length >= 2);
    assert.deepEqual(errors, []);
    console.log(
      "PASS six new/updated routes WCAG/mobile, own export includes new data and no browser errors",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
