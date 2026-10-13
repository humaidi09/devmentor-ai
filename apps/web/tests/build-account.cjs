const { spawnSync } = require("node:child_process");
const { jwt } = require("./local-gateway.cjs");
const result = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  env: {
    ...process.env,
    AI_PROVIDER: "mock",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: jwt("anon"),
    NEXT_PUBLIC_DEMO_MODE: "false",
    NEXT_PUBLIC_ACCOUNT_MODE_ENABLED: "true",
  },
});
process.exit(result.status ?? 1);
