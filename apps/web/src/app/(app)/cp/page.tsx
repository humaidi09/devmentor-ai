"use client";

import { ExternalLink, Lightbulb } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEMO_CP_PROBLEMS, type CPStatus } from "@/lib/modules-data";
import { localize } from "@/lib/content-bn";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { key: CPStatus; en: string; bn: string }[] = [
  { key: "solved", en: "Solved", bn: "সমাধান" },
  { key: "attempted", en: "Attempted", bn: "চেষ্টা" },
  { key: "skipped", en: "Skipped", bn: "বাদ" },
];

export default function CPPage() {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [handle, setHandle] = useState("");
  const [status, setStatus] = useState<Record<string, CPStatus>>({});
  const [hint, setHint] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-6">
      <PageHeader
        title={bn ? "CP কোচ" : "CP Coach"}
        subtitle={bn ? "প্র্যাকটিস ট্র্যাক করুন। হিন্ট আগে, উত্তর নয়। এখন লোকাল/ডেমো ট্র্যাকিং।" : "Track practice. Hints first, not answers. Local/demo tracking for now."}
      />

      <Card className="p-4">
        <label htmlFor="cf" className="mb-1.5 block text-sm font-medium">
          {bn ? "Codeforces হ্যান্ডেল (ঐচ্ছিক)" : "Codeforces handle (optional)"}
        </label>
        <Input id="cf" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="tourist" className="max-w-xs" />
        <p className="mt-2 text-xs text-muted-foreground">
          {bn ? "ডেমোতে হ্যান্ডেল শুধু লোকালি রাখা হয়। আসল Codeforces সংযোগ পরে আসবে।" : "In demo, the handle is kept locally only. Real Codeforces sync comes later."}
        </p>
      </Card>

      <div className="space-y-3">
        {DEMO_CP_PROBLEMS.map((p) => {
          const st = status[p.id] ?? "none";
          return (
            <Card key={p.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
                    {p.name}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant="info">{p.rating}</Badge>
                    {p.tags.map((t) => (
                      <Badge key={localize(t, lang)} variant="muted">
                        {localize(t, lang)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setStatus((x) => ({ ...x, [p.id]: x[p.id] === s.key ? "none" : s.key }))}
                    aria-pressed={st === s.key}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      st === s.key ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
                    )}
                  >
                    {bn ? s.bn : s.en}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setHint((h) => ({ ...h, [p.id]: !h[p.id] }))}
                  className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Lightbulb className="h-3.5 w-3.5" aria-hidden />
                  {hint[p.id] ? (bn ? "হিন্ট লুকান" : "Hide hint") : bn ? "হিন্ট দরকার" : "Need a hint"}
                </button>
              </div>
              {hint[p.id] && <p className="mt-2 rounded-md bg-warning/10 p-2 text-xs text-warning">{localize(p.hint, lang)}</p>}
              {st === "attempted" && (
                <p className="mt-2 text-xs text-muted-foreground">{bn ? "পরে upsolve করার জন্য চিহ্নিত।" : "Marked to upsolve later."}</p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
