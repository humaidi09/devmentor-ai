"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Code2,
  Compass,
  GraduationCap,
  Languages,
  MessageCircle,
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
      title: bn ? "যাচাইকৃত রিসোর্স" : "Verified resources",
      desc: bn
        ? "প্রতিটি রিসোর্সে অফিসিয়াল উৎস ও সর্বশেষ যাচাইয়ের তারিখ থাকে।"
        : "Every resource shows its official source and last-checked date.",
    },
    {
      icon: ShieldCheck,
      title: bn ? "গোপনীয়তা-প্রথম" : "Privacy-first",
      desc: bn
        ? "ন্যূনতম তথ্য, কোনো নজরদারি নয়, নিয়ন্ত্রণ আপনার হাতে।"
        : "Minimal data, no surveillance — you stay in control.",
    },
    {
      icon: Languages,
      title: bn ? "বাংলা ও English" : "Bangla & English",
      desc: bn ? "দুই ভাষাতেই সহায়তা পান।" : "Get support in both languages.",
    },
  ];

  const paths = [
    {
      href: "/support",
      icon: Users,
      tone: "teal",
      title: bn ? "শিক্ষার্থী সহায়তা" : "Student support",
      desc: bn
        ? "সহায়তা খুঁজুন, পরবর্তী ধাপ ঠিক করুন এবং মানুষের সঙ্গে যোগাযোগের পথ দেখুন।"
        : "Find support, plan your next step, and see how to reach a person.",
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

  const journey = [
    {
      icon: MessageCircle,
      title: bn ? "আপনার কথা বলুন" : "Tell us what’s happening",
      detail: bn ? "নিজের ভাষায় শুরু করুন" : "Start in your own words",
    },
    {
      icon: Compass,
      title: bn ? "সহায়তার পথ দেখুন" : "Explore support options",
      detail: bn ? "উৎস ও ধাপ যাচাই করুন" : "Check sources and next steps",
    },
    {
      icon: CheckCircle2,
      title: bn ? "নিজের মতো এগোন" : "Move forward your way",
      detail: bn ? "সিদ্ধান্ত আপনার হাতে" : "You choose what comes next",
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
          <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle />
          <Link href="/onboarding" className={buttonVariants({ size: "sm" })}>
            {t("getSupport")}
            <ArrowRight className="hidden h-3.5 w-3.5 sm:block" aria-hidden />
          </Link>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="hero-grid relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.04fr_0.96fr] lg:gap-12 lg:py-24">
          <div className="hero-copy relative z-10">
            <p className="hero-eyebrow mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold sm:text-sm">
              <span className="hero-status-dot" aria-hidden />
              {bn ? "আপনার পথ, আপনার গতিতে" : "Support that moves with you"}
            </p>
            <h1 className="max-w-2xl text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.55rem]">
              {bn ? (
                <>বাধা পেরিয়ে <span className="hero-highlight">এগিয়ে যান।</span></>
              ) : (
                <>From student barriers to <span className="hero-highlight">real support.</span></>
              )}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {bn
                ? "আপনার সমস্যাটা বলুন। Close AI আপনার ক্যাম্পাসের যাচাইকৃত সহায়তা খুঁজে দেয়, বাস্তব পরবর্তী ধাপ দেখায়, আর দরকার হলে একজন মানুষের কাছে পৌঁছানোর পথ দেখায়।"
                : "Tell us what's in your way. Close AI helps you find verified campus support, understand realistic next steps, and find a way to reach a person when you need one."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/onboarding" className={buttonVariants({ size: "lg" })}>
                {t("getSupport")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/support/human" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                {t("talkToHuman")}
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground sm:text-sm">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" aria-hidden />{bn ? "গোপনীয়তা আপনার হাতে" : "Privacy stays in your hands"}</span>
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-primary" aria-hidden />{bn ? "উৎস দেখে সিদ্ধান্ত" : "Sources you can check"}</span>
            </div>
          </div>

          <div className="hero-visual relative" role="group" aria-label={bn ? "সহায়তা পাওয়ার তিনটি ধাপ" : "Three steps to finding support"}>
            <div className="hero-orb hero-orb-one" aria-hidden />
            <div className="hero-orb hero-orb-two" aria-hidden />
            <div className="hero-visual-card relative rounded-[2rem] border border-white/70 p-5 shadow-xl sm:p-7">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground"><Sparkles className="h-5 w-5" aria-hidden /></span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{bn ? "ক্লোজ এআই" : "CLOSE AI"}</p>
                    <h2 className="text-base font-bold">{bn ? "সহায়তার পথ" : "Your support journey"}</h2>
                  </div>
                </div>
                <span className="hero-visual-spark" aria-hidden><Sparkles className="h-5 w-5" /></span>
              </div>
              <div className="journey-list relative space-y-3">
                {journey.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div className="journey-step relative flex items-center gap-3 rounded-2xl border border-border/70 bg-white/90 p-3.5 shadow-soft sm:gap-4 sm:p-4" key={step.title}>
                      <span className="journey-icon grid h-11 w-11 shrink-0 place-items-center rounded-xl"><Icon className="h-5 w-5" aria-hidden /></span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-snug">{step.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{step.detail}</p>
                      </div>
                      <span className="font-mono text-xs font-semibold text-muted-foreground/70" aria-hidden>{String(index + 1).padStart(2, "0")}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                {bn ? "আপনার সম্মতি ছাড়া কোনো ধাপ নয়" : "No step without your choice"}
              </p>
            </div>
            <span className="hero-float-label absolute -bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground shadow-lift sm:-right-3">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
              {bn ? "বাংলা + English" : "Bangla + English"}
            </span>
          </div>
        </section>

        <section aria-labelledby="explore-heading" className="py-14 sm:py-20">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="section-kicker">
                {bn ? "আপনার পথ বেছে নিন" : "Explore Close AI"}
              </p>
              <h2
                id="explore-heading"
                className="mt-2 max-w-xl text-2xl font-bold sm:text-3xl"
              >
                {bn ? "যেখান থেকে শুরু করতে চান" : "Start where you need help"}
              </h2>
            </div>
            {demo && (
              <span className="rounded-full border border-border bg-white/70 px-3 py-1 text-xs font-medium text-muted-foreground">
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
                  className={`path-card path-card-${path.tone} group relative flex min-h-[205px] flex-col rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6`}
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
              <Card key={f.title} className="feature-card border-0 bg-white/70 p-5 shadow-none">
                <span className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden /></span>
                <h2 className="font-bold">{f.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            );
          })}
        </section>

        <section className="mb-10 rounded-2xl border border-border bg-card/80 p-5 text-center text-sm text-muted-foreground sm:p-6">
          <Users className="mx-auto mb-2 h-5 w-5 text-primary" aria-hidden />
          {bn
            ? "Close AI কোনো মেডিকেল, আইনি বা জরুরি সেবা নয়। জরুরি অবস্থায় স্থানীয় জরুরি সেবা বা ক্যাম্পাস কর্তৃপক্ষের সাথে যোগাযোগ করুন।"
            : "Close AI is not a medical, legal, or emergency service. In an emergency, contact local emergency services or your campus authorities."}
        </section>
      </main>

      <footer className="mx-auto max-w-6xl border-t border-border/70 px-4 py-8 text-center text-xs text-muted-foreground sm:px-6">
        {demo
          ? t("demoNotice")
          : bn
            ? "আপনার পছন্দ ও অনুমোদিত ধাপ নিজের অ্যাকাউন্টে সংরক্ষণ করুন।"
            : "Save preferences and approved steps in your own account."}
      </footer>
    </div>
  );
}
