"use client";

import { Info } from "lucide-react";

import { DEMO_MODE } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";

export function DemoBanner() {
  const { t } = useLanguage();
  if (!DEMO_MODE) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-info/10 px-4 py-1.5 text-center text-xs font-medium text-info">
      <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {t("demoNotice")}
    </div>
  );
}
