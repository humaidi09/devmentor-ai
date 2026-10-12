"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";

import { localize } from "@/lib/content-bn";
import { useLanguage } from "@/lib/i18n";
import type { SupportResource } from "@/lib/types";
import { formatDate } from "@/lib/utils";

import { Card } from "./ui/card";
import { VerificationBadge } from "./verification-badge";

export function ResourceCard({ resource }: { resource: SupportResource }) {
  const { t, lang } = useLanguage();
  return (
    <Link
      href={`/support/resources/${resource.id}`}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full p-4 transition-shadow hover:shadow-lift">
        {resource.isDemo && <p className="mb-2 text-xs font-medium text-muted-foreground">{lang === "bn" ? "নমুনা — বাস্তব সেবা নয়" : "DEMO — fictional service"}</p>}
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-bold leading-snug">{localize(resource.name, lang)}</h3>
          <VerificationBadge state={resource.verification} />
        </div>
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{localize(resource.description, lang)}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
          {localize(resource.location, lang)}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("lastChecked")}: {formatDate(resource.lastCheckedAt, lang)}
        </p>
      </Card>
    </Link>
  );
}
