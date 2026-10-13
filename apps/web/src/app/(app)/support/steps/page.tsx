"use client";

import { Bell, BellOff, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useAccount } from "@/lib/account";
import { usePreferences } from "@/lib/preferences";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { DEMO_NEXT_STEPS } from "@/lib/demo-data";
import { localize } from "@/lib/content-bn";
import { useLanguage } from "@/lib/i18n";
import type { NextStep, StepStatus } from "@/lib/types";

const STATUS_LABELS: Record<StepStatus, { en: string; bn: string }> = {
  not_started: { en: "Not started", bn: "শুরু হয়নি" },
  in_progress: { en: "In progress", bn: "চলছে" },
  waiting: { en: "Waiting", bn: "অপেক্ষায়" },
  completed: { en: "Completed", bn: "সম্পন্ন" },
  not_relevant: { en: "Not relevant", bn: "প্রাসঙ্গিক নয়" },
};

export default function StepsPage() {
  const { demo, data, mutate, request, refresh, busy } = useAccount();
  const [planTitle, setPlanTitle] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(
    null,
  );
  const planId = selectedPlan || data?.plans[0]?.id || "";
  const { preferences } = usePreferences();
  const { t, lang } = useLanguage();
  const bn = lang === "bn";
  const [demoSteps, setSteps] = useState<NextStep[]>(DEMO_NEXT_STEPS);
  useEffect(() => {
    if (demo) {
      try {
        const approved = JSON.parse(
          sessionStorage.getItem("close-ai-demo-approved-steps") || "[]",
        );
        if (Array.isArray(approved))
          setSteps([...DEMO_NEXT_STEPS, ...approved]);
      } catch {
        /* session-only demo */
      }
    }
  }, [demo]);
  const [draft, setDraft] = useState("");
  const [demoReminders, setReminders] = useState<Record<string, boolean>>({});

  const steps = demo
    ? demoSteps
    : (data?.steps.filter((s) => s.planId === planId) ?? []);
  const reminders = demo
    ? demoReminders
    : Object.fromEntries((data?.reminders ?? []).map((id) => [id, true]));
  async function createPlan() {
    if (!planTitle.trim()) return;
    try {
      const value = await request<{ id: string }>("/api/data/plans", {
        title: planTitle,
        resourceId: new URLSearchParams(location.search).get("resource"),
      });
      setSelectedPlan(value.id);
      setPlanTitle("");
      await refresh();
    } catch {
      /* Account provider announces the error; do not retry a non-idempotent creation. */
    }
  }
  async function reorder(index: number, offset: number) {
    const next = [...steps];
    const target = index + offset;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    if (demo) setSteps(next);
    else await mutate("reorder", { planId, ids: next.map((s) => s.id) });
  }
  async function edit() {
    if (!editing?.title.trim()) return;
    if (demo)
      setSteps((s) =>
        s.map((x) =>
          x.id === editing.id ? { ...x, title: editing.title } : x,
        ),
      );
    else if (!(await mutate("steps", editing, "PATCH"))) return;
    setEditing(null);
  }

  async function add() {
    const title = draft.trim();
    if (!title) return;
    if (!demo) {
      if (await mutate("steps", { planId, title })) setDraft("");
      return;
    }
    setSteps((s) => [
      ...s,
      {
        id: `s_${Date.now()}`,
        title,
        status: "not_started",
        source: "ai_suggestion",
      },
    ]);
    setDraft("");
  }
  function setStatus(id: string, status: StepStatus) {
    if (!demo) {
      void mutate("steps", { id, status }, "PATCH");
      return;
    }
    setSteps((s) => s.map((x) => (x.id === id ? { ...x, status } : x)));
  }
  function remove(id: string) {
    if (!demo) {
      void mutate("steps", { id }, "DELETE");
      return;
    }
    setSteps((s) => s.filter((x) => x.id !== id));
  }

  return (
    <div>
      <PageHeader
        title={t("nextSteps")}
        subtitle={
          bn
            ? "আপনি যা অনুমোদন করেছেন সেগুলোই এখানে — সব আপনার নিয়ন্ত্রণে।"
            : "Only actions you approved — all under your control."
        }
      />

      {!demo && (
        <Card className="mb-5 space-y-3 p-4">
          <label htmlFor="plan-title">
            {bn ? "নতুন পরিকল্পনার নাম" : "New plan title"}
          </label>
          <Input
            id="plan-title"
            value={planTitle}
            onChange={(e) => setPlanTitle(e.target.value)}
            maxLength={200}
          />
          <Button disabled={busy} onClick={() => void createPlan()}>
            {bn ? "পরিকল্পনা তৈরি করুন" : "Create plan"}
          </Button>
          <label htmlFor="plan-select" className="block">
            {bn ? "পরিকল্পনা" : "Plan"}
          </label>
          <Select
            id="plan-select"
            value={planId}
            onChange={(e) => setSelectedPlan(e.target.value)}
          >
            <option value="">
              {bn ? "পরিকল্পনা বেছে নিন" : "Choose a plan"}
            </option>
            {data?.plans.map((p) => (
              <option value={p.id} key={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
          {planId && (
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => {
                if (
                  confirm(
                    bn
                      ? "পরিকল্পনা ও ধাপগুলো মুছবেন?"
                      : "Delete this plan and its steps?",
                  )
                )
                  void mutate("plans", { id: planId }, "DELETE").then((ok) => {
                    if (ok) setSelectedPlan("");
                  });
              }}
            >
              {bn ? "পরিকল্পনা মুছুন" : "Delete plan"}
            </Button>
          )}
          <p className="text-xs">
            {bn
              ? "সংরক্ষণের আগে Settings-এ support data consent চালু করুন।"
              : "Enable support-data storage consent in Settings before saving a plan."}
          </p>
        </Card>
      )}
      <label htmlFor="new-step" className="mb-2 block text-sm font-medium">
        {bn ? "নতুন ধাপ" : "New step"}
      </label>
      <Card className="mb-5 flex items-end gap-2 p-3">
        <div className="flex-1">
          <Input
            id="new-step"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder={bn ? "নতুন ধাপ যোগ করুন…" : "Add a step…"}
            aria-label={bn ? "নতুন ধাপ" : "New step"}
          />
        </div>
        <Button
          disabled={busy || (!demo && !planId)}
          onClick={() => void add()}
        >
          <Plus className="h-4 w-4" aria-hidden />
          {bn ? "যোগ" : "Add"}
        </Button>
      </Card>

      <p className="mb-3 text-sm text-muted-foreground">
        {!demo
          ? bn
            ? "ধাপ ও রিমাইন্ডারের ইচ্ছা অ্যাকাউন্টে সংরক্ষিত থাকে। কোনো বিজ্ঞপ্তি পাঠানো হয় না।"
            : "Steps and reminder intent persist in your account. No notifications are sent."
          : bn
            ? "ধাপ ও রিমাইন্ডার চিহ্ন এই পাতা খোলা থাকা পর্যন্ত থাকে। রিমাইন্ডার চালু করতে সেটিংস ব্যবহার করুন।"
            : "Steps and reminder flags last while this page is open. Enable reminders in Settings."}
      </p>
      {steps.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {bn ? "কোনো ধাপ নেই।" : "No steps yet."}
        </Card>
      ) : (
        <ul className="space-y-2">
          {steps.map((step, index) => (
            <li key={step.id}>
              <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  {editing?.id === step.id ? (
                    <div className="space-y-2">
                      <label htmlFor="edit-step">
                        {bn ? "ধাপের নাম" : "Step title"}
                      </label>
                      <Input
                        id="edit-step"
                        value={editing.title}
                        onChange={(e) =>
                          setEditing({ ...editing, title: e.target.value })
                        }
                        maxLength={200}
                      />
                      <Button disabled={busy} onClick={() => void edit()}>
                        {t("save")}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setEditing(null)}
                      >
                        {bn ? "বাদ দিন" : "Cancel"}
                      </Button>
                    </div>
                  ) : (
                    <p className="font-medium">{localize(step.title, lang)}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        setEditing({ id: step.id, title: step.title })
                      }
                    >
                      {bn ? "সম্পাদনা" : "Edit"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy || index === 0}
                      onClick={() => void reorder(index, -1)}
                    >
                      {bn ? "উপরে" : "Move up"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy || index === steps.length - 1}
                      onClick={() => void reorder(index, 1)}
                    >
                      {bn ? "নিচে" : "Move down"}
                    </Button>
                  </div>
                  {step.detail && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {localize(step.detail, lang)}
                    </p>
                  )}
                  {preferences.reminders && reminders[step.id] && (
                    <p role="status" className="mt-2 text-xs text-primary">
                      {bn
                        ? "রিমাইন্ডার চিহ্নিত — কোনো বাইরের বার্তা নয়"
                        : "Reminder flagged — no external message"}
                    </p>
                  )}
                  <Badge
                    variant={step.source === "verified" ? "success" : "muted"}
                    className="mt-2"
                  >
                    {step.source === "verified"
                      ? bn
                        ? "যাচাইকৃত রিসোর্স থেকে"
                        : "From a verified resource"
                      : step.source === "manual"
                        ? bn
                          ? "আপনার ধাপ"
                          : "Your step"
                        : bn
                          ? "AI পরামর্শ"
                          : "AI suggestion"}
                  </Badge>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <label htmlFor={`status-${step.id}`} className="text-xs">
                    {bn ? "অবস্থা" : "Status"}
                  </label>
                  <Select
                    id={`status-${step.id}`}
                    value={step.status}
                    onChange={(e) =>
                      setStatus(step.id, e.target.value as StepStatus)
                    }
                    aria-label={bn ? "অবস্থা" : "Status"}
                    className="h-9 w-auto text-xs"
                  >
                    {(Object.keys(STATUS_LABELS) as StepStatus[]).map((k) => (
                      <option key={k} value={k}>
                        {bn ? STATUS_LABELS[k].bn : STATUS_LABELS[k].en}
                      </option>
                    ))}
                  </Select>
                  <button
                    type="button"
                    onClick={() => {
                      if (demo)
                        setReminders((r) => ({ ...r, [step.id]: !r[step.id] }));
                      else
                        void mutate("reminders", {
                          stepId: step.id,
                          enabled: !reminders[step.id],
                        });
                    }}
                    disabled={busy || !preferences.reminders}
                    aria-pressed={!!reminders[step.id]}
                    aria-label={bn ? "ইন-অ্যাপ রিমাইন্ডার" : "In-app reminder"}
                    title={
                      bn
                        ? "ইন-অ্যাপ রিমাইন্ডার (লক-স্ক্রিনে কিছু দেখায় না)"
                        : "In-app reminder (nothing shows on your lock screen)"
                    }
                    className={`rounded-md p-2 transition-colors hover:bg-muted ${reminders[step.id] ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {reminders[step.id] ? (
                      <Bell className="h-4 w-4" aria-hidden />
                    ) : (
                      <BellOff className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(step.id)}
                    aria-label={bn ? "মুছুন" : "Delete"}
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
