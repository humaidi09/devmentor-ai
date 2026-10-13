/** Use the incoming host; Next's internal URL can be localhost behind a proxy. */
export function requestOrigin(request: { headers: Headers; nextUrl: URL }) {
  const configured = (process.env.CLOSE_AI_SITE_URL ?? "").trim();
  if (configured) return new URL(configured).origin;
  const host = request.headers.get("host");
  const forwarded = request.headers.get("x-forwarded-proto");
  const protocol =
    forwarded === "https"
      ? "https:"
      : forwarded === "http"
        ? "http:"
        : request.nextUrl.protocol;
  if (!host || !/^[a-zA-Z0-9.:[\]-]+$/.test(host))
    throw new Error("Invalid request host");
  return new URL(protocol + "//" + host).origin;
}
