"use client";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account";
import { useLanguage } from "@/lib/i18n";
export function OfflineSupport() {
  const { demo } = useAccount();
  const { lang } = useLanguage();
  const [offline, setOffline] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    if (!demo) {
      void navigator.serviceWorker
        ?.getRegistrations()
        .then((rs) =>
          Promise.all(
            rs
              .filter((r) => r.active?.scriptURL === location.origin + "/sw.js")
              .map((r) => r.unregister()),
          ),
        )
        .catch(() => {});
      if ("caches" in window)
        void caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys
                .filter((k) => k.startsWith("close-ai-public-"))
                .map((k) => caches.delete(k)),
            ),
          );
      return;
    }
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => setUnavailable(true));
    }
    // Full document navigation uses cached HTML, without caching Next RSC or chats.
    const navigate = (e: MouseEvent) => {
      if (
        navigator.onLine ||
        e.button ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const a = (e.target as Element).closest<HTMLAnchorElement>("a[href]");
      if (!a || a.target || a.download) return;
      const url = new URL(a.href);
      if (
        url.origin !== location.origin ||
        (url.hash && url.pathname === location.pathname)
      )
        return;
      e.preventDefault();
      e.stopImmediatePropagation();
      location.assign(url.href);
    };
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      document.removeEventListener("click", navigate, true);
    };
  }, [demo]);
  if (!offline && !unavailable) return null;
  return (
    <div
      role="status"
      className="border-b border-border bg-muted px-4 py-2 text-center text-sm"
    >
      {offline
        ? lang === "bn"
          ? "আপনি অফলাইনে আছেন। সংরক্ষিত ডেমো পাতা ও স্থানীয় চ্যাট ব্যবহার করুন। বাইরের লিংকের জন্য ইন্টারনেট দরকার।"
          : "You are offline. Saved demo pages and local chat remain available. External links need a connection."
        : lang === "bn"
          ? "এই ব্রাউজারে অফলাইন সংরক্ষণ চালু করা যায়নি।"
          : "Offline storage could not be enabled in this browser."}
    </div>
  );
}
