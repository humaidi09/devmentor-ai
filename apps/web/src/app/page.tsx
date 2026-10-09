import {
  ArrowRight,
  Bot,
  Brain,
  CalendarClock,
  Check,
  Code2,
  Github,
  LineChart,
  Sparkles,
  Trophy,
} from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/app-shell/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEMO_MODE } from "@/lib/config";

const features = [
  { icon: Brain, title: "CS Study Mentor", body: "Clear explanations for DSA, DBMS, OS, networks & system design — English or Bangla, at your level." },
  { icon: CalendarClock, title: "AutoTask AI", body: "Turns your schedule, courses & deadlines into a realistic plan — with breaks, buffers & gentle recovery." },
  { icon: Trophy, title: "Codeforces Coach", body: "Twice-daily problems in your rating band, streaks, contest reminders & post-contest upsolving." },
  { icon: Code2, title: "DevSnippet AI", body: "A searchable, copy-ready snippet library plus your own collection. Stop re-Googling syntax." },
  { icon: Bot, title: "Developer Tools", body: "Structured code review and project-roadmap generation across languages." },
  { icon: LineChart, title: "Weekly Reflection", body: "Honest summaries, weak-topic detection & plan adjustments — never shaming." },
];

const stats = [
  { value: "60+", label: "Starter snippets" },
  { value: "2×", label: "Daily CP sessions" },
  { value: "EN · BN", label: "Bilingual" },
  { value: "$0", label: "Free-tier stack" },
];

export default function LandingPage() {
  const startHref = DEMO_MODE ? "/dashboard" : "/sign-up";

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-9 w-9" />
            <span className="font-display text-lg font-bold">DevMentor AI</span>
          </div>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href={startHref}>
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-gradient">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div className="animate-in">
            <Badge variant="outline" className="mb-5 bg-card/60">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Agentic · Personalized · Free-tier
            </Badge>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Your autonomous CS &{" "}
              <span className="text-gradient">competitive programming</span> companion
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              DevMentor understands your goals, builds your study plan, recommends
              Codeforces problems, explains hard topics, and keeps you on track —
              like a mentor that never sleeps.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={startHref}>
                <Button size="xl" variant="gradient" className="gap-2">
                  Start learning <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="https://codeforces.com" target="_blank">
                <Button size="xl" variant="outline" className="gap-2">
                  <Github className="h-4 w-4" /> Connect Codeforces
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card. Runs on free tiers. Demo mode needs zero setup.
            </p>
          </div>

          {/* Floating preview */}
          <div className="relative hidden lg:block">
            <PreviewCard />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-8 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-bold text-gradient">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Six specialists, one companion
          </h2>
          <p className="mt-4 text-muted-foreground">
            Each module does one job well — and they share your context so advice
            stays personal.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-lg border border-border bg-card p-6 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 font-display font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="relative overflow-hidden rounded-xl bg-gradient-brand px-8 py-14 text-center text-white shadow-lift">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Build the habit. Level up.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">
              Start free in demo mode, or connect Supabase &amp; Gemini for the full
              experience.
            </p>
            <Link href={startHref} className="mt-7 inline-block">
              <Button size="xl" className="gap-2 bg-white text-primary hover:bg-white/90">
                Start learning <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} DevMentor AI — MVP</span>
          <span>We help you build the habit — not guarantee grades or jobs.</span>
        </div>
      </footer>
    </div>
  );
}

function PreviewCard() {
  const tasks = [
    { c: "bg-primary", t: "DBMS: Normalization", m: "9:00 – 11:00" },
    { c: "bg-accent", t: "Codeforces: 2 problems", m: "4:00 – 5:00" },
    { c: "bg-success", t: "Review SQL JOINs", m: "done", done: true },
  ];
  return (
    <div className="animate-float rounded-xl border border-border bg-card p-5 shadow-lift">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-display text-sm font-bold">Today&apos;s plan</p>
          <p className="text-xs text-muted-foreground">Sunday · 3 tasks</p>
        </div>
        <Badge variant="success">
          <Check className="h-3 w-3" /> 1/3
        </Badge>
      </div>
      <div className="space-y-2">
        {tasks.map((t) => (
          <div key={t.t} className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
            <span className={`h-2.5 w-2.5 rounded-full ${t.c}`} />
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-medium ${t.done ? "line-through opacity-60" : ""}`}>
                {t.t}
              </p>
              <p className="text-[11px] text-muted-foreground">{t.m}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { v: "7", l: "streak" },
          { v: "82%", l: "goal" },
          { v: "1340", l: "rating" },
        ].map((s) => (
          <div key={s.l} className="rounded-md bg-muted/60 px-2 py-2 text-center">
            <p className="font-display text-base font-bold">{s.v}</p>
            <p className="text-[10px] text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
