const { localDockerEnv } = require("./docker-env.cjs");
const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const base = "http://localhost:3002";
const resourceName = "DEMO browser resource " + crypto.randomUUID().slice(0, 8);
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const go = async (path) => {
      await page.goto(base + path, { waitUntil: "networkidle" });
      console.log("ROUTE", path, page.url());
    };
    await go("/dashboard");
    assert.ok(page.url().includes("/auth"));
    assert.equal(
      (await context.request.get(base + "/api/account")).status(),
      401,
    );
    const email = `browser-${crypto.randomUUID()}@example.test`,
      password = "Close-AI-browser-password-123!";
    await page
      .getByRole("button", { name: "Create a new account", exact: true })
      .click();
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await page.waitForURL("**/dashboard");
    await page.getByText("No next steps yet.", { exact: true }).waitFor();
    console.log(
      "PASS auth signup UI, private route redirect, unauthorized API and fresh-account empty state",
    );
    await go("/settings");
    await page
      .getByLabel("Allow optional profile-data storage", { exact: true })
      .click();
    await page
      .getByRole("checkbox", {
        name: "Allow optional profile-data storage",
        exact: true,
        checked: true,
      })
      .waitFor();
    await page
      .getByLabel("Display name (optional)", { exact: true })
      .fill("Test Student A");
    await page
      .getByRole("button", { name: "Save profile", exact: true })
      .click();
    await page.getByText("Profile saved.", { exact: true }).waitFor();
    await page
      .getByLabel("Allow saved resources and action-plan storage", {
        exact: true,
      })
      .click();
    await page
      .getByRole("checkbox", {
        name: "Allow saved resources and action-plan storage",
        exact: true,
        checked: true,
      })
      .waitFor();
    await page.getByLabel("Academic Study", { exact: true }).click();
    await page
      .getByRole("switch", { name: "Academic Study", checked: false })
      .waitFor();
    await page.reload({ waitUntil: "networkidle" });
    await page.getByLabel("Display name (optional)", { exact: true }).waitFor();
    assert.equal(
      await page.getByLabel("Display name (optional)").inputValue(),
      "Test Student A",
    );
    await page
      .getByRole("switch", { name: "Academic Study", checked: false })
      .waitFor();
    await go("/onboarding");
    await page
      .getByLabel("Campus (optional)", { exact: true })
      .selectOption("demo-u");
    await page.waitForResponse(
      (r) => r.url().endsWith("/api/account") && r.status() === 200,
    );
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.waitForURL("**/dashboard");
    console.log("PASS profile, consent, module and campus persistence");
    const knowledge = {
      id: "crossref:10.1234/browser", provider: "crossref", category: "research",
      collection: "study", title: "Browser test paper", url: "https://doi.org/10.1234/browser",
      source: "Crossref", summary: "Metadata", publishedAt: "2025",
      retrievedAt: new Date().toISOString(),
    };
    assert.equal((await context.request.post(base + "/api/knowledge/saved", { headers: { Origin: base }, data: knowledge })).status(), 200);
    assert.equal((await (await context.request.get(base + "/api/knowledge/saved")).json()).items[0].title, "Browser test paper");
    assert.equal((await context.request.post(base + "/api/knowledge/saved", { headers: { Origin: base }, data: { ...knowledge, url: "https://evil.test/fake" } })).status(), 400);
    assert.equal((await context.request.post(base + "/api/data/cp", { headers: { Origin: base }, data: { problem: "lc-two-sum", status: "upsolve" } })).status(), 200);
    assert.equal((await (await context.request.get(base + "/api/account")).json()).cpStatus["lc-two-sum"], "upsolve");
    assert.equal((await context.request.delete(base + "/api/data/cp", { headers: { Origin: base }, data: { confirmation: "CLEAR CP PROGRESS" } })).status(), 200);
    assert.equal((await (await context.request.get(base + "/api/account")).json()).cpStatus["lc-two-sum"], undefined);
    assert.equal((await context.request.delete(base + "/api/knowledge/saved", { headers: { Origin: base }, data: { id: knowledge.id } })).status(), 200);
    assert.equal((await (await context.request.get(base + "/api/knowledge/saved")).json()).items.length, 0);
    console.log("PASS saved knowledge, trusted URL validation and individual CP progress APIs");
    await go("/support/resources/r-house-office");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.getByRole("button", { name: "Saved", exact: true }).waitFor();
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Saved", exact: true }).waitFor();
    await go("/support/saved");
    await page
      .getByRole("heading", { name: "On-Campus Housing Office", exact: true })
      .waitFor();
    await go("/support/steps");
    await page
      .getByLabel("New plan title", { exact: true })
      .fill("My persisted support plan");
    await page
      .getByRole("button", { name: "Create plan", exact: true })
      .click();
    await page
      .getByRole("option", { name: "My persisted support plan", exact: true })
      .waitFor({ state: "attached" });
    await page
      .getByLabel("New step", { exact: true })
      .fill("First persisted step");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByText("First persisted step", { exact: true }).waitFor();
    await page
      .getByLabel("New step", { exact: true })
      .fill("Second persisted step");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByText("Second persisted step", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Move up", exact: true })
      .nth(1)
      .click();
    await page.waitForResponse(
      (r) => r.url().endsWith("/api/account") && r.status() === 200,
    );
    await page.reload({ waitUntil: "networkidle" });
    await page.getByText("Second persisted step", { exact: true }).waitFor();
    const titles = await page.locator("li p.font-medium").allTextContents();
    assert.deepEqual(titles, ["Second persisted step", "First persisted step"]);
    await page
      .getByRole("button", { name: "Edit", exact: true })
      .first()
      .click();
    await page
      .getByLabel("Step title", { exact: true })
      .fill("Edited persisted step");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.getByText("Edited persisted step", { exact: true }).waitFor();
    await page
      .getByLabel("Status", { exact: true })
      .first()
      .selectOption("completed");
    await page.waitForResponse(
      (r) => r.url().endsWith("/api/account") && r.status() === 200,
    );
    console.log(
      "PASS database resource loading, save/reload, action plan create, edit, reorder and complete",
    );
    await go("/study");
    await page
      .getByLabel("Course name", { exact: true })
      .fill("Private test course");
    await page.getByRole("button", { name: "Add course", exact: true }).click();
    await page
      .locator("li")
      .getByText("Private test course", { exact: true })
      .waitFor();
    await page
      .getByLabel("Deadline title", { exact: true })
      .fill("Private test deadline");
    await page
      .getByLabel("Course (optional)", { exact: true })
      .selectOption({ label: "Private test course" });
    await page.getByLabel("Due time", { exact: true }).fill("2027-01-01T12:00");
    await page
      .getByRole("button", { name: "Add deadline", exact: true })
      .click();
    await page.getByText("Private test deadline", { exact: false }).waitFor();
    await page.reload({ waitUntil: "networkidle" });
    await page
      .locator("li")
      .getByText("Private test course", { exact: true })
      .waitFor();
    const invalid = await context.request.post(base + "/api/data/saved", {
      headers: { Origin: base },
      data: { resourceId: "r-house-office", user_id: crypto.randomUUID() },
    });
    assert.equal(invalid.status(), 400);
    const csrf = await context.request.post(base + "/api/data/saved", {
      headers: { Origin: "https://attacker.example" },
      data: { resourceId: "r-house-office" },
    });
    assert.equal(csrf.status(), 403);
    const student = await context.request.get(base + "/api/maintainer");
    assert.equal(student.status(), 403);
    const exported = await (
      await context.request.get(base + "/api/export")
    ).json();
    assert.equal(exported.saved_knowledge.length, 0);
    assert.equal(exported.profile[0].display_name, "Test Student A");
    assert.ok(
      exported.action_plans.some(
        (p) => p.title === "My persisted support plan",
      ),
    );
    const account = await (
      await context.request.get(base + "/api/account")
    ).json();
    const userId = account.profile.id;
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
        `insert into public.resource_roles(user_id,campus_id,role) values('${userId}','demo-u','resource_maintainer');`,
      ],
      { env: localDockerEnv() },
    );
    await go("/maintainer");
    await page
      .getByRole("heading", { name: "Resource workspace", exact: true })
      .waitFor();
    await page.getByLabel("Campus", { exact: true }).selectOption("demo-u");
    await page.getByLabel("Name", { exact: true }).fill(resourceName);
    await page
      .getByLabel("Description", { exact: true })
      .fill("Fictional browser test only");
    await page.getByLabel("DEMO — fictional service", { exact: true }).check();
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await page
      .getByRole("option", {
        name: resourceName + " — draft — DEMO",
        exact: true,
      })
      .waitFor({ state: "attached" });
    console.log(
      "PASS academic persistence, input/CSRF checks, student denial and maintainer draft UI",
    );
    const routes = [
      "/auth",
      "/settings",
      "/support/steps",
      "/support/resources",
      "/study",
      "/maintainer",
    ];
    for (const route of routes) {
      await go(route);
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      assert.deepEqual(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
        route,
      );
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
    assert.equal(
      await page.evaluate(async () => {
        const keys = await caches.keys();
        return keys.filter((k) => k.startsWith("close-ai-public-")).length;
      }),
      0,
    );
    assert.equal(
      (await context.request.get(base + "/dashboard"))
        .headers()
        ["cache-control"].includes("no-store"),
      true,
    );
    console.log(
      "PASS new account pages axe/mobile checks, no private offline cache and private response headers",
    );
    await go("/settings");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.waitForURL("**/auth");
    assert.equal(
      (await context.request.get(base + "/api/account")).status(),
      401,
    );
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/dashboard");
    await page.getByText("First persisted step", { exact: true }).waitFor();
    await go("/support/steps");
    await page.getByText("Edited persisted step", { exact: true }).waitFor();
    assert.equal(
      await page.getByLabel("Status", { exact: true }).first().inputValue(),
      "completed",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS signout/signin UI restores own persisted state; no browser page errors",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
