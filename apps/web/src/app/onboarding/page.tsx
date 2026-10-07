"use client";

import { Bot, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const DAYS = [
  ["mon", "Mon"],
  ["tue", "Tue"],
  ["wed", "Wed"],
  ["thu", "Thu"],
  ["fri", "Fri"],
  ["sat", "Sat"],
  ["sun", "Sun"],
] as const;

const INTERESTS = [
  "cp",
  "web",
  "backend",
  "frontend",
  "ai",
  "mobile",
  "devops",
  "systems",
];

const STEPS = ["About you", "Your schedule", "Focus & goals", "Codeforces"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const defaultTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Dhaka";
    } catch {
      return "Asia/Dhaka";
    }
  }, []);

  const [form, setForm] = useState({
    display_name: "",
    preferred_language: "en",
    timezone: defaultTz,
    current_level: "beginner",
    weekly_hours: 10,
    days: {
      mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false,
    } as Record<string, boolean>,
    start: "09:00",
    end: "11:00",
    interests: ["cp", "web"] as string[],
    goals: "",
    career_goal: "",
    cf_handle: "",
    cp_enabled: true,
    morning_time: "10:00",
    evening_time: "20:00",
    min_rating: 800,
    max_rating: 1200,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleInterest(i: string) {
    set(
      "interests",
      form.interests.includes(i)
        ? form.interests.filter((x) => x !== i)
        : [...form.interests, i],
    );
  }

  async function finish() {
    setSaving(true);
    try {
      const available_schedule: Record<string, { start: string; end: string }[]> = {};
      for (const [key] of DAYS) {
        if (form.days[key]) {
          available_schedule[key] = [{ start: form.start, end: form.end }];
        }
      }
      await api.patch("/api/me", {
        display_name: form.display_name || "there",
        preferred_language: form.preferred_language,
        timezone: form.timezone,
        current_level: form.current_level,
        weekly_study_goal_minutes: Math.round(form.weekly_hours * 60),
        available_schedule,
        interests: form.interests,
        goals: [
          ...form.goals.split("\n").map((g) => g.trim()).filter(Boolean),
          ...(form.career_goal ? [form.career_goal] : []),
        ],
        codeforces_handle: form.cf_handle || null,
        onboarding_completed: true,
      });
      await api.post("/api/cp/preferences", {
        morning_time: form.morning_time,
        evening_time: form.evening_time,
        problems_per_session: 2,
        min_rating: Number(form.min_rating),
        max_rating: Number(form.max_rating),
        preferred_tags: [],
        weak_tags: [],
        notifications_enabled: form.cp_enabled,
        contest_reminders_enabled: form.cp_enabled,
      });
      router.push("/dashboard");
    } catch {
      router.push("/dashboard"); // demo-friendly: never trap the user
    } finally {
      setSaving(false);
    }
  }

  const last = step === STEPS.length - 1;

  return (
    <div className="flex min-h-screen flex-col bg-brand-gradient">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <span className="font-bold">DevMentor AI</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-6">
        {/* Stepper */}
        <div className="mb-6 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  i < step && "bg-primary text-primary-foreground",
                  i === step && "bg-primary/15 text-primary ring-2 ring-primary",
                  i > step && "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("h-0.5 flex-1", i < step ? "bg-primary" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="space-y-5 p-6">
            <div>
              <h2 className="text-xl font-bold">{STEPS[step]}</h2>
              <p className="text-sm text-muted-foreground">
                Step {step + 1} of {STEPS.length}
              </p>
            </div>

            {step === 0 && (
              <div className="space-y-4">
                <Field label="Your name">
                  <Input
                    value={form.display_name}
                    onChange={(e) => set("display_name", e.target.value)}
                    placeholder="e.g. Rahim"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Preferred language">
                    <Select
                      value={form.preferred_language}
                      onChange={(e) => set("preferred_language", e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="bn">বাংলা (Bangla)</option>
                      <option value="bilingual">Bilingual</option>
                    </Select>
                  </Field>
                  <Field label="Current level">
                    <Select
                      value={form.current_level}
                      onChange={(e) => set("current_level", e.target.value)}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </Select>
                  </Field>
                </div>
                <Field label="Timezone (IANA)">
                  <Input
                    value={form.timezone}
                    onChange={(e) => set("timezone", e.target.value)}
                    placeholder="Asia/Dhaka"
                  />
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <Field label="Weekly study goal (hours)">
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={form.weekly_hours}
                    onChange={(e) => set("weekly_hours", Number(e.target.value))}
                  />
                </Field>
                <Field label="Which days can you study?">
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => set("days", { ...form.days, [key]: !form.days[key] })}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-sm",
                          form.days[key]
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Typical start">
                    <Input
                      type="time"
                      value={form.start}
                      onChange={(e) => set("start", e.target.value)}
                    />
                  </Field>
                  <Field label="Typical end">
                    <Input
                      type="time"
                      value={form.end}
                      onChange={(e) => set("end", e.target.value)}
                    />
                  </Field>
                </div>
                <p className="text-xs text-muted-foreground">
                  We&apos;ll never pack impossible plans — breaks and buffers are
                  built in.
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Field label="Interests">
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleInterest(i)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-sm capitalize",
                          form.interests.includes(i)
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Your goals (one per line)">
                  <Textarea
                    value={form.goals}
                    onChange={(e) => set("goals", e.target.value)}
                    placeholder={"Master DP\nReach 1400 on Codeforces"}
                  />
                </Field>
                <Field label="Career goal">
                  <Input
                    value={form.career_goal}
                    onChange={(e) => set("career_goal", e.target.value)}
                    placeholder="e.g. Backend internship by next summer"
                  />
                </Field>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <Field label="Codeforces handle (optional)">
                  <Input
                    value={form.cf_handle}
                    onChange={(e) => set("cf_handle", e.target.value)}
                    placeholder="e.g. tourist"
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.cp_enabled}
                    onChange={(e) => set("cp_enabled", e.target.checked)}
                  />
                  Send me two daily Codeforces practice sessions
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Morning session">
                    <Input
                      type="time"
                      value={form.morning_time}
                      onChange={(e) => set("morning_time", e.target.value)}
                    />
                  </Field>
                  <Field label="Evening session">
                    <Input
                      type="time"
                      value={form.evening_time}
                      onChange={(e) => set("evening_time", e.target.value)}
                    />
                  </Field>
                  <Field label="Min rating">
                    <Input
                      type="number"
                      value={form.min_rating}
                      onChange={(e) => set("min_rating", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Max rating">
                    <Input
                      type="number"
                      value={form.max_rating}
                      onChange={(e) => set("max_rating", Number(e.target.value))}
                    />
                  </Field>
                </div>
                <Badge variant="muted">
                  We suggest problems near your level — never guaranteed rating
                  gains.
                </Badge>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              {last ? (
                <Button onClick={finish} disabled={saving}>
                  {saving ? "Saving…" : "Finish & go to dashboard"}
                </Button>
              ) : (
                <Button onClick={() => setStep((s) => s + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
