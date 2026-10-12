"use client";

import { LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { ApiStatus } from "@/components/api-status";
import { AuthGuard } from "@/components/auth-guard";
import { BrandMark, NAV_ITEMS, Sidebar } from "@/components/app-shell/nav";
import { MobileDrawer } from "@/components/app-shell/mobile-drawer";
import { NotificationsBell } from "@/components/app-shell/notifications-bell";
import { DemoBanner } from "@/components/demo-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { ToastProvider } from "@/components/toast";
import { signOut } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/config";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPage = NAV_ITEMS.find((item) => item.href === pathname)?.label || "Workspace";

  async function onSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <AuthGuard>
      <ToastProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <DemoBanner />
            <ApiStatus />
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-border bg-card/90 backdrop-blur-xl px-4 sm:px-8">
              <div className="flex items-center gap-2">
                <MobileDrawer />
                <span className="hidden text-sm text-muted-foreground lg:block">Workspace <span className="mx-3 text-border">/</span><span className="font-medium text-foreground">{currentPage}</span></span>
                <div className="flex items-center gap-2 lg:hidden">
                  <BrandMark className="h-8 w-8" />
                  <span className="font-display text-sm font-bold">DevMentor AI</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Link href="/chat" className="mr-3 hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted sm:flex"><Sparkles className="h-3.5 w-3.5 text-primary" /> Ask your mentor</Link>
                <NotificationsBell />
                <ThemeToggle />
                {!DEMO_MODE && (
                  <button type="button"
                    onClick={onSignOut}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <div className="animate-in mx-auto max-w-7xl">{children}</div>
            </main>
          </div>
        </div>
      </ToastProvider>
    </AuthGuard>
  );
}
