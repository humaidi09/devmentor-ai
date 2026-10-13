const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const assert = require("node:assert/strict");

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ["--no-sandbox"] });
  try {
    const context = await browser.newContext({ viewport: { width: 360, height: 800 }, reducedMotion: "reduce" });
    await context.addCookies([{ name: "close-ai-mode", value: "demo", url: base, httpOnly: true, sameSite: "Lax" }]);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    const personal = await context.request.get(base + "/api/knowledge?q=student%40example.com&category=all");
    assert.equal(personal.status(), 400);
    const invalid = await context.request.get(base + "/api/knowledge?q=test&category=unknown");
    assert.equal(invalid.status(), 400);

    await page.route("**/api/knowledge?*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      query: "cloud computing", category: "all", searchedAt: new Date().toISOString(), unavailable: ["world-bank"],
      results: [
        { id: "crossref:10.1234/cloud", provider: "crossref", category: "research", title: "Cloud Computing Study", url: "https://doi.org/10.1234/cloud", source: "Example Journal", authors: ["A. Author"], publishedAt: "2025", updatedAt: null, retrievedAt: "2026-10-13T00:00:00.000Z", summary: "Research metadata only.", stale: false },
        { id: "github:123", provider: "github", category: "programming", title: "example/cloud-project", url: "https://github.com/example/cloud-project", source: "GitHub repository", authors: ["example"], publishedAt: null, updatedAt: null, retrievedAt: "2026-10-13T00:00:00.000Z", summary: "Technical example.", stale: false },
      ],
    }) }));
    await page.goto(base + "/knowledge", { waitUntil: "networkidle" });
    await page.getByLabel("Knowledge search").fill("cloud computing");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.getByRole("heading", { name: "Cloud Computing Study" }).waitFor();
    await page.getByRole("heading", { name: "Compare sources" }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const knowledgeAxe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    assert.deepEqual(knowledgeAxe.violations.map((item) => item.id), []);
    await page.getByText("Currently unavailable: world-bank").waitFor();
    await page.getByRole("button", { name: "Use in Study" }).first().click();
    await page.getByRole("button", { name: /Saved/ }).click();
    await page.getByRole("heading", { name: "Cloud Computing Study" }).waitFor();
    await page.goto(base + "/study", { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Saved research and resources" }).waitFor();
    await page.getByRole("button", { name: "Create study task" }).click();
    await page.getByText("Review source: Cloud Computing Study").waitFor();

    await page.route("**/api/cp/problems?*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ problems: [], page: 1, hasMore: false, live: false, reason: "Codeforces unavailable. Showing curated links." }) }));
    await page.goto(base + "/cp/library?topic=bfs", { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "CP Problem Library", exact: true }).waitFor();
    await page.getByRole("heading", { name: "Two Buttons" }).waitFor();
    await page.getByRole("heading", { name: "Number of Islands" }).waitFor();
    await page.getByRole("button", { name: "Need hint", exact: true }).first().click();
    await page.getByText("Hint 1:").first().waitFor();
    await page.getByRole("button", { name: "Another hint" }).first().click();
    await page.getByText("Hint 2:").first().waitFor();
    await page.getByRole("link", { name: "Review concept visually" }).first().click();
    await page.getByRole("heading", { name: "Breadth-First Search" }).waitFor();
    await page.getByRole("link", { name: "Return to practice" }).click();
    await page.waitForURL("**/cp/topics/bfs");
    await page.getByRole("heading", { name: "BFS", exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    assert.deepEqual(results.violations.map((item) => item.id), []);
    assert.deepEqual(errors, []);
    console.log("PASS live knowledge UI, study handoff, CP hint/visual flow, mobile accessibility and privacy input guard");
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
