"use client";

import { Copy, ExternalLink, Mail, MapPin } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { VerificationBadge } from "@/components/verification-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { DEMO_CAMPUS, DEMO_RESOURCES } from "@/lib/demo-data";
import { useLanguage } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";

export default function HumanPage() {
  const { t, lang } = useLanguage();
  const bn = lang === "bn";
  const contacts = DEMO_RESOURCES.filter(
    (r) => r.verification === "verified" && r.officialContact,
  );
  const [draft, setDraft] = useState(
    bn
      ? `প্রিয় সহায়তা দল,\n\nআমি ${DEMO_CAMPUS.name}-এর একজন শিক্ষার্থী। আমি [বিষয়] নিয়ে জানতে চাই। সুবিধামতো পরবর্তী ধাপ জানালে কৃতজ্ঞ থাকব।\n\nধন্যবাদ,\n[আপনার নাম]`
      : `Dear support team,\n\nI'm a student at ${DEMO_CAMPUS.name}. I'd like to ask about [topic]. I'd be grateful if you could let me know the next steps when convenient.\n\nThank you,\n[Your name]`,
  );
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable; user can select manually */
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t("humanSupport")}
        subtitle={
          bn
            ? "যাচাইকৃত অফিস ও যোগাযোগ। Close AI আপনার হয়ে কাউকে বার্তা পাঠায় না।"
            : "Verified offices and contacts. Close AI never contacts anyone for you."
        }
      />

      <div className="space-y-3">
        {contacts.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-bold">{c.name}</h2>
              <VerificationBadge state={c.verification} />
            </div>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {c.location}
            </p>
            {c.officialContact && (
              <p className="mt-1 flex items-center gap-1 text-sm">
                <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                {c.officialContact}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t("lastChecked")}: {formatDate(c.lastCheckedAt)}
              </span>
              <a
                href={c.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" aria-hidden />
                {t("officialSource")}
              </a>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-4">
        <h2 className="font-bold">{bn ? "একটি বার্তা খসড়া করুন" : "Draft a message"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {bn
            ? "Close AI শুধু খসড়া করে দেয়। পাঠানো বা না-পাঠানো সম্পূর্ণ আপনার সিদ্ধান্ত।"
            : "Close AI only drafts. Whether and how to send it is entirely your choice."}
        </p>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="mt-3 min-h-[160px] font-mono text-xs"
          aria-label={bn ? "খসড়া বার্তা" : "Draft message"}
        />
        <div className="mt-3">
          <Button variant="secondary" onClick={copy}>
            <Copy className="h-4 w-4" aria-hidden />
            {copied ? (bn ? "কপি হয়েছে" : "Copied") : bn ? "কপি করুন" : "Copy draft"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
