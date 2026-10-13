"use client";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { academicSuggestions } from "@/lib/recommendations/learning";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
export function StudySuggestions({
  deadlines,
  tasks,
  onSave,
}: {
  deadlines: { id: string; title: string; due_at: string; status: string }[];
  tasks: { title: string; completed: boolean }[];
  onSave: (title: string, plannedFor: string | null) => Promise<boolean>;
}) {
  const { lang } = useLanguage(),
    bn = lang === "bn";
  const [drafts, setDrafts] = useState<
      { title: string; reason: string; local: string }[] | null
    >(null),
    [busy, setBusy] = useState(false),
    [state, setState] = useState("");
  function generate() {
    setDrafts(
      academicSuggestions(deadlines, tasks).map((s) => ({ ...s, local: "" })),
    );
    setState("");
  }
  return (
    <Card className="space-y-3 p-4">
      <h2 className="font-bold">
        {bn
          ? "আপনার তথ্য অনুযায়ী study suggestion"
          : "Study suggestions from your own data"}
      </h2>
      <p className="text-xs text-muted-foreground">
        {bn
          ? "নিয়ম অনুযায়ী upcoming deadline ও অসম্পূর্ণ task থেকে draft আসে। AI ব্যবহার হয় না। অনুমোদনের আগে কিছুই schedule হয় না।"
          : "Rule-based drafts use your upcoming deadlines and unfinished tasks. No AI call. Nothing is scheduled before your approval."}
      </p>
      <Button variant="secondary" onClick={generate} disabled={busy}>
        {bn ? "Study draft তৈরি" : "Draft study suggestions"}
      </Button>
      {drafts?.length === 0 && (
        <p>
          {bn
            ? "আগে একটি upcoming deadline বা task যোগ করুন।"
            : "Add an upcoming deadline or unfinished task first."}
        </p>
      )}
      {drafts?.map((s, i) => (
        <section
          key={i}
          className="space-y-2 rounded-md border p-3"
          aria-label={`Study suggestion ${i + 1}`}
        >
          <p className="text-xs">
            {bn
              ? "কারণ: আপনার নিজের deadline/task"
              : "Reason: your own deadline or unfinished task"}
          </p>
          <label className="block text-sm">
            {bn ? "Suggestion title" : "Suggestion title"}
            <Input
              maxLength={200}
              value={s.title}
              onChange={(e) =>
                setDrafts((d) =>
                  d!.map((x, j) =>
                    j === i ? { ...x, title: e.target.value } : x,
                  ),
                )
              }
            />
          </label>
          <label className="block text-sm">
            {bn
              ? "Study time (ঐচ্ছিক, browser timezone)"
              : "Study time (optional, browser timezone)"}
            <Input
              type="datetime-local"
              value={s.local}
              onChange={(e) =>
                setDrafts((d) =>
                  d!.map((x, j) =>
                    j === i ? { ...x, local: e.target.value } : x,
                  ),
                )
              }
            />
          </label>
          <div className="flex gap-2">
            <Button
              disabled={busy || !s.title.trim()}
              size="sm"
              onClick={async () => {
                setBusy(true);
                if (
                  await onSave(
                    s.title,
                    s.local ? new Date(s.local).toISOString() : null,
                  )
                ) {
                  setDrafts((d) => d!.filter((_, j) => j !== i));
                  setState("saved");
                } else setState("error");
                setBusy(false);
              }}
            >
              {bn ? "অনুমোদন করে task সংরক্ষণ" : "Approve study task"}
            </Button>
            <Button
              disabled={busy}
              variant="ghost"
              size="sm"
              onClick={() => setDrafts((d) => d!.filter((_, j) => j !== i))}
            >
              {bn ? "বাতিল" : "Reject suggestion"}
            </Button>
          </div>
        </section>
      ))}
      {state && (
        <p role={state === "error" ? "alert" : "status"}>
          {state === "saved"
            ? bn
              ? "অনুমোদিত study task সংরক্ষিত।"
              : "Approved study task saved."
            : bn
              ? "সংরক্ষণ হয়নি।"
              : "Unable to save suggestion."}
        </p>
      )}
    </Card>
  );
}
