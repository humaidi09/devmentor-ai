"use client";

import {
  Sparkles,
  ArrowUpRight,
  Code2,
  Home,
  LineChart,
  ListChecks,
  MessageSquare,
  Settings,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/tasks", label: "Study planner", icon: ListChecks },
  { href: "/chat", label: "AI Mentor", icon: MessageSquare },
  { href: "/cp", label: "Codeforces", icon: Trophy },
  { href: "/snippets", label: "Snippets", icon: Code2 },
  { href: "/code-review", label: "Developer tools", icon: ShieldCheck },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl bg-gradient-brand text-white shadow-soft",
        className,
      )}
    >
      <Sparkles className="h-[55%] w-[55%]" />
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="workspace-sidebar hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-24 items-center gap-2.5 px-5">
        <BrandMark className="h-9 w-9" />
        <div className="leading-tight">
          <p className="font-display text-[15px] font-bold">DevMentor AI</p>
          <p className="text-[9px] tracking-widest text-muted-foreground">YOUR LEARNING WORKSPACE</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <item.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <Sparkles className="mb-3 h-5 w-5 text-primary" />
          <p className="text-sm font-semibold">A little progress, daily.</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Build a plan around your goals and the time you actually have.</p>
          <Link href="/onboarding" className="mt-4 flex items-center justify-between text-xs font-semibold text-primary">Personalize your workspace <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
        <Link href="/settings" className="mt-4 flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">ME</span>
          <div><p className="text-sm font-medium">Your workspace</p><p className="text-xs text-muted-foreground">Preferences & account</p></div>
        </Link>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="thin-scroll flex gap-1 overflow-x-auto border-b border-border bg-card px-2 py-2 lg:hidden">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
