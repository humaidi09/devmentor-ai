"use client";
import { useEffect, useState } from "react";
export function ApiStatus() {
  const [waiting, setWaiting] = useState(false);
  useEffect(() => {
    const onWaiting = (event: Event) => setWaiting(Boolean((event as CustomEvent).detail));
    window.addEventListener("api-waiting", onWaiting);
    return () => window.removeEventListener("api-waiting", onWaiting);
  }, []);
  return waiting ? <div role="status" className="border-b border-border bg-muted px-4 py-2 text-center text-xs">Connecting to the server. It may take up to a minute to wake up.</div> : null;
}
