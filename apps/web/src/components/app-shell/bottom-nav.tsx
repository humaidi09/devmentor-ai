"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { MOBILE_NAV, isNavActive } from "./nav";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 backdrop-blur lg:hidden"
      aria-label="Primary"
    >
      {MOBILE_NAV.map((item) => {
        const Icon = item.icon;
        const active = isNavActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground",
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
