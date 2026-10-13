"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account";
import { useLanguage } from "@/lib/i18n";
import type { NotificationData } from "@/lib/integrations/notifications/types";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
const defaults = {
  inApp: false,
  previews: false,
  support: true,
  academic: true,
  cp: true,
  developer: true,
  quiet: false,
  start: "22:00",
  end: "07:00",
  timezone: "UTC",
};
export function NotificationSettings() {
  const { demo, userId, data, request, refresh } = useAccount(),
    { lang } = useLanguage(),
    bn = lang === "bn";
  const [draft, setDraft] = useState(defaults),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (demo || !userId) return;
    let active = true;
    request<NotificationData>("/api/notifications")
      .then((v) => {
        if (active) {
          const p = v.preferences;
          setDraft({
            ...defaults,
            inApp: p?.in_app_enabled ?? false,
            previews: p?.preview_details ?? false,
            support: p?.support_enabled ?? true,
            academic: p?.academic_enabled ?? true,
            cp: p?.cp_enabled ?? true,
            developer: p?.developer_enabled ?? true,
            quiet: p?.quiet_hours_enabled ?? false,
            start: data?.profile.quiet_hours_start?.slice(0, 5) || "22:00",
            end: data?.profile.quiet_hours_end?.slice(0, 5) || "07:00",
            timezone: data?.profile.timezone || "UTC",
          });
        }
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [
    demo,
    userId,
    request,
    data?.profile.timezone,
    data?.profile.quiet_hours_start,
    data?.profile.quiet_hours_end,
  ]);
  async function save() {
    setBusy(true);
    setStatus("");
    try {
      if (!demo) {
        await request("/api/notifications", {
          action: "preferences",
          settings: draft,
        });
        await refresh();
      }
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }
  const labels = {
    inApp: bn ? "ইন-অ্যাপ notification চালু" : "Enable in-app notifications",
    previews: bn
      ? "শেখার reminder-এর বিস্তারিত preview"
      : "Show learning reminder details in previews",
    support: bn ? "সহায়তার reminder" : "Support reminders",
    academic: bn ? "পড়াশোনার reminder" : "Academic reminders",
    cp: bn ? "CP reminder" : "CP practice reminders",
    developer: bn ? "ডেভেলপার reminder" : "Developer reminders",
    quiet: bn ? "নীরব সময় চালু" : "Enable quiet hours",
  };
  return (
    <Card className="space-y-3 p-4">
      <h2 className="font-bold">
        {bn ? "Notification পছন্দ" : "Notification preferences"}
      </h2>
      <p className="text-xs text-muted-foreground">
        {bn
          ? "সহায়তার reminder-এ সর্বদা সাধারণ লেখা থাকে। পছন্দ সংরক্ষণ এবং প্রতিটি reminder অনুমোদন করতে হবে।"
          : "Support reminder previews always use generic text. Save preferences and explicitly approve each reminder."}
      </p>
      {(Object.keys(labels) as (keyof typeof labels)[]).map((k) => (
        <label key={k} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft[k]}
            disabled={busy}
            onChange={(e) => setDraft((s) => ({ ...s, [k]: e.target.checked }))}
          />
          {labels[k]}
        </label>
      ))}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          {bn ? "নীরব সময় শুরু" : "Quiet hours start"}
          <Input
            disabled={busy}
            type="time"
            value={draft.start}
            onChange={(e) => setDraft((s) => ({ ...s, start: e.target.value }))}
          />
        </label>
        <label className="text-sm">
          {bn ? "নীরব সময় শেষ" : "Quiet hours end"}
          <Input
            disabled={busy}
            type="time"
            value={draft.end}
            onChange={(e) => setDraft((s) => ({ ...s, end: e.target.value }))}
          />
        </label>
      </div>
      <label className="block text-sm">
        {bn ? "Reminder timezone (IANA)" : "Reminder timezone (IANA)"}
        <Input
          value={draft.timezone}
          maxLength={80}
          placeholder="Asia/Dhaka"
          onChange={(e) =>
            setDraft((s) => ({ ...s, timezone: e.target.value }))
          }
        />
      </label>
      <p className="text-xs text-muted-foreground">
        {bn
          ? "শুরু ও শেষ একই হলে সারাদিন নীরব থাকবে। Browser খোলা থাকলে reminder পরীক্ষা হয়।"
          : "Equal quiet times mean all-day quiet. Reminders are checked while the app is open."}
      </p>
      <Button disabled={busy} onClick={save}>
        {bn ? "Notification পছন্দ সংরক্ষণ" : "Save notification preferences"}
      </Button>
      <Link
        href="/notifications"
        className="ml-3 text-sm text-primary underline"
      >
        {bn ? "Notification কেন্দ্র" : "Notification Center"}
      </Link>
      {status && (
        <p role={status === "error" ? "alert" : "status"}>
          {status === "error"
            ? bn
              ? "সংরক্ষণ হয়নি, আবার চেষ্টা করুন।"
              : "Unable to save. Try again."
            : demo
              ? bn
                ? "DEMO—এই সেশনের পছন্দ।"
                : "DEMO — preferences for this session."
              : bn
                ? "Notification পছন্দ সংরক্ষিত।"
                : "Notification preferences saved."}
        </p>
      )}
    </Card>
  );
}
