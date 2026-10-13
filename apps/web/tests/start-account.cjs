const { spawn } = require("node:child_process");
const { jwt } = require("./local-gateway.cjs");
const child = spawn(
  "npm",
  ["start", "--", "--hostname", "127.0.0.1", "--port", "3002"],
  {
    stdio: "inherit",
    detached: process.platform !== "win32",
    env: {
      ...process.env,
      AI_PROVIDER: "mock",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: jwt("anon"),
      NEXT_PUBLIC_DEMO_MODE: "false",
      NEXT_PUBLIC_ACCOUNT_MODE_ENABLED: "true",
    },
  },
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => {
    if (process.platform === "win32") child.kill(signal);
    else {
      try {
        process.kill(-child.pid, signal);
      } catch {
        /* group already exited */
      }
    }
  });
child.on("exit", (code) => process.exit(code ?? 1));
