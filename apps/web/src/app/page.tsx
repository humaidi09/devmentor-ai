"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Languages, ShieldCheck, Users } from "lucide-react";

import { BrandMark } from "@/components/brand";
import { LanguageToggle } from "@/components/language-toggle";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";

export default function LandingPage() {
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

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <BrandMark className="h-8 w-8" />
          <span className="font-bold">{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
            {t("getSupport")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <section className="py-14 text-center sm:py-20">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
            {bn ? "যাচাইকৃত সহায়তা, গোপনীয়তা-প্রথম" : "Verified support, privacy-first"}
          </p>
          <h1 className="mx-auto max-w-3xl text-balance text-3xl font-bold tracking-tight sm:text-5xl">
            {bn ? "বাধা থেকে বাস্তব সহায়তায়।" : "From student barriers to real support."}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {bn
              ? "আপনার সমস্যাটা বলুন। Close AI আপনার ক্যাম্পাসের যাচাইকৃত সহায়তা খুঁজে দেয়, বাস্তব পরবর্তী ধাপ দেখায়, আর দরকার হলে একজন মানুষের কাছে পৌঁছে দেয় — কোনো লেবেল বা নজরদারি ছাড়াই।"
              : "Tell us what's in your way. Close AI helps you find verified campus support, understand realistic next steps, and reach a human when you need one — with no labeling or surveillance."}
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
              {t("getSupport")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/support/human" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              {t("talkToHuman")}
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="p-5">
                <Icon className="mb-2 h-5 w-5 text-primary" aria-hidden />
                <h2 className="font-bold">{f.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            );
          })}
        </section>

        <section className="my-10 rounded-lg border border-border bg-muted/50 p-5 text-center text-sm text-muted-foreground">
          <Users className="mx-auto mb-2 h-5 w-5 text-primary" aria-hidden />
          {bn
            ? "Close AI কোনো মেডিকেল, আইনি বা জরুরি সেবা নয়। জরুরি অবস্থায় স্থানীয় জরুরি সেবা বা ক্যাম্পাস কর্তৃপক্ষের সাথে যোগাযোগ করুন।"
            : "Close AI is not a medical, legal, or emergency service. In an emergency, contact local emergency services or your campus authorities."}
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-xs text-muted-foreground sm:px-6">
        {t("demoNotice")}
      </footer>
    </div>
  );
}
