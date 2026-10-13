import { ApiError } from ".";
/** Bound bytes before JSON parsing, including requests without Content-Length. */
export async function requestJson(
  req: Request,
  maxBytes = 12000,
): Promise<unknown> {
  if (Number(req.headers.get("content-length")) > maxBytes)
    throw new ApiError(413, "Request too large.");
  const reader = req.body?.getReader();
  if (!reader) throw new ApiError(400, "Invalid request.");
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const r = await reader.read();
      if (r.done) break;
      bytes += r.value.byteLength;
      if (bytes > maxBytes) throw new ApiError(413, "Request too large.");
      chunks.push(r.value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const buffer = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(buffer));
  } catch {
    throw new ApiError(400, "Invalid request.");
  }
}
