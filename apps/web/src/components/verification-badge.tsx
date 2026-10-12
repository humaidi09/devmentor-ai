"use client";

import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

import { useLanguage } from "@/lib/i18n";
import type { VerificationState } from "@/lib/types";

import { Badge } from "./ui/badge";

type Variant = "success" | "warning" | "destructive" | "muted";

const MAP: Record<VerificationState, { variant: Variant; icon: LucideIcon; key: string }> = {
  verified: { variant: "success", icon: CheckCircle2, key: "verified" },
  needs_review: { variant: "warning", icon: AlertTriangle, key: "needsReview" },
  expired: { variant: "destructive", icon: Clock, key: "expired" },
  unverified: { variant: "muted", icon: HelpCircle, key: "unverified" },
  archived: { variant: "muted", icon: Archive, key: "archived" },
  draft: { variant: "muted", icon: FileText, key: "draft" },
};

/** Verification state shown with an icon + text, never colour alone (a11y). */
export function VerificationBadge({ state }: { state: VerificationState }) {
  const { t } = useLanguage();
  const m = MAP[state];
  const Icon = m.icon;
  return (
    <Badge variant={m.variant} className="shrink-0">
      <Icon className="h-3 w-3" aria-hidden />
      {t(m.key)}
    </Badge>
  );
}
