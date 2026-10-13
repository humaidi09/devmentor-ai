// Explicit optional local-account test. Calls only public Codeforces profile API.
const { chromium } = require("playwright");
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
    const account = async () =>
      (await context.request.get(base + "/api/account")).json();
    await page.goto(base + "/auth");
    await page
      .getByRole("button", { name: "Create a new account", exact: true })
      .click();
    await page
      .getByLabel("Email", { exact: true })
      .fill(`cf-live-${crypto.randomUUID()}@example.test`);
    await page
      .getByLabel("Password", { exact: true })
      .fill("CloseAI-live-profile-fixture-123!");
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await page.waitForURL("**/dashboard");
    await page.goto(base + "/cp", { waitUntil: "networkidle" });
    await page
      .getByLabel("Codeforces handle (optional)", { exact: true })
      .fill("tourist");
    await page
      .getByRole("button", { name: "Preview public profile", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirm connection", exact: true })
      .waitFor();
    assert.equal((await account()).cpHandle, "");
    assert.equal(
      await page
        .getByRole("button", { name: "Confirm connection", exact: true })
        .isDisabled(),
      true,
    );
    await page
      .getByLabel(
        "I agree to store this optional public handle and connect Codeforces.",
        { exact: true },
      )
      .check();
    await page
      .getByRole("button", { name: "Confirm connection", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Disconnect Codeforces", exact: true })
      .waitFor();
    assert.equal((await account()).cpHandle, "tourist");
    assert.equal((await account()).cpConnected, true);
    await page.reload({ waitUntil: "networkidle" });
    await page.getByText("Codeforces · Connected", { exact: true }).waitFor();
    await page.goto(base + "/settings", { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: "Disconnect Codeforces", exact: true })
      .click();
    await page
      .getByText("Codeforces · Not connected", { exact: true })
      .waitFor();
    assert.equal((await account()).cpHandle, "");
    assert.equal((await account()).cpConnected, false);
    console.log(
      "PASS real Next.js Codeforces preview -> explicit consent/confirmation -> private DB persistence -> reload -> Settings disconnect removes identifier",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
