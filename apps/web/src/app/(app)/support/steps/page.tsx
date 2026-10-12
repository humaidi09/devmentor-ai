"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { DEMO_NEXT_STEPS } from "@/lib/demo-data";
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
  const { t, lang } = useLanguage();
  const bn = lang === "bn";
  const [steps, setSteps] = useState<NextStep[]>(DEMO_NEXT_STEPS);
  const [draft, setDraft] = useState("");

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

      <Card className="mb-5 flex items-end gap-2 p-3">
        <div className="flex-1">
          <Input
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

      {steps.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {bn ? "কোনো ধাপ নেই।" : "No steps yet."}
        </Card>
      ) : (
        <ul className="space-y-2">
          {steps.map((step) => (
            <li key={step.id}>
              <Card className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{step.title}</p>
                  {step.detail && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
                  )}
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
                  <Select
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
