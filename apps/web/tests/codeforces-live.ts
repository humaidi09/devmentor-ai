// Explicit public-data smoke test; no student profile/support data or secrets.
import { fetch as http, EnvHttpProxyAgent } from "undici";
import { CodeforcesClient } from "../src/lib/integrations/codeforces/client";
async function main() {
  const agent = new EnvHttpProxyAgent();
  try {
    const request = ((url: RequestInfo | URL, init?: RequestInit) =>
      http(
        url as string,
        { ...init, dispatcher: agent } as any,
      )) as unknown as typeof fetch;
    const client = new CodeforcesClient(request);
    const profile = await client.profile("tourist");
    await new Promise((resolve) => setTimeout(resolve, 2200));
    const history = await client.submissions(profile.handle);
    await new Promise((resolve) => setTimeout(resolve, 2200));
    const problems = await client.problems("graphs");
    console.log(
      JSON.stringify({
        provider: "codeforces",
        validatedProfile: !!profile.handle,
        submissionSample: history.length,
        publicProblemSample: problems.length,
        publicFieldsOnly: true,
      }),
    );
  } finally {
    await agent.close();
  }
}
main().catch((e) => {
  console.error(
    JSON.stringify({ provider: "codeforces", error: e?.kind || "unavailable" }),
  );
  process.exitCode = 1;
});
