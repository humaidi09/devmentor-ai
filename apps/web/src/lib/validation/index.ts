export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ApiError(400, "Invalid input.");
  return value as Record<string, unknown>;
}
export function exact(value: Record<string, unknown>, keys: string[]) {
  if (Object.keys(value).some((k) => !keys.includes(k)))
    throw new ApiError(400, "Unexpected field.");
}
export function text(value: unknown, max = 200, empty = false): string {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (!empty && !value.trim())
  )
    throw new ApiError(400, "Invalid text.");
  return value.trim();
}
export function bool(value: unknown): boolean {
  if (typeof value !== "boolean")
    throw new ApiError(400, "Invalid preference.");
  return value;
}
export function choice<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T {
  if (typeof value !== "string" || !allowed.includes(value as T))
    throw new ApiError(400, "Invalid option.");
  return value as T;
}
export function id(value: unknown): string {
  const v = text(value, 100);
  if (!/^[a-zA-Z0-9_-]+$/.test(v))
    throw new ApiError(400, "Invalid identifier.");
  return v;
}
export function uuid(value: unknown): string {
  const v = text(value, 36);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v,
    )
  )
    throw new ApiError(400, "Invalid identifier.");
  return v;
}
export function integer(value: unknown, max = 10000) {
  if (!Number.isInteger(value) || Number(value) < 0 || Number(value) > max)
    throw new ApiError(400, "Invalid number.");
  return Number(value);
}
export function time(value: unknown) {
  const v = text(value, 5);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v))
    throw new ApiError(400, "Invalid time.");
  return v;
}
export function date(value: unknown): string | null {
  if (value === null || value === "") return null;
  const v = text(value, 40);
  if (!/^\d{4}-\d\d-\d\dT/.test(v) || !Number.isFinite(Date.parse(v)))
    throw new ApiError(400, "Invalid date.");
  return new Date(v).toISOString();
}
export function https(value: unknown): string {
  const v = text(value, 2000);
  try {
    const url = new URL(v);
    if (url.protocol !== "https:" || url.username || url.password)
      throw new Error();
    return url.href;
  } catch {
    throw new ApiError(400, "Use an HTTPS source URL.");
  }
}
export function timezone(value: unknown) {
  const v = text(value, 80);
  try {
    new Intl.DateTimeFormat("en", { timeZone: v });
    return v;
  } catch {
    throw new ApiError(400, "Invalid timezone.");
  }
}
export function validateAuth(value: unknown) {
  const b = object(value);
  exact(b, ["action", "email", "password"]);
  const action = choice(b.action, ["signup", "signin"]);
  const email = text(b.email, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new ApiError(400, "Invalid email.");
  if (
    typeof b.password !== "string" ||
    b.password.length > 128 ||
    b.password.length < (action === "signup" ? 12 : 1)
  )
    throw new ApiError(400, "Invalid password.");
  return { action, email, password: b.password };
}
export function validatePreferences(value: unknown) {
  const b = object(value);
  exact(b, [
    "campus",
    "modules",
    "reminders",
    "quietStart",
    "quietEnd",
    "onboarded",
    "support",
  ]);
  const m = object(b.modules);
  exact(m, ["academic", "developer", "cp"]);
  return {
    campus: b.campus === "not-listed" ? "" : id(b.campus),
    support: b.support === undefined ? true : bool(b.support),
    academic: bool(m.academic),
    developer: bool(m.developer),
    cp: bool(m.cp),
    reminders: bool(b.reminders),
    quietStart: time(b.quietStart),
    quietEnd: time(b.quietEnd),
    onboarded: bool(b.onboarded),
  };
}
export const STEP_STATUSES = [
  "not_started",
  "in_progress",
  "waiting",
  "completed",
  "not_relevant",
] as const;
export const CONSENT_TYPES = [
  "optional_profile_data",
  "reminders",
  "support_data_storage",
  "notifications",
] as const;
