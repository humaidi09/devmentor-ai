import "server-only";
import { fetch as proxyFetch, EnvHttpProxyAgent } from "undici";
// Managed cloud proxies and their CA trust remain active. No TLS bypass.
const agent =
  process.env.HTTPS_PROXY || process.env.HTTP_PROXY
    ? new EnvHttpProxyAgent()
    : undefined;
export const externalFetch: typeof fetch = (async (
  input: RequestInfo | URL,
  init?: RequestInit,
) =>
  proxyFetch(
    input as string,
    { ...init, dispatcher: agent } as Parameters<typeof proxyFetch>[1],
  )) as unknown as typeof fetch;
