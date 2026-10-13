"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account";
import { useLanguage } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { NotificationSettings } from "@/components/notification-settings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import type {
  NotificationData,
  ReminderItem,
} from "@/lib/integrations/notifications/types";
const sample: NotificationData = {
  notifications: [
    {
      id: "sample",
      title: "DEMO — You have a Close AI reminder.",
      body: "Open the sample steps to review it.",
      type: "support_reminder",
      read_at: null,
      action_url: "/support/steps",
      created_at: "2026-10-01T10:00:00Z",
    },
  ],
  reminders: [],
  preferences: null,
};
export default function Notifications() {
  const { demo, request, data: account } = useAccount(),
    { lang } = useLanguage(),
    bn = lang === "bn";
  const [data, setData] = useState<NotificationData>(
      demo ? sample : { notifications: [], reminders: [], preferences: null },
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState("all"),
    [title, setTitle] = useState(""),
    [module, setModule] = useState("support"),
    [recurrence, setRecurrence] = useState("once"),
    [local, setLocal] = useState(""),
    [token, setToken] = useState(() => crypto.randomUUID()),
    [source, setSource] = useState<{ stepId?: string; deadlineId?: string }>(
      {},
    );
  useEffect(() => {
    if (demo) return;
    const q = new URLSearchParams(location.search);
    if (q.has("step")) setSource({ stepId: q.get("step")! });
    if (q.has("deadline")) {
      setSource({ deadlineId: q.get("deadline")! });
      setModule("academic");
    }
    if (q.get("module") === "cp") setModule("cp");
    let active = true;
    request<NotificationData>("/api/notifications")
      .then((v) => {
        if (active) setData(v);
      })
      .catch(() => {
        if (active)
          setError(
            bn ? "Notification লোড হয়নি।" : "Unable to load notifications.",
          );
      });
    return () => {
      active = false;
    };
  }, [demo, request, bn]);
  async function write(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      if (!demo) {
        await request("/api/notifications", body);
        setData(await request<NotificationData>("/api/notifications"));
        window.dispatchEvent(new Event("close-ai-notifications-updated"));
      } else {
        const action = body.action,
          id = body.id;
        setData((s) => ({
          ...s,
          notifications:
            action === "dismiss"
              ? s.notifications.filter((n) => n.id !== id)
              : s.notifications.map((n) =>
                  action === "readAll" || n.id === id
                    ? {
                        ...n,
                        read_at:
                          body.read === false ? null : new Date().toISOString(),
                      }
                    : n,
                ),
          reminders:
            action === "deleteReminder"
              ? s.reminders.filter((r) => r.id !== id)
              : s.reminders.map((r) =>
                  r.id === id ? { ...r, enabled: !!body.enabled } : r,
                ),
        }));
      }
      return true;
    } catch {
      setError(
        bn
          ? "সংরক্ষণ হয়নি। Reminder consent ও network যাচাই করুন।"
          : "Unable to save. Check reminder consent in Settings and your connection.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function schedule() {
    if (demo) {
      const row: ReminderItem = {
        id: token,
        title,
        module,
        recurrence,
        scheduled_for: new Date(local).toISOString(),
        timezone: "Browser local time (DEMO)",
        enabled: true,
        action_step_id: null,
        deadline_id: null,
      };
      setData((s) => ({ ...s, reminders: [...s.reminders, row] }));
      setTitle("");
      setToken(crypto.randomUUID());
      return;
    }
    if (
      await write({
        action: "schedule",
        settings: { title, module, recurrence, local, ...source },
        token,
        confirmed: true,
      })
    ) {
      setTitle("");
      setToken(crypto.randomUUID());
    }
  }
  const notifications = data.notifications.filter(
    (n) => filter === "all" || (filter === "unread" ? !n.read_at : !!n.read_at),
  );
  return (
    <div className="space-y-5">
      <PageHeader
        title={bn ? "Notification কেন্দ্র" : "Notification Center"}
        subtitle={
          bn
            ? "আপনার নিজস্ব ইন-অ্যাপ reminder—সব আপনার নিয়ন্ত্রণে।"
            : "Your own in-app reminders, under your control."
        }
      />
      {error && <p role="alert">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <label className="text-sm">
          {bn ? "অবস্থা" : "Notification status"}
          <Select
            aria-label={bn ? "অবস্থা" : "Notification status"}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">{bn ? "সব" : "All"}</option>
            <option value="unread">{bn ? "অপঠিত" : "Unread"}</option>
            <option value="read">{bn ? "পঠিত" : "Read"}</option>
          </Select>
        </label>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => void write({ action: "readAll" })}
        >
          {bn ? "সব পঠিত করুন" : "Mark all read"}
        </Button>
        {!demo && (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => void write({ action: "deliver" })}
          >
            {bn ? "Due reminder পরীক্ষা" : "Check due reminders"}
          </Button>
        )}
      </div>
      {notifications.length === 0 && (
        <p>{bn ? "কোনো notification নেই।" : "No notifications."}</p>
      )}
      <ul className="space-y-2">
        {notifications.map((n) => (
          <li key={n.id}>
            <Card className="space-y-2 p-4">
              <p className="font-medium">{n.title}</p>
              <p className="text-sm">{n.body}</p>
              <p className="text-xs text-muted-foreground">
                {n.read_at ? (bn ? "পঠিত" : "Read") : bn ? "অপঠিত" : "Unread"} ·{" "}
                {new Date(n.created_at).toLocaleString(bn ? "bn-BD" : "en-GB")}
              </p>
              <div className="flex flex-wrap gap-2">
                {n.action_url &&
                  ["/support/steps", "/study", "/cp", "/learn"].includes(
                    n.action_url,
                  ) && (
                    <Link
                      href={n.action_url}
                      className="text-sm text-primary underline"
                    >
                      {bn ? "খুলুন" : "Open reminder"}
                    </Link>
                  )}
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    void write({ action: "read", id: n.id, read: !n.read_at })
                  }
                >
                  {n.read_at
                    ? bn
                      ? "অপঠিত করুন"
                      : "Mark unread"
                    : bn
                      ? "পঠিত করুন"
                      : "Mark read"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => void write({ action: "dismiss", id: n.id })}
                >
                  {bn ? "সরান" : "Dismiss"}
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <NotificationSettings />
      <Card className="space-y-3 p-4">
        <h2 className="font-bold">
          {bn ? "Reminder তৈরি" : "Create a reminder"}
        </h2>
        <p className="text-xs text-muted-foreground">
          {bn
            ? "আগে Settings-এ Reminders চালু করুন। অ্যাপ খোলা থাকলে due reminder ইন-অ্যাপ আসে; email/push নেই।"
            : "Enable Reminders in Settings first. Due reminders appear in-app while the app is open; email/push are not configured."}{" "}
          <Link href="/settings" className="text-primary underline">
            {bn ? "Settings খুলুন" : "Open Settings"}
          </Link>
        </p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void schedule();
          }}
        >
          <label className="block text-sm">
            {bn ? "ব্যক্তিগত reminder নাম" : "Reminder title"}
            <Input
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            {bn ? "মডিউল" : "Reminder module"}
            <Select
              aria-label={bn ? "মডিউল" : "Reminder module"}
              value={module}
              onChange={(e) => {
                setModule(e.target.value);
                setSource({});
              }}
            >
              <option value="support">
                {bn ? "সহায়তা" : "Student Support"}
              </option>
              <option value="academic">
                {bn ? "পড়াশোনা" : "Academic Study"}
              </option>
              <option value="cp">CP</option>
              <option value="developer">{bn ? "ডেভেলপার" : "Developer"}</option>
            </Select>
          </label>
          <label className="block text-sm">
            {bn ? "পুনরাবৃত্তি" : "Repeat"}
            <Select
              aria-label={bn ? "পুনরাবৃত্তি" : "Repeat"}
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
            >
              <option value="once">{bn ? "একবার" : "Once"}</option>
              <option value="daily">{bn ? "প্রতিদিন" : "Daily"}</option>
              <option value="weekly">{bn ? "প্রতি সপ্তাহ" : "Weekly"}</option>
            </Select>
          </label>
          <label className="block text-sm">
            {bn ? "স্থানীয় তারিখ ও সময়" : "Local reminder date and time"}
            <Input
              type="datetime-local"
              required
              value={local}
              onChange={(e) => setLocal(e.target.value)}
            />
          </label>
          <p className="text-xs">
            {bn ? "সময় অঞ্চল" : "Timezone"}:{" "}
            {demo
              ? bn
                ? "Browser-এর সময়"
                : "Browser local time"
              : account?.profile.timezone || "UTC"}
            .{" "}
            {bn
              ? "ঘড়ি পিছিয়ে একই সময় দুবার হলে standard-time occurrence ব্যবহার হয়।"
              : "Repeated daylight-saving times use the standard-time occurrence."}
          </p>
          <Button type="submit" disabled={busy}>
            {bn ? "অনুমোদন করে reminder তৈরি" : "Approve reminder"}
          </Button>
        </form>
      </Card>
      <section className="space-y-2">
        <h2 className="font-bold">
          {bn ? "আপনার reminder" : "Your reminders"}
        </h2>
        {data.reminders.map((r) => (
          <Card key={r.id} className="space-y-2 p-3">
            <p>
              {r.title} ·{" "}
              {r.enabled ? (bn ? "চালু" : "Enabled") : bn ? "বন্ধ" : "Disabled"}
            </p>
            <p className="text-xs">
              {r.scheduled_for
                ? new Intl.DateTimeFormat(bn ? "bn-BD" : "en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: demo ? undefined : r.timezone,
                  }).format(new Date(r.scheduled_for))
                : bn
                  ? "সময় নির্ধারিত নয়"
                  : "Not scheduled"}{" "}
              · {r.timezone} · {r.recurrence}
            </p>
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() =>
                void write({ action: "toggle", id: r.id, enabled: !r.enabled })
              }
            >
              {r.enabled
                ? bn
                  ? "বন্ধ করুন"
                  : "Disable"
                : bn
                  ? "চালু করুন"
                  : "Enable"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => void write({ action: "deleteReminder", id: r.id })}
            >
              {bn ? "মুছুন" : "Delete reminder"}
            </Button>
          </Card>
        ))}
      </section>
    </div>
  );
}
