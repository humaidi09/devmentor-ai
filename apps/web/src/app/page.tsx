"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Code2,
  GraduationCap,
  Languages,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import { BrandMark } from "@/components/brand";
import { LanguageToggle } from "@/components/language-toggle";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { useAccount } from "@/lib/account";
import { APP_NAME } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";

export default function LandingPage() {
  const { demo } = useAccount();
  const { t, lang } = useLanguage();
  const bn = lang === "bn";

  const features = [
    {
      icon: BadgeCheck,
      title: bn ? "উৎস পরিষ্কারভাবে দেখুন" : "Sources in plain sight",
      desc: bn
        ? "গবেষণা ও পাবলিক ডেটার মূল লিংক এবং প্রাসঙ্গিক তারিখ দেখুন।"
        : "Research and public data show original links and relevant dates.",
    },
    {
      icon: ShieldCheck,
      title: bn ? "আপনার পছন্দে এগোন" : "Progress on your terms",
      desc: bn
        ? "কী সংরক্ষণ করবেন এবং কোন পথে শিখবেন, তা আপনি ঠিক করুন।"
        : "Choose what to save and which learning path to follow.",
    },
    {
      icon: Languages,
      title: bn ? "বাংলা ও English" : "Bangla & English",
      desc: bn ? "মূল টুলগুলো নিজের পছন্দের ভাষায় ব্যবহার করুন।" : "Use the core tools in the language you prefer.",
    },
  ];

  const paths = [
    {
      href: "/knowledge",
      icon: Search,
      tone: "blue",
      title: bn ? "লাইভ নলেজ" : "Live knowledge",
      desc: bn ? "গবেষণা, পাবলিক ডেটা ও কোডের মূল উৎস খুঁজুন।" : "Find research, public data and code with original links.",
    },
    {
      href: "/support",
      icon: Users,
      tone: "teal",
      title: bn ? "শিক্ষার্থী এআই সহকারী" : "Student AI assistant",
      desc: bn
        ? "প্রশ্ন করুন, তথ্য যাচাই করুন এবং পরবর্তী ধাপ নিজে বেছে নিন।"
        : "Ask questions, review evidence and choose the next step.",
    },
    {
      href: "/study",
      icon: GraduationCap,
      tone: "blue",
      title: bn ? "একাডেমিক স্টাডি" : "Academic study",
      desc: bn
        ? "পড়াশোনা ও সময়সীমার কাজ নিজের মতো সাজান।"
        : "Organize coursework and deadlines around your own priorities.",
    },
    {
      href: "/learn",
      icon: Code2,
      tone: "violet",
      title: bn ? "ডেভেলপার পাথ" : "Developer path",
      desc: bn
        ? "দক্ষতা শেখার ধাপ ও ছোট প্রজেক্ট দিয়ে এগোন।"
        : "Follow clear milestones and practice with small projects.",
    },
    {
      href: "/cp",
      icon: Trophy,
      tone: "amber",
      title: bn ? "সিপি কোচ" : "CP coach",
      desc: bn
        ? "সমস্যা সমাধানের অনুশীলন ও নিজের অগ্রগতি দেখুন।"
        : "Practice problem solving and track your progress.",
    },
    {
      href: "/learn/visual-lab",
      icon: BookOpen,
      tone: "rose",
      title: bn ? "ভিজ্যুয়াল ল্যাব" : "Visual lab",
      desc: bn
        ? "অ্যালগরিদম ও ডেটাবেসের ধারণা ধাপে ধাপে দেখুন।"
        : "Explore algorithms and database concepts step by step.",
    },
  ];

  return (
    <div className="landing-shell min-h-screen overflow-hidden">
      <header className="landing-header relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 rounded-md font-bold tracking-tight">
            <BrandMark className="h-9 w-9 text-lg shadow-soft" />
            <span>{APP_NAME}</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex" aria-label={bn ? "সাইট নেভিগেশন" : "Site navigation"}>
            <a href="#workflow" className="hover:text-primary">{bn ? "যেভাবে কাজ করে" : "How it works"}</a>
            <a href="#tools" className="hover:text-primary">{bn ? "টুলগুলো" : "Explore tools"}</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <Link href="/onboarding" className={buttonVariants({ size: "sm" })}>
              {bn ? "শুরু করুন" : "Get started"}
              <ArrowRight className="hidden h-3.5 w-3.5 sm:block" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 sm:px-6">
        <section id="workflow" className="hero-grid relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.04fr_0.96fr] lg:gap-12 lg:py-20">
          <div className="hero-copy relative z-10">
            <p className="hero-eyebrow mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold sm:text-sm">
              <span className="hero-status-dot" aria-hidden />
              {bn ? "খুঁজুন · বুঝুন · অনুশীলন করুন" : "Research · understand · practice"}
            </p>
            <h1 className="max-w-2xl text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.55rem]">
              {bn ? (
                <>উৎস থেকে শিখুন। <span className="hero-highlight">অনুশীলনে এগোন।</span></>
              ) : (
                <>From a question to <span className="hero-highlight">real progress.</span></>
              )}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {bn
                ? "একটি প্রশ্ন থেকে মূল উৎস, ভিজ্যুয়াল ব্যাখ্যা ও লক্ষ্যভিত্তিক অনুশীলনে যান। শেখার প্রতিটি ধাপে সিদ্ধান্ত আপনার।"
                : "Move from a question to original sources, visual explanations and focused practice. You choose every step."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/onboarding" className={buttonVariants({ size: "lg" })}>
                {bn ? "ওয়ার্কস্পেস খুলুন" : "Open the workspace"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/knowledge" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                {bn ? "লাইভ নলেজ দেখুন" : "Try live knowledge"}
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground sm:text-sm">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" aria-hidden />{bn ? "সংরক্ষণ আপনার পছন্দে" : "Save only what you choose"}</span>
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-primary" aria-hidden />{bn ? "মূল উৎসের লিংকসহ" : "Original source links"}</span>
            </div>
          </div>

          <div className="hero-visual relative" role="group" aria-label={bn ? "শেখার একটি উদাহরণ" : "Example learning workflow"}>
            <div className="hero-orb hero-orb-one" aria-hidden />
            <div className="hero-orb hero-orb-two" aria-hidden />
            <div className="hero-visual-card relative rounded-[2rem] border border-border p-5 shadow-xl sm:p-7">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground"><Sparkles className="h-5 w-5" aria-hidden /></span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{bn ? "ক্লোজ এআই" : "CLOSE AI"}</p>
                    <h2 className="text-base font-bold">{bn ? "একসঙ্গে শেখার পথ" : "A connected learning flow"}</h2>
                  </div>
                </div>
                <span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                  {bn ? "উদাহরণ" : "Example"}
                </span>
              </div>
              <Link href="/knowledge?topic=BFS" className="preview-search group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
                <Search className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1 text-sm font-semibold sm:text-base">
                  {bn ? "ব্রেডথ-ফার্স্ট সার্চ কীভাবে কাজ করে?" : "How does breadth-first search work?"}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
              <div className="preview-stage mt-4 rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  01 / {bn ? "উৎস খুঁজুন" : "Find context"}
                </span>
                <p className="mt-2 text-sm font-semibold leading-snug sm:text-base">
                  {bn ? "গবেষণা ও কোডের মূল রেফারেন্স দেখুন" : "Explore original research and code references"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-border bg-card px-2.5 py-1">{bn ? "গবেষণার তথ্য" : "Research metadata"}</span>
                  <span className="rounded-full border border-border bg-card px-2.5 py-1">{bn ? "ওপেন-সোর্স উদাহরণ" : "Open-source examples"}</span>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link href="/learn/visual-lab/bfs" className="preview-action group rounded-2xl border border-border bg-card/90 p-4">
                  <Play className="mb-3 h-5 w-5 text-primary" aria-hidden />
                  <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">02 / {bn ? "বুঝুন" : "Understand"}</span>
                  <span className="mt-1 flex items-center justify-between gap-2 text-sm font-bold">
                    {bn ? "BFS দেখুন" : "See BFS in action"}
                    <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
                <Link href="/cp/topics/bfs" className="preview-action group rounded-2xl border border-border bg-card/90 p-4">
                  <Trophy className="mb-3 h-5 w-5 text-primary" aria-hidden />
                  <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">03 / {bn ? "অনুশীলন" : "Practice"}</span>
                  <span className="mt-1 flex items-center justify-between gap-2 text-sm font-bold">
                    {bn ? "সমস্যা সমাধান করুন" : "Solve a problem"}
                    <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              </div>
              <p className="mt-5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                {bn ? "মূল উৎস খুলুন। কাজে লাগে এমনটাই সংরক্ষণ করুন।" : "Open the original source. Save only what helps."}
              </p>
            </div>
          </div>
        </section>

        <section id="tools" aria-labelledby="explore-heading" className="py-12 sm:py-16">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="section-kicker">
                {bn ? "টুলগুলো একসঙ্গে কাজ করে" : "Tools that work together"}
              </p>
              <h2
                id="explore-heading"
                className="mt-2 max-w-xl text-2xl font-bold sm:text-3xl"
              >
                {bn ? "পরের ধাপ বেছে নিন" : "Choose your next move"}
              </h2>
            </div>
            {demo && (
              <span className="rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                {bn ? "কাল্পনিক ডেমো তথ্য" : "Fictional demo content"}
              </span>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paths.map((path) => {
              const Icon = path.icon;
              return (
                <Link
                  key={path.href}
                  href={path.href}
                  className={`path-card path-card-${path.tone} group relative flex min-h-[195px] flex-col rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6`}
                >
                  <span className="path-icon mb-6 grid h-12 w-12 place-items-center rounded-2xl"><Icon className="h-6 w-6" aria-hidden /></span>
                  <span className="mt-auto flex items-center justify-between gap-3 text-lg font-bold">
                    {path.title}
                    <ArrowRight
                      className="path-arrow h-5 w-5 shrink-0"
                      aria-hidden
                    />
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
                    {path.desc}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="feature-band mb-14 grid gap-4 rounded-3xl border border-border p-5 sm:grid-cols-3 sm:p-7" aria-label={bn ? "ক্লোজ এআই-এর বৈশিষ্ট্য" : "Close AI features"}>
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="feature-card border-0 bg-card/70 p-5 shadow-none">
                <span className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden /></span>
                <h2 className="font-bold">{f.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            );
          })}
        </section>

      </main>

      <footer className="mx-auto max-w-6xl border-t border-border/70 px-4 pb-8 pt-9 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-[1fr_auto]">
          <div>
            <div className="flex items-center gap-2.5 font-bold"><BrandMark className="h-8 w-8" />{APP_NAME}</div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {bn ? "উৎস থেকে বোঝা, বোঝা থেকে অনুশীলন। শেখার পথ আপনার হাতে।" : "From sources to understanding, and understanding to practice. Your path stays yours."}
            </p>
          </div>
          <nav aria-label={bn ? "ফুটার লিংক" : "Footer links"} className="flex flex-wrap items-start gap-x-6 gap-y-3 text-sm font-medium">
            <Link href="/knowledge" className="hover:text-primary">{bn ? "লাইভ নলেজ" : "Live knowledge"}</Link>
            <Link href="/learn/visual-lab" className="hover:text-primary">{bn ? "ভিজ্যুয়াল ল্যাব" : "Visual lab"}</Link>
            <Link href="/cp/library" className="hover:text-primary">{bn ? "সিপি লাইব্রেরি" : "CP library"}</Link>
          </nav>
        </div>
        <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-border/70 pt-5 text-xs leading-relaxed text-muted-foreground">
          <span>{demo ? t("demoNotice") : bn ? "পছন্দের তথ্য আপনার অ্যাকাউন্টে সংরক্ষিত থাকে।" : "Your chosen information is saved to your account."}</span>
          <span>{bn ? "জরুরি, চিকিৎসা বা আইনি সহায়তার বিকল্প নয়।" : "Not for emergency, medical or legal advice."}</span>
        </div>
      </footer>
    </div>
  );
}
