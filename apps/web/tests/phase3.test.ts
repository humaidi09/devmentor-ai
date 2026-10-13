import test from "node:test";
import assert from "node:assert/strict";
import {
  validateAuth,
  validatePreferences,
  https,
  uuid,
  time,
  timezone,
  choice,
  STEP_STATUSES,
} from "../src/lib/validation";
import { safeNext, protectedPath } from "../src/lib/auth/paths";
import { DEFAULT_PREFERENCES } from "../src/lib/preferences";
test("auth rejects weak signup credentials and privileged/unexpected fields", () => {
  assert.throws(() =>
    validateAuth({
      action: "signup",
      email: "a@example.test",
      password: "short",
    }),
  );
  assert.throws(() =>
    validateAuth({ action: "signin", email: "invalid", password: "pass" }),
  );
  assert.throws(() =>
    validateAuth({
      action: "signup",
      email: "a@example.test",
      password: "long-password",
      role: "admin",
    }),
  );
  assert.equal(
    validateAuth({
      action: "signin",
      email: "a@example.test",
      password: "password",
    }).email,
    "a@example.test",
  );
});
test("preference values are validated including boolean modules and real times", () => {
  assert.deepEqual(
    validatePreferences({ ...DEFAULT_PREFERENCES, campus: "not-listed" }),
    {
      campus: "",
      support: true,
      academic: true,
      developer: true,
      cp: true,
      reminders: false,
      quietStart: "22:00",
      quietEnd: "08:00",
      onboarded: false,
    },
  );
  assert.throws(() =>
    validatePreferences({ ...DEFAULT_PREFERENCES, quietStart: "99:99" }),
  );
  assert.throws(() =>
    validatePreferences({ ...DEFAULT_PREFERENCES, user_id: "another-user" }),
  );
  assert.throws(() =>
    validatePreferences({
      ...DEFAULT_PREFERENCES,
      modules: { academic: "true", developer: true, cp: true },
    }),
  );
});
test("reject unsafe source URLs, malformed IDs/timezones and enum values", () => {
  for (const value of [
    "javascript:alert(1)",
    "http://example.test",
    "https://user:pass@example.test",
  ])
    assert.throws(() => https(value));
  assert.equal(
    https("https://example.test/source"),
    "https://example.test/source",
  );
  assert.throws(() => uuid("another-user"));
  assert.throws(() => time("24:00"));
  assert.throws(() => timezone("invented/zone"));
  assert.throws(() => choice("admin", STEP_STATUSES));
});
test("redirects and private routes do not trust attacker URLs", () => {
  for (const value of [
    "//evil.test",
    "https://evil.test",
    "/auth/callback",
    "/api/account",
    "/\\evil.test",
  ])
    assert.equal(safeNext(value), "/dashboard");
  assert.equal(safeNext("/support/steps"), "/support/steps");
  assert.ok(protectedPath("/settings"));
  assert.ok(protectedPath("/maintainer"));
  assert.ok(protectedPath("/support/saved"));
  assert.equal(protectedPath("/support/resources"), false);
  assert.equal(protectedPath("/learn/visual-lab/bfs"), false);
});

test("reverse-proxy redirects preserve the public host", async () => {
  const { requestOrigin } = await import("../src/lib/auth/origin");
  assert.equal(
    requestOrigin({
      headers: new Headers({ host: "127.0.0.1:3002" }),
      nextUrl: new URL("http://localhost:3002/settings"),
    }),
    "http://127.0.0.1:3002",
  );
  assert.equal(
    requestOrigin({
      headers: new Headers({
        host: "close.example",
        "x-forwarded-proto": "https",
      }),
      nextUrl: new URL("http://localhost:3002/settings"),
    }),
    "https://close.example",
  );
  assert.throws(() =>
    requestOrigin({
      headers: new Headers({ host: "attacker.example/path" }),
      nextUrl: new URL("http://localhost"),
    }),
  );
});

test("old credentials and legacy demo flags do not enable Phase 3 accounts", async () => {
  const { accountModeEnabled } = await import("../src/lib/auth/mode");
  assert.equal(accountModeEnabled(undefined, "false", true), false);
  assert.equal(accountModeEnabled("true", "true", true), false);
  assert.equal(accountModeEnabled("true", "false", false), false);
  assert.equal(accountModeEnabled("true", "false", true), true);
});
