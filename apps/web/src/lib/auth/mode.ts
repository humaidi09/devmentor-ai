/** Legacy environment variables must not silently enable Phase 3 account mode. */
export function accountModeEnabled(
  enabled: string | undefined,
  demo: string | undefined,
  configured: boolean,
) {
  return enabled === "true" && demo === "false" && configured;
}
