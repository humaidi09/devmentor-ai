const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext(),
      page = await context.newPage(),
      base = "http://localhost:3002";
    assert.equal(
      (
        await context.request.post(base + "/api/chat", {
          headers: { Origin: base },
          data: { message: "tuition" },
        })
      ).status(),
      401,
    );
    await page.goto(base + "/auth");
    await page
      .getByRole("button", { name: "Create a new account", exact: true })
      .click();
    await page
      .getByLabel("Email", { exact: true })
      .fill(`ai-browser-${crypto.randomUUID()}@example.test`);
    await page
      .getByLabel("Password", { exact: true })
      .fill("CloseAI-browser-fixture-123!");
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await page.waitForURL("**/dashboard");
    assert.equal(
      (
        await context.request.post(base + "/api/chat", {
          headers: { Origin: "https://wrong.test" },
          data: { message: "tuition" },
        })
      ).status(),
      403,
    );
    for (const data of [
      null,
      {},
      [],
      { message: "" },
      { message: "x", sql: "DROP TABLE" },
      { message: "x".repeat(2001) },
    ])
      assert.equal(
        (
          await context.request.post(base + "/api/chat", {
            headers: { Origin: base },
            data,
          })
        ).status(),
        400,
      );
    await context.request.patch(base + "/api/account", {
      headers: { Origin: base },
      data: { campus: "demo-u" },
    }); // Explicit campus selection, never inferred.
    const prefs = await (
      await context.request.get(base + "/api/account")
    ).json();
    if (prefs.profile.campus_id !== "demo-u") {
      const res = await context.request.post(base + "/api/data/preferences", {
        headers: { Origin: base },
        data: {
          campus: "demo-u",
          modules: { academic: true, developer: true, cp: true },
          support: true,
          reminders: false,
          quietStart: "22:00",
          quietEnd: "07:00",
          onboarded: true,
        },
      });
      assert.equal(res.status(), 200);
    }
    await context.request.post(base + "/api/data/consent", {
      headers: { Origin: base },
      data: { type: "support_data_storage", granted: true },
    });
    await page.goto(base + "/support", { waitUntil: "networkidle" });
    await page.getByLabel("Message", { exact: true }).fill("tuition fees");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await page.getByRole("region", { name: "Checklist draft" }).waitFor();
    assert.equal(
      (await (await context.request.get(base + "/api/account")).json()).plans
        .length,
      0,
    );
    await page
      .getByLabel("Checklist title", { exact: true })
      .fill("Reviewed AI checklist");
    await page
      .getByLabel("Step 1", { exact: true })
      .fill("My reviewed first step");
    await page
      .getByRole("button", { name: "Approve and save", exact: true })
      .click();
    await page.getByText("Approved steps saved.", { exact: false }).waitFor();
    const account = await (
      await context.request.get(base + "/api/account")
    ).json();
    assert.equal(account.plans.length, 1);
    assert.equal(account.steps[0].title, "My reviewed first step");
    assert.deepEqual(account.reminders, []);
    await page
      .getByRole("button", { name: "Clear conversation", exact: true })
      .click();
    await context.setOffline(true);
    await page.getByLabel("Message", { exact: true }).fill("housing");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await page.getByRole("button", { name: "Retry", exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole("heading", { name: "On-Campus Housing Office", exact: true })
        .count(),
      0,
    );
    await context.setOffline(false);
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await page
      .getByRole("heading", { name: "On-Campus Housing Office", exact: true })
      .waitFor();
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(scan.violations, []);
    await page.setViewportSize({ width: 360, height: 800 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    console.log(
      "PASS chat auth/CSRF/input, DB grounding, editable explicit draft save, no auto-reminder, account offline/retry and chat axe/mobile",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
