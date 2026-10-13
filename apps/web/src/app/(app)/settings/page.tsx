"use client";

import { Globe, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePreferences } from "@/lib/preferences";

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
  const { preferences, save, storageUnavailable } = usePreferences();
  const modules = preferences.modules;
  const setModules = (update: (m: typeof modules) => typeof modules) => save({ ...preferences, modules: update(modules) });

  function clearLocal() {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      bn
        ? "এই ব্রাউজারে রাখা ডেমো ডেটা মুছে ফেলা হবে। চালিয়ে যাবেন?"
        : "This clears the demo data stored in this browser. Continue?",
    );
    if (!ok) return;
    for (const key of Object.keys(window.localStorage)) if (key.startsWith("close-ai-")) window.localStorage.removeItem(key);
    window.location.reload();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("settings")} />
      <Link href="/onboarding" className="block text-primary underline">{bn ? "ক্যাম্পাস ও নীরব সময়ের পছন্দ" : "Campus and quiet-hour preferences"}</Link>
      {storageUnavailable && <p role="status">{bn ? "সংরক্ষণ বন্ধ। পছন্দ শুধু এই সেশনে থাকবে।" : "Storage unavailable. Preferences last only for this session."}</p>}

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
            desc={bn ? "কোর্স ও ডেডলাইন" : "Courses & deadlines"}
          >
            <Toggle
              checked={modules.academic}
              onChange={(v) => setModules((m) => ({ ...m, academic: v }))}
              label={bn ? "একাডেমিক স্টাডি" : "Academic Study"}
            />
          </SettingRow>
          <SettingRow
            title={bn ? "ডেভেলপার পাথ" : "Developer Path"}
            desc={bn ? "স্কিল ও ভিজ্যুয়াল ল্যাব" : "Skills & Visual Lab"}
          >
            <Toggle
              checked={modules.developer}
              onChange={(v) => setModules((m) => ({ ...m, developer: v }))}
              label={bn ? "ডেভেলপার পাথ" : "Developer Path"}
            />
          </SettingRow>
          <SettingRow
            title={bn ? "CP কোচ" : "CP Coach"}
            desc={bn ? "প্র্যাকটিস ট্র্যাকিং" : "Practice tracking"}
          >
            <Toggle
              checked={modules.cp}
              onChange={(v) => setModules((m) => ({ ...m, cp: v }))}
              label={bn ? "CP কোচ" : "CP Coach"}
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
            title={bn ? "রিমাইন্ডার" : "Reminders"}
            desc={
              bn
                ? "ইন-অ্যাপ রিমাইন্ডার; লক-স্ক্রিনে সংবেদনশীল তথ্য দেখানো হয় না।"
                : "In-app reminders; no sensitive text on your lock screen."
            }
          >
            <Toggle
              checked={preferences.reminders}
              onChange={(v) => save({ ...preferences, reminders: v })}
              label={bn ? "রিমাইন্ডার" : "Reminders"}
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
              ? "পছন্দ ও সংরক্ষিত রিসোর্স এই ব্রাউজারে থাকে। অনলাইন চ্যাট উত্তর তৈরির জন্য প্রক্রিয়া করা হয়, সংরক্ষণ করা হয় না।"
              : "Preferences and saved resources stay in this browser. Online chat is processed for a reply, not saved."}
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
