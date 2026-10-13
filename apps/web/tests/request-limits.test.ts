import test from "node:test";
import assert from "node:assert/strict";
import { requestJson } from "../src/lib/validation/request";
import { ApiError } from "../src/lib/validation";
test("bounded JSON accepts bilingual messages but rejects malformed/chunked oversize requests without a length header", async () => {
  assert.deepEqual(
    await requestJson(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ message: "টিউশন ফি নিয়ে চিন্তিত" }),
      }),
    ),
    { message: "টিউশন ফি নিয়ে চিন্তিত" },
  );
  for (const [body, status] of [
    ["{broken", 400],
    [JSON.stringify({ message: "x".repeat(13000) }), 413],
  ] as const) {
    await assert.rejects(
      () =>
        requestJson(new Request("http://localhost", { method: "POST", body })),
      (e) => e instanceof ApiError && e.status === status,
    );
  }
});
