"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { AuthGuard } from "@/components/auth-guard";
import { BrandMark, Sidebar } from "@/components/app-shell/nav";
import { MobileDrawer } from "@/components/app-shell/mobile-drawer";
import { NotificationsBell } from "@/components/app-shell/notifications-bell";
import { DemoBanner } from "@/components/demo-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { ToastProvider } from "@/components/toast";
import { signOut } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/config";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

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
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-border glass px-3 sm:px-4">
              <div className="flex items-center gap-2">
                <MobileDrawer />
                <div className="flex items-center gap-2 lg:hidden">
                  <BrandMark className="h-8 w-8" />
                  <span className="font-display text-sm font-bold">DevMentor AI</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <NotificationsBell />
                <ThemeToggle />
                {!DEMO_MODE && (
                  <button
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
              <div className="animate-in">{children}</div>
            </main>
          </div>
        </div>
      </ToastProvider>
    </AuthGuard>
  );
}
