"use client";

import { Bell, BellOff, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

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
  const { preferences } = usePreferences();
  const { t, lang } = useLanguage();
  const bn = lang === "bn";
  const [steps, setSteps] = useState<NextStep[]>(DEMO_NEXT_STEPS);
  const [draft, setDraft] = useState("");
  const [reminders, setReminders] = useState<Record<string, boolean>>({});

  function add() {
    const title = draft.trim();
    if (!title) return;
    setSteps((s) => [
      ...s,
      { id: `s_${Date.now()}`, title, status: "not_started", source: "ai_suggestion" },
    ]);
    setDraft("");
  }
  function setStatus(id: string, status: StepStatus) {
    setSteps((s) => s.map((x) => (x.id === id ? { ...x, status } : x)));
  }
  function remove(id: string) {
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

      <label htmlFor="new-step" className="mb-2 block text-sm font-medium">{bn ? "নতুন ধাপ" : "New step"}</label>
      <Card className="mb-5 flex items-end gap-2 p-3">
        <div className="flex-1">
          <Input id="new-step"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder={bn ? "নতুন ধাপ যোগ করুন…" : "Add a step…"}
            aria-label={bn ? "নতুন ধাপ" : "New step"}
          />
        </div>
        <Button onClick={add}>
          <Plus className="h-4 w-4" aria-hidden />
          {bn ? "যোগ" : "Add"}
        </Button>
      </Card>

      <p className="mb-3 text-sm text-muted-foreground">{bn ? "ধাপ ও রিমাইন্ডার চিহ্ন এই পাতা খোলা থাকা পর্যন্ত থাকে। রিমাইন্ডার চালু করতে সেটিংস ব্যবহার করুন।" : "Steps and reminder flags last while this page is open. Enable reminders in Settings."}</p>
      {steps.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {bn ? "কোনো ধাপ নেই।" : "No steps yet."}
        </Card>
      ) : (
        <ul className="space-y-2">
          {steps.map((step) => (
            <li key={step.id}>
              <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{localize(step.title, lang)}</p>
                  {step.detail && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{localize(step.detail, lang)}</p>
                  )}
                  {preferences.reminders && reminders[step.id] && <p role="status" className="mt-2 text-xs text-primary">{bn ? "রিমাইন্ডার চিহ্নিত — কোনো বাইরের বার্তা নয়" : "Reminder flagged — no external message"}</p>}
                  <Badge variant={step.source === "verified" ? "success" : "muted"} className="mt-2">
                    {step.source === "verified"
                      ? bn
                        ? "যাচাইকৃত রিসোর্স থেকে"
                        : "From a verified resource"
                      : bn
                        ? "AI পরামর্শ"
                        : "AI suggestion"}
                  </Badge>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <label htmlFor={`status-${step.id}`} className="text-xs">{bn ? "অবস্থা" : "Status"}</label><Select id={`status-${step.id}`}
                    value={step.status}
                    onChange={(e) => setStatus(step.id, e.target.value as StepStatus)}
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
                    onClick={() => setReminders((r) => ({ ...r, [step.id]: !r[step.id] }))}
                    disabled={!preferences.reminders}
                    aria-pressed={!!reminders[step.id]}
                    aria-label={bn ? "ইন-অ্যাপ রিমাইন্ডার" : "In-app reminder"}
                    title={bn ? "ইন-অ্যাপ রিমাইন্ডার (লক-স্ক্রিনে কিছু দেখায় না)" : "In-app reminder (nothing shows on your lock screen)"}
                    className={`rounded-md p-2 transition-colors hover:bg-muted ${reminders[step.id] ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {reminders[step.id] ? <Bell className="h-4 w-4" aria-hidden /> : <BellOff className="h-4 w-4" aria-hidden />}
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
