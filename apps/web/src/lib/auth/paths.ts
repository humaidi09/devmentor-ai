export function safeNext(value: string | null | undefined) {
  return value &&
    /^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(value) &&
    !value.startsWith("/auth") &&
    !value.startsWith("/api")
    ? value
    : "/dashboard";
}
export function protectedPath(path: string) {
  return (
    [
      "/onboarding",
      "/dashboard",
      "/settings",
      "/notifications",
      "/study",
      "/cp",
      "/support/saved",
      "/support/steps",
      "/maintainer",
    ].some((p) => path === p || path.startsWith(p + "/")) || path === "/learn"
  );
}
