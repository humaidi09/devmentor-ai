const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const assert = require("node:assert/strict");
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
assert.ok(
  ["localhost", "127.0.0.1"].includes(new URL(base).hostname),
  "Use an isolated local prototype",
);
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    await context.addCookies([
      {
        name: "close-ai-mode",
        value: "demo",
        url: base,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const path of ["/", "/api/status"]) {
      const response = await context.request.get(base + path);
      assert.equal(response.status(), 200, path + " status");
      const headers = response.headers();
      assert.equal(headers["x-content-type-options"], "nosniff");
      assert.equal(headers["x-frame-options"], "DENY");
      assert.equal(headers["referrer-policy"], "strict-origin-when-cross-origin");
      assert.match(headers["content-security-policy"], /frame-ancestors 'none'/);
      assert.match(headers["permissions-policy"], /camera=\(\)/);
    }
    console.log("PASS browser security headers on HTML and API");
    const go = async (path) => {
      await page.goto(base + path, { waitUntil: "networkidle" });
    };
    await go("/onboarding");
    await page
      .getByLabel("Campus (optional)", { exact: true })
      .selectOption("not-listed");
    await page
      .getByText("Only fictional demo information", { exact: false })
      .waitFor();
    await page
      .getByRole("checkbox", { name: "Academic Study", exact: true })
      .uncheck();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.waitForURL("**/dashboard");
    await page
      .getByRole("link", { name: "Academic Study", exact: true })
      .waitFor({ state: "hidden" });
    await page.reload({ waitUntil: "networkidle" });
    await page
      .getByRole("link", { name: "Academic Study", exact: true })
      .waitFor({ state: "hidden" });
    await go("/settings");
    await page
      .getByRole("switch", { name: "Academic Study", exact: true })
      .click();
    await page.getByRole("switch", { name: "Reminders", exact: true }).click();
    await page.reload({ waitUntil: "networkidle" });
    await page
      .getByRole("switch", { name: "Reminders", exact: true, checked: true })
      .waitFor();
    console.log("PASS onboarding, campus fallback and saved preferences");

    await go("/support/resources/r-house-office");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Saved", exact: true }).waitFor();
    await go("/support");
    await page.getByLabel("Message", { exact: true }).fill("tuition fees");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await page
      .getByText("Here are some verified resources", { exact: false })
      .waitFor();
    await page.getByLabel("Message", { exact: true }).fill("Explain binary search");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await page.getByText("In a sorted list, compare the middle", { exact: false }).waitFor();
    await page.locator('a[href="/learn/visual-lab/binary-search"]').waitFor();
    await page.getByLabel("Message", { exact: true }).fill("Show an example");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await page.getByText("[1, 3, 5, 7, 9], target 7", { exact: false }).last().waitFor();
    await page.route("**/api/chat", (r) =>
      r.fulfill({
        status: 503,
        contentType: "application/json",
        body: '{"error":"unavailable"}',
      }),
    );
    await page.getByLabel("Message", { exact: true }).fill("help");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await page
      .getByText("Sorry, something went wrong.", { exact: false })
      .waitFor();
    await page.unroute("**/api/chat");
    console.log("PASS saved resources, chat, API error fallback");

    await go("/learn/visual-lab/bubble-sort");
    assert.equal(await page.locator("video").count(), 0);
    assert.equal(await page.getByText("Demo mode — sample data, no account needed.").count(), 0);
    assert.equal(await page.getByText("DEMO", { exact: true }).count(), 0);
    await page.getByRole("heading", { name: "Every step, from start to finish" }).waitFor();
    await page
      .getByLabel("Numbers (comma-separated)", { exact: true })
      .fill("3, 1, 2");
    await page
      .getByRole("button", { name: "Apply example", exact: true })
      .click();
    await page.getByRole("button", { name: "Next step", exact: true }).focus();
    await page.keyboard.press("Enter");
    await page.getByText("Compare 3 and 1.", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Previous step", exact: true })
      .click();
    await page
      .getByLabel("Numbers (comma-separated)", { exact: true })
      .fill("oops");
    await page
      .getByRole("button", { name: "Apply example", exact: true })
      .click();
    await page.locator("#viz-error").waitFor();
    assert.equal(await page.locator("#text-steps li").count(), 9);
    await go("/cp/topics/backtracking");
    await page.getByRole("link", { name: "Read all steps" }).click();
    await page.waitForURL("**/learn/visual-lab/backtracking?from=cp&topic=backtracking");
    assert.equal(await page.locator("video").count(), 0);
    await page.getByRole("heading", { name: "A worked case, step by step" }).waitFor();
    await page.getByRole("heading", { name: "Example 1" }).waitFor();
    await page.getByRole("heading", { name: "Another worked example" }).waitFor();
    assert.equal(await page.locator("#text-steps li").count(), 3);
    await page.getByRole("button", { name: "Next step" }).click();
    await page.getByText("A → C violates the rule", { exact: false }).waitFor();
    await page.getByRole("button", { name: "বাংলা", exact: true }).first().click();
    await page.getByText("A → C নিয়ম ভাঙে", { exact: false }).first().waitFor();
    await page.getByRole("button", { name: "EN", exact: true }).first().click();
    await go("/learn/visual-lab");
    await page.locator("details").filter({ hasText: "KMP Pattern Matching" }).locator("summary").click();
    await page.getByRole("link", { name: /KMP Pattern Matching/ }).click();
    await page.waitForURL("**/learn/visual-lab/pattern-kmp");
    assert.equal(await page.locator("video").count(), 0);
    await page.getByRole("heading", { name: "Every step, from start to finish" }).waitFor();
    await page.getByText("Find ABAC in ABABAC", { exact: false }).first().waitFor();
    console.log("PASS CP topic text lessons, complete steps and bilingual explanations");
    // Keyboard navigation and visible focus, with reduced-motion preference.
    await go("/");
    assert.equal(
      await page.locator(".hero-copy").evaluate((el) => getComputedStyle(el).animationName),
      "none",
      "hero animation respects reduced motion",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    assert.match(
      await page.locator(".hero-copy").evaluate((el) => getComputedStyle(el).animationName),
      /soft-rise/,
      "hero animation is available when motion is allowed",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.keyboard.press("Tab");
    assert.equal(
      await page.locator(":focus").innerText(),
      "Skip to main content",
    );
    assert.notEqual(
      await page
        .locator(":focus")
        .evaluate((el) => getComputedStyle(el).position),
      "static",
    );
    await page.keyboard.press("Enter");
    assert.equal(
      await page.locator(":focus").getAttribute("id"),
      "main-content",
    );
    console.log(
      "PASS visual logic controls, invalid input, keyboard skip/focus",
    );

    const routes = [
      "/",
      "/onboarding",
      "/dashboard",
      "/support",
      "/support/resources",
      "/support/resources/r-fin-tuition",
      "/support/saved",
      "/support/steps",
      "/support/human",
      "/knowledge",
      "/study",
      "/learn",
      "/cp",
      "/cp/library",
      "/cp/topics/bfs",
      "/cp/topics/dfs",
      "/settings",
      "/learn/visual-lab",
      ...[
        "bfs",
        "dfs",
        "bubble-sort",
        "binary-search",
        "sql-inner-join",
        "normalization",
        "backtracking",
        "dynamic-programming",
        "pattern-kmp",
      ].map((x) => "/learn/visual-lab/" + x),
    ];
    const accessibilityFailures = [];
    for (const route of routes) {
      await go(route);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      if (results.violations.length)
        accessibilityFailures.push({
          route,
          violations: results.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          })),
        });
      await page.setViewportSize({ width: 360, height: 800 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        route + " English overflow",
      );
      await page
        .getByRole("button", { name: "বাংলা", exact: true })
        .first()
        .click();
      assert.equal(await page.locator("html").getAttribute("lang"), "bn");
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        route + " Bangla overflow",
      );
      if (route === "/learn/visual-lab/normalization")
        await page.getByText("UNF: courses ঘরে", { exact: false }).waitFor();
      await page
        .getByRole("button", { name: "EN", exact: true })
        .first()
        .click();
      await page.setViewportSize({ width: 1440, height: 1000 });
      console.log("CHECKED route, accessibility and bilingual mobile:", route);
    }
    assert.deepEqual(accessibilityFailures, [], "Accessibility regressions");
    // Wait for complete public pre-cache, then reload and navigate without network.
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller)
        await new Promise((resolve) =>
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            resolve,
            { once: true },
          ),
        );
    });
    await context.setOffline(true);
    await go("/learn/visual-lab/normalization");
    await page
      .getByRole("heading", { name: "Normalization", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Next step", exact: true }).click();
    await page
      .getByText("1NF: one value per cell.", { exact: false })
      .waitFor();
    await go("/support");
    await page.getByLabel("Message", { exact: true }).fill("tuition fees");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await page
      .getByText("Here are some verified resources", { exact: false })
      .waitFor();
    await page
      .getByRole("link", {
        name: "Open: Need-Based Tuition Assistance",
        exact: true,
      })
      .click();
    await page
      .getByRole("heading", {
        name: "Need-Based Tuition Assistance",
        exact: true,
      })
      .waitFor();
    const cacheKeys = await page.evaluate(async () => {
      const entries = [];
      for (const k of await caches.keys())
        for (const r of await (await caches.open(k)).keys())
          entries.push(new URL(r.url).pathname);
      return entries;
    });
    assert.ok(!cacheKeys.some((p) => p.startsWith("/api/")));
    await context.setOffline(false);
    await go("/settings");
    await page.evaluate(() => localStorage.setItem("unrelated-app", "keep"));
    page.once("dialog", (d) => d.accept());
    await page
      .getByRole("button", { name: "Clear demo data", exact: true })
      .click();
    await page.waitForLoadState("networkidle");
    assert.equal(
      await page.evaluate(() => localStorage.getItem("unrelated-app")),
      "keep",
    );
    assert.equal(
      await page.evaluate(() => localStorage.getItem("close-ai-preferences")),
      null,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS offline reload + local chat, API cache exclusion, scoped deletion; no browser errors",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
