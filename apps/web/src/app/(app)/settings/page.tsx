"use client";

import { Globe, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";

import { LanguageToggle } from "@/components/language-toggle";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-card shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function SettingRow({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { t, lang } = useLanguage();
  const bn = lang === "bn";
  const [modules, setModules] = useState({ academic: false, developer: false, cp: false });
  const [consent, setConsent] = useState({ optionalData: false, reminders: false });

  function clearLocal() {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      bn
        ? "এই ব্রাউজারে রাখা ডেমো ডেটা মুছে ফেলা হবে। চালিয়ে যাবেন?"
        : "This clears the demo data stored in this browser. Continue?",
    );
    if (!ok) return;
    window.localStorage.clear();
    window.location.reload();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("settings")} />

      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Globe className="h-4 w-4" aria-hidden />
          {t("language")}
        </h2>
        <Card className="flex items-center justify-between p-4">
          <p className="text-sm">{bn ? "ইন্টারফেস ভাষা" : "Interface language"}</p>
          <LanguageToggle />
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          {bn ? "মডিউল" : "Modules"}
        </h2>
        <Card className="divide-y divide-border">
          <SettingRow
            title={bn ? "একাডেমিক স্টাডি" : "Academic Study"}
            desc={bn ? "কোর্স ও ডেডলাইন (শীঘ্রই)" : "Courses & deadlines (coming soon)"}
          >
            <Toggle
              checked={modules.academic}
              onChange={(v) => setModules((m) => ({ ...m, academic: v }))}
              label="Academic Study"
            />
          </SettingRow>
          <SettingRow
            title={bn ? "ডেভেলপার পাথ" : "Developer Path"}
            desc={bn ? "স্কিল ও ভিজ্যুয়াল ল্যাব (শীঘ্রই)" : "Skills & Visual Lab (coming soon)"}
          >
            <Toggle
              checked={modules.developer}
              onChange={(v) => setModules((m) => ({ ...m, developer: v }))}
              label="Developer Path"
            />
          </SettingRow>
          <SettingRow
            title={bn ? "CP কোচ" : "CP Coach"}
            desc={bn ? "প্র্যাকটিস ট্র্যাকিং (শীঘ্রই)" : "Practice tracking (coming soon)"}
          >
            <Toggle
              checked={modules.cp}
              onChange={(v) => setModules((m) => ({ ...m, cp: v }))}
              label="CP Coach"
            />
          </SettingRow>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          {bn ? "গোপনীয়তা ও সম্মতি" : "Privacy & consent"}
        </h2>
        <Card className="divide-y divide-border">
          <SettingRow
            title={bn ? "ঐচ্ছিক ব্যক্তিগত তথ্য সংরক্ষণ" : "Store optional personal data"}
            desc={bn ? "বন্ধ থাকলে শুধু অপরিহার্য তথ্য রাখা হয়।" : "When off, only essential data is kept."}
          >
            <Toggle
              checked={consent.optionalData}
              onChange={(v) => setConsent((c) => ({ ...c, optionalData: v }))}
              label="Optional data"
            />
          </SettingRow>
          <SettingRow
            title={bn ? "রিমাইন্ডার" : "Reminders"}
            desc={
              bn
                ? "ইন-অ্যাপ রিমাইন্ডার; লক-স্ক্রিনে সংবেদনশীল তথ্য দেখানো হয় না।"
                : "In-app reminders; no sensitive text on your lock screen."
            }
          >
            <Toggle
              checked={consent.reminders}
              onChange={(v) => setConsent((c) => ({ ...c, reminders: v }))}
              label="Reminders"
            />
          </SettingRow>
        </Card>
        <p className="mt-2 text-xs text-muted-foreground">
          {bn
            ? "Close AI ন্যূনতম তথ্য সংগ্রহ করে, কখনো আপনার হয়ে তৃতীয় পক্ষের সাথে যোগাযোগ করে না, এবং আপনাকে নির্ণয় বা মূল্যায়ন করে না।"
            : "Close AI collects minimal data, never contacts third parties for you, and does not diagnose or score you."}
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-destructive">
          {bn ? "ডেটা নিয়ন্ত্রণ" : "Data controls"}
        </h2>
        <Card className="space-y-3 p-4">
          <p className="text-sm text-muted-foreground">
            {bn
              ? "ডেমো মোডে ডেটা শুধু এই ব্রাউজারে থাকে।"
              : "In demo mode, data stays only in this browser."}
          </p>
          <Button variant="destructive" onClick={clearLocal}>
            <Trash2 className="h-4 w-4" aria-hidden />
            {bn ? "ডেমো ডেটা মুছুন" : "Clear demo data"}
          </Button>
        </Card>
      </section>
    </div>
  );
}
