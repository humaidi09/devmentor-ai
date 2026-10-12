"use client";

import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { localize } from "@/lib/content-bn";
import { useLanguage } from "@/lib/i18n";
import { TOPICS } from "@/lib/visual/topics";

const CATEGORIES = ["DSA", "Algorithms", "DBMS"] as const;

export default function VisualLabPage() {
  const { lang } = useLanguage();
  const bn = lang === "bn";

  return (
    <div className="space-y-6">
      <PageHeader
        title={bn ? "ভিজ্যুয়াল লার্নিং ল্যাব" : "Visual Learning Lab"}
        subtitle={bn ? "ইন্টার্যাক্টিভ, ধাপে ধাপে — প্রতিটিতে টেক্সট ধাপও আছে।" : "Interactive, step by step — every topic also has a text-steps mode."}
      />
      {CATEGORIES.map((cat) => {
        const items = TOPICS.filter((t) => t.category === cat);
        if (!items.length) return null;
        return (
          <section key={localize(cat, lang)}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{localize(cat, lang)}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((t) => (
                <Link
                  key={t.id}
                  href={`/learn/visual-lab/${t.id}`}
                  className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="h-full p-4 transition-shadow hover:shadow-lift">
                    <h3 className="font-bold">{localize(t.title, lang)}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{localize(t.summary, lang)}</p>
                    <Badge variant="muted" className="mt-3">
                      {t.steps.length} {bn ? "ধাপ" : "steps"}
                    </Badge>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
