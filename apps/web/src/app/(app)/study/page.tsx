"use client";

import { CalendarClock, Check, Plus } from "lucide-react";
import { useState } from "react";

import { useAccount } from "@/lib/account";
import { AccountStudy } from "@/components/account-study";
import { KnowledgeCollection } from "@/components/knowledge-collection";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { localize } from "@/lib/content-bn";
import { useLanguage } from "@/lib/i18n";
import {
  DEMO_COURSES,
  DEMO_DEADLINES,
  DEMO_STUDY_TASKS,
  type StudyTask,
} from "@/lib/modules-data";
import { cn, daysUntil, formatDate } from "@/lib/utils";

export default function StudyPage() {
  const { demo } = useAccount();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [tasks, setTasks] = useState<StudyTask[]>(DEMO_STUDY_TASKS);
  const [draft, setDraft] = useState("");
  const deadlines = [...DEMO_DEADLINES].sort(
    (a, b) => new Date(a.due).getTime() - new Date(b.due).getTime(),
  );
  const courseCode = (id: string) =>
    DEMO_COURSES.find((c) => c.id === id)?.code ?? "";

  function addTask() {
    const title = draft.trim();
    if (!title) return;
    setTasks((s) => [...s, { id: `t_${Date.now()}`, title, done: false }]);
    setDraft("");
  }
  function toggle(id: string) {
    setTasks((s) => s.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  }

  if (!demo) return <div className="space-y-5"><KnowledgeCollection collection="study" /><AccountStudy /></div>;
  return (
    <div className="space-y-6">
      <PageHeader
        title={bn ? "একাডেমিক স্টাডি" : "Academic Study"}
        subtitle={
          bn
            ? "কোর্স, ডেডলাইন ও পড়ার পরিকল্পনা — সবই আপনি সম্পাদনা করতে পারেন।"
            : "Courses, deadlines, and study plans — all editable by you."
        }
      />

      <KnowledgeCollection collection="study" onDemoAdd={(title) => setTasks((current) => [...current, { id: `knowledge_${Date.now()}`, title, done: false }])} />

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-bold">{bn ? "কোর্স" : "Courses"}</h2>
          <div className="space-y-2">
            {DEMO_COURSES.map((c) => (
              <Card key={c.id} className="flex items-center gap-3 p-3">
                <span className="rounded-md bg-primary/10 px-2 py-1 font-mono text-xs font-semibold text-primary">
                  {c.code}
                </span>
                <span className="text-sm">{localize(c.name, lang)}</span>
              </Card>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 font-bold">
            {bn ? "আসন্ন ডেডলাইন" : "Upcoming deadlines"}
          </h2>
          <div className="space-y-2">
            {deadlines.map((d) => {
              const left = daysUntil(d.due);
              return (
                <Card
                  key={d.id}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {localize(d.title, lang)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {courseCode(d.courseId)} · {formatDate(d.due, lang)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      left <= 3
                        ? "destructive"
                        : left <= 7
                          ? "warning"
                          : "muted"
                    }
                  >
                    <CalendarClock className="h-3 w-3" aria-hidden />
                    {left < 0
                      ? bn
                        ? "শেষ"
                        : "past"
                      : `${left} ${bn ? "দিন" : "d"}`}
                  </Badge>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-bold">{bn ? "পড়ার কাজ" : "Study tasks"}</h2>
        <label htmlFor="new-task" className="mb-2 block text-sm font-medium">
          {bn ? "নতুন কাজ" : "New task"}
        </label>
        <Card className="mb-3 flex items-end gap-2 p-3">
          <Input
            id="new-task"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTask();
            }}
            placeholder={bn ? "নতুন কাজ…" : "Add a task…"}
            aria-label={bn ? "নতুন কাজ" : "New task"}
          />
          <Button onClick={addTask}>
            <Plus className="h-4 w-4" aria-hidden />
            {bn ? "যোগ" : "Add"}
          </Button>
        </Card>
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id}>
              <Card className="flex items-center gap-3 p-3">
                <button
                  type="button"
                  onClick={() => toggle(t.id)}
                  role="checkbox"
                  aria-checked={t.done}
                  aria-label={localize(t.title, lang)}
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded border",
                    t.done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border",
                  )}
                >
                  {t.done && <Check className="h-3.5 w-3.5" aria-hidden />}
                </button>
                <span
                  className={cn(
                    "flex-1 text-sm",
                    t.done && "text-muted-foreground line-through",
                  )}
                >
                  {localize(t.title, lang)}
                </span>
                {t.aiSuggested && (
                  <Badge variant="muted">
                    {bn ? "AI পরামর্শ" : "AI suggestion"}
                  </Badge>
                )}
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <Card className="bg-primary/5 p-4">
        <h2 className="font-bold">
          {bn ? "পরামর্শকৃত পরিকল্পনা" : "Suggested plan"}
        </h2>
        <p className="mb-2 text-xs text-muted-foreground">
          {bn
            ? "এটি একটি AI পরামর্শ — শেখার প্রমাণ নয়। নিজের মতো বদলে নিন।"
            : "This is an AI suggestion, not proof of learning. Adjust it freely."}
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm">
          <li>
            {bn
              ? "আজ: BST রিভিশন (Assignment 3-এর জন্য)"
              : "Today: revise BSTs (for Assignment 3)"}
          </li>
          <li>
            {bn
              ? "আগামীকাল: ৫টি SQL JOIN প্র্যাকটিস"
              : "Tomorrow: 5 SQL JOIN practice queries"}
          </li>
          <li>
            {bn
              ? "এই সপ্তাহে: OS scheduling অধ্যায়"
              : "This week: OS scheduling chapter"}
          </li>
        </ul>
      </Card>
    </div>
  );
}
