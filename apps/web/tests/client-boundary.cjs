const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
let count = 0;
function scan(dir) {
  for (const file of fs.readdirSync(dir, { withFileTypes: true })) {
    const name = path.join(dir, file.name);
    if (file.isDirectory()) scan(name);
    else if (/\.js$/.test(name)) {
      const text = fs.readFileSync(name, "utf8");
      assert.ok(
        !/GEMINI_API_KEY|AI_API_KEY|SUPABASE_SERVICE_ROLE_KEY/.test(text),
        "Server secret binding name found in client bundle",
      );
      for (const key of [
        "GEMINI_API_KEY",
        "AI_API_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
      ]) {
        const value = process.env[key];
        if (value && value.length > 12)
          assert.ok(
            !text.includes(value),
            "Server secret value found in client bundle",
          );
      }
      count++;
    }
  }
}
scan(".next/static");
assert.ok(count > 0);
console.log(
  `PASS ${count} client bundles contain no AI/service-role secret bindings or configured secret values`,
);
