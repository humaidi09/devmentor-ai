import { API_BASE, DEMO_MODE } from "./config";
import { getAccessToken } from "./auth";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!API_BASE) throw new ApiError(503, "The API address is not configured. Please contact the administrator.");
  const token = await getAccessToken();
  if (!DEMO_MODE && !token) {
    if (typeof window !== "undefined") window.dispatchEvent(new Event("auth-required"));
    throw new ApiError(401, "Please sign in to continue.");
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 70000);
  const waking = setTimeout(() => {
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("api-waiting", { detail: true }));
  }, 5000);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(504, "The server is taking too long to respond. It may be waking up; please try again.");
    }
    throw new ApiError(0, "Cannot reach the server. Check your connection and try again.");
  } finally {
    clearTimeout(timeout);
    clearTimeout(waking);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("api-waiting", { detail: false }));
  }
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") window.dispatchEvent(new Event("auth-required"));
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.error?.message || message;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T = unknown>(path: string) => apiFetch<T>(path),
  post: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  del: <T = unknown>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
