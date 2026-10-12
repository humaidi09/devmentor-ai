"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { APP_NAME } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { BrandMark } from "../brand";
import { MODULES_NAV, PRIMARY_NAV, SETTINGS_NAV, SUPPORT_NAV, isNavActive, type NavItem } from "./nav";

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const { t } = useLanguage();
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span>{t(item.key)}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <BrandMark className="h-8 w-8 text-base" />
        <span className="font-bold">{APP_NAME}</span>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto p-3" aria-label="Main">
        <div className="space-y-1">
          {PRIMARY_NAV.map((i) => (
            <NavLink key={i.href} item={i} active={isNavActive(pathname, i.href)} />
          ))}
        </div>
        <div>
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("support")}
          </p>
          <div className="space-y-1">
            {SUPPORT_NAV.map((i) => (
              <NavLink key={i.href} item={i} active={isNavActive(pathname, i.href)} />
            ))}
          </div>
        </div>
        <div>
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("learn")}
          </p>
          <div className="space-y-1">
            {MODULES_NAV.map((i) => (
              <NavLink key={i.href} item={i} active={isNavActive(pathname, i.href)} />
            ))}
          </div>
        </div>
        <div className="space-y-1">
          {SETTINGS_NAV.map((i) => (
            <NavLink key={i.href} item={i} active={isNavActive(pathname, i.href)} />
          ))}
        </div>
      </nav>
    </aside>
  );
}
