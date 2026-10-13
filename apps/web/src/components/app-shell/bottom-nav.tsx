"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { moduleVisible, usePreferences } from "@/lib/preferences";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { MOBILE_NAV, isNavActive } from "./nav";

export function BottomNav() {
  const { preferences } = usePreferences();
  const pathname = usePathname();
  const { t } = useLanguage();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 backdrop-blur lg:hidden"
      aria-label={t("primaryNav")}
    >
      {MOBILE_NAV.filter(i => moduleVisible(i.href, preferences)).map((item) => {
        const Icon = item.icon;
        const active = isNavActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 border-t-2 py-2 text-[11px] font-medium transition-[color,border-color,background-color]",
              active ? "border-primary bg-primary/5 text-primary" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            <span>{t(item.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
