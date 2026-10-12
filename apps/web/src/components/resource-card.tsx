"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";

import { useLanguage } from "@/lib/i18n";
import type { SupportResource } from "@/lib/types";
import { formatDate } from "@/lib/utils";

import { Card } from "./ui/card";
import { VerificationBadge } from "./verification-badge";

export function ResourceCard({ resource }: { resource: SupportResource }) {
  const { t } = useLanguage();
  return (
    <Link
      href={`/support/resources/${resource.id}`}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full p-4 transition-shadow hover:shadow-lift">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-bold leading-snug">{resource.name}</h3>
          <VerificationBadge state={resource.verification} />
        </div>
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{resource.description}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
          {resource.location}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("lastChecked")}: {formatDate(resource.lastCheckedAt)}
        </p>
      </Card>
    </Link>
  );
}
