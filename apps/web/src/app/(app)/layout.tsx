"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { AuthGuard } from "@/components/auth-guard";
import { MobileNav, Sidebar } from "@/components/app-shell/nav";
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
            <header className="flex h-14 items-center justify-end gap-1 border-b border-border bg-card px-4">
              <NotificationsBell />
              <ThemeToggle />
              {!DEMO_MODE && (
                <button
                  onClick={onSignOut}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </header>
            <MobileNav />
            <main className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</main>
          </div>
        </div>
      </ToastProvider>
    </AuthGuard>
  );
}
