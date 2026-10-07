import {
  Bot,
  Brain,
  Code2,
  Github,
  LineChart,
  Trophy,
  CalendarClock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DEMO_MODE } from "@/lib/config";

const features = [
  {
    icon: Brain,
    title: "CS Study Mentor",
    body: "Clear explanations for DSA, DBMS, OS, networks, and system design — in English or Bangla, at your level.",
  },
  {
    icon: CalendarClock,
    title: "AutoTask AI",
    body: "Turns your schedule, courses, and deadlines into a realistic plan — with breaks, buffers, and gentle recovery.",
  },
  {
    icon: Trophy,
    title: "Codeforces Coach",
    body: "Twice-daily problem recommendations in your rating band, streaks, and post-contest upsolving.",
  },
  {
    icon: Code2,
    title: "DevSnippet AI",
    body: "A searchable, copy-ready snippet library plus your own personal collection. Stop re-Googling syntax.",
  },
  {
    icon: Bot,
    title: "Developer Mentor",
    body: "Structured code review, plain-language error help, and project roadmaps across languages.",
  },
  {
    icon: LineChart,
    title: "Weekly Reflection",
    body: "Honest weekly summaries, weak-topic detection, and plan adjustments — never shaming.",
  },
];

export default function LandingPage() {
  const startHref = DEMO_MODE ? "/dashboard" : "/sign-up";

  return (
    <div className="min-h-screen bg-brand-gradient">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">DevMentor AI</span>
        </div>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href={startHref}>
            <Button size="sm">Get started</Button>
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="py-16 text-center sm:py-24">
          <Badge variant="outline" className="mb-5">
            Agentic • Personalized • Free-tier friendly
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
            Your autonomous CS, competitive programming &{" "}
            <span className="text-primary">developer companion</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            DevMentor AI understands your goals, builds your study plan,
            recommends Codeforces problems, explains hard topics, and keeps you
            on track — like a mentor that never sleeps.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href={startHref}>
              <Button size="lg" className="gap-2">
                Start learning <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="https://codeforces.com" target="_blank">
              <Button size="lg" variant="outline" className="gap-2">
                <Github className="h-4 w-4" /> Connect Codeforces
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card. Runs on free tiers. Demo mode needs zero setup.
          </p>
        </section>

        <section className="grid gap-5 pb-20 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} DevMentor AI — MVP</span>
          <span>
            We never guarantee grades, ratings, or jobs. We help you build the
            habit.
          </span>
        </div>
      </footer>
    </div>
  );
}
