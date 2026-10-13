"use client";

import { DeveloperRecommendation } from "@/components/developer-recommendation";
import Link from "next/link";
import { Check, Copy, Sparkles } from "lucide-react";
import { useState } from "react";

import { useAccount } from "@/lib/account";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DEMO_PATHWAYS, DEMO_SNIPPETS } from "@/lib/modules-data";
import { localize } from "@/lib/content-bn";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function SnippetCard({
  title,
  language,
  code,
}: {
  title: string;
  language: string;
  code: string;
}) {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          <Badge variant="muted">{language}</Badge>
        </div>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Copy className="h-3 w-3" aria-hidden />
          {copied
            ? lang === "bn"
              ? "কপি হয়েছে"
              : "Copied"
            : lang === "bn"
              ? "কপি করুন"
              : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs">
        <code className="font-mono">{code}</code>
      </pre>
    </Card>
  );
}

export default function LearnPage() {
  const { demo, data, mutate, busy } = useAccount();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [active, setActive] = useState(DEMO_PATHWAYS[0].id);
  const [localDone, setDone] = useState<Record<string, boolean>>({});
  const done = demo ? localDone : (data?.developerDone ?? {});
  const pathway =
    DEMO_PATHWAYS.find((p) => p.id === active) ?? DEMO_PATHWAYS[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={bn ? "ডেভেলপার পাথ" : "Developer Path"}
        subtitle={
          bn
            ? "একটা পথ বেছে নিন, মাইলস্টোন ট্র্যাক করুন। কোনো চাকরি/বেতনের নিশ্চয়তা নেই।"
            : "Pick a path and track milestones. No job or salary guarantees."
        }
      />

      <div className="flex flex-wrap gap-2">
        {DEMO_PATHWAYS.map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p.id)}
            aria-pressed={active === p.id}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              active === p.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted",
            )}
          >
            {bn ? p.nameBn : p.name}
          </button>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="font-bold">{bn ? pathway.nameBn : pathway.name}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {localize(pathway.summary, lang)}
        </p>
        <ol className="space-y-1">
          {pathway.milestones.map((m, idx) => {
            const key = `${pathway.id}:${idx}`;
            const d = !!done[key];
            return (
              <li key={key}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (demo) setDone((s) => ({ ...s, [key]: !d }));
                    else
                      void mutate("developer", {
                        pathway: pathway.id,
                        milestone: String(idx),
                        completed: !d,
                      });
                  }}
                  aria-pressed={d}
                  className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted"
                >
                  <span
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                      d
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {d ? (
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      d && "text-muted-foreground line-through",
                    )}
                  >
                    {localize(m, lang)}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </Card>

      <DeveloperRecommendation path={pathway} done={done} />
      <section>
        <h2 className="mb-3 font-bold">{bn ? "স্নিপেট" : "Snippets"}</h2>
        <div className="space-y-3">
          {DEMO_SNIPPETS.map((s) => (
            <SnippetCard
              key={s.id}
              title={localize(s.title, lang)}
              language={s.language}
              code={s.code}
            />
          ))}
        </div>
      </section>

      <Card className="flex flex-wrap items-center justify-between gap-3 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-primary"
            aria-hidden
          />
          <div>
            <h2 className="font-bold">
              {bn ? "ভিজ্যুয়াল লার্নিং ল্যাব" : "Visual Learning Lab"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {bn
                ? "BFS, সর্টিং, SQL JOIN — ইন্টার্যাক্টিভ ধাপে ধাপে।"
                : "BFS, sorting, SQL JOIN — interactive, step by step."}
            </p>
          </div>
        </div>
        <Link
          href="/learn/visual-lab"
          className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {bn ? "খুলুন" : "Open"}
        </Link>
      </Card>
    </div>
  );
}
