"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  ListChecks,
  Users,
} from "lucide-react";

import { VerificationBadge } from "@/components/verification-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useResources } from "@/lib/resources";
import { useAccount } from "@/lib/account";
import { localize } from "@/lib/content-bn";
import { useLanguage } from "@/lib/i18n";
import { useSavedResources } from "@/lib/saved-store";
import { formatDate } from "@/lib/utils";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 p-4 sm:flex-row sm:gap-4">
      <span className="w-32 shrink-0 text-sm font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export default function ResourceDetailPage() {
  const params = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const bn = lang === "bn";
  const { isSaved, toggle } = useSavedResources();
  const { resources, loading, error } = useResources();
  const { busy } = useAccount();
  const resource = resources.find((r) => r.id === params.id);
  if (loading)
    return <p role="status">{bn ? "লোড হচ্ছে…" : "Loading resource…"}</p>;
  if (error)
    return <p role="alert">{bn ? "রিসোর্স লোড করা যায়নি।" : error}</p>;

  if (!resource) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <p className="text-sm text-muted-foreground">
          {bn ? "রিসোর্স পাওয়া যায়নি।" : "Resource not found."}
        </p>
        <Link
          href="/support/resources"
          className={`${buttonVariants({ variant: "secondary", size: "sm" })} mt-3`}
        >
          {t("resourceDirectory")}
        </Link>
      </Card>
    );
  }

  const saved = isSaved(resource.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/support/resources"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t("resources")}
      </Link>

      {resource.verification === "expired" && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {bn
            ? "এই রিসোর্সটি মেয়াদোত্তীর্ণ এবং এটি বর্তমান নাও হতে পারে।"
            : "This resource has expired and may no longer be current."}
        </div>
      )}
      {resource.verification === "needs_review" && (
        <div className="mb-4 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          {bn
            ? "এই তথ্য এখন পুনরায় যাচাই করা হচ্ছে — বিস্তারিত বদলাতে পারে।"
            : "This information is currently being re-checked — details may change."}
        </div>
      )}

      {resource.isDemo && (
        <p className="mb-2 text-sm text-muted-foreground">
          {bn ? "নমুনা — বাস্তব সেবা নয়" : "DEMO — fictional service"}
        </p>
      )}
      <div className="mb-2 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold">{localize(resource.name, lang)}</h1>
        <VerificationBadge state={resource.verification} />
      </div>
      <p className="text-muted-foreground">
        {localize(resource.description, lang)}
      </p>

      <Card className="mt-5 divide-y divide-border">
        <Row
          label={bn ? "যোগ্যতা" : "Eligibility"}
          value={localize(resource.eligibility, lang)}
        />
        <Row
          label={bn ? "খরচ" : "Cost"}
          value={
            resource.cost
              ? localize(resource.cost, lang)
              : bn
                ? "উল্লেখ নেই"
                : "Not stated"
          }
        />
        <Row
          label={bn ? "অবস্থান" : "Location"}
          value={localize(resource.location, lang)}
        />
        {resource.officialContact && (
          <Row
            label={bn ? "যোগাযোগ" : "Contact"}
            value={resource.officialContact}
          />
        )}
        <Row
          label={t("lastChecked")}
          value={formatDate(resource.lastCheckedAt, lang)}
        />
        {resource.timeSensitiveDate && (
          <Row
            label={bn ? "গুরুত্বপূর্ণ তারিখ" : "Key date"}
            value={formatDate(resource.timeSensitiveDate, lang)}
          />
        )}
      </Card>

      {resource.source.url ? (
        <a
          href={resource.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          {t("officialSource")}: {localize(resource.source.label, lang)}
        </a>
      ) : (
        <p className="mt-4 text-sm">
          {bn ? "উৎস দেওয়া হয়নি।" : "No official source provided."}
        </p>
      )}

      <p className="mt-4 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
        {bn
          ? "Close AI যোগ্যতা বা অনুমোদনের নিশ্চয়তা দেয় না। চূড়ান্ত সিদ্ধান্ত সংশ্লিষ্ট অফিসের।"
          : "Close AI never guarantees eligibility or approval. Final decisions rest with the relevant office."}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          variant={saved ? "secondary" : "primary"}
          disabled={busy}
          onClick={() => toggle(resource.id)}
        >
          {saved ? (
            <>
              <BookmarkCheck className="h-4 w-4" aria-hidden />
              {bn ? "সংরক্ষিত" : "Saved"}
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4" aria-hidden />
              {t("save")}
            </>
          )}
        </Button>
        <Link
          href={`/support/steps?resource=${encodeURIComponent(resource.id)}`}
          className={buttonVariants({ variant: "secondary" })}
        >
          <ListChecks className="h-4 w-4" aria-hidden />
          {t("createChecklist")}
        </Link>
        <Link
          href="/support/human"
          className={buttonVariants({ variant: "secondary" })}
        >
          <Users className="h-4 w-4" aria-hidden />
          {t("talkToHuman")}
        </Link>
      </div>
    </div>
  );
}
