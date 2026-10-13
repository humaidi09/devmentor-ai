"use client";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account";
import { useLanguage } from "@/lib/i18n";
import type { NotificationData } from "@/lib/integrations/notifications/types";
export function NotificationLink() {
  const { demo, userId, request } = useAccount(),
    { lang } = useLanguage();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (demo || !userId) return;
    let active = true,
      inFlight = false;
    async function poll() {
      if (
        document.visibilityState !== "visible" ||
        !navigator.onLine ||
        inFlight
      )
        return;
      inFlight = true;
      try {
        await request("/api/notifications", { action: "deliver" });
        const data = await request<NotificationData>("/api/notifications");
        if (active)
          setCount(data.notifications.filter((n) => !n.read_at).length);
      } catch {
        /* Retry when visible/online; core pages remain usable. */
      } finally {
        inFlight = false;
      }
    }
    void poll();
    const timer = setInterval(() => void poll(), 60000);
    window.addEventListener("close-ai-notifications-updated", poll);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("close-ai-notifications-updated", poll);
    };
  }, [demo, userId, request]);
  return (
    <Link
      href="/notifications"
      className="relative rounded-md p-2 hover:bg-muted"
      aria-label={
        lang === "bn"
          ? `Notification (${count} অপঠিত)`
          : `Notifications (${count} unread)`
      }
    >
      <Bell className="h-5 w-5" aria-hidden />
      {count > 0 && (
        <span
          className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-[10px] text-primary-foreground"
          aria-hidden
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
