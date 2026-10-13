import { NotificationLink } from "@/components/notification-link";
import { AccountControls } from "@/components/account-controls";
import { AccountStatus } from "@/components/account-status";
import { BottomNav } from "@/components/app-shell/bottom-nav";
import { Sidebar } from "@/components/app-shell/sidebar";
import { BrandMark } from "@/components/brand";
import { DemoBanner } from "@/components/demo-banner";
import { LanguageToggle } from "@/components/language-toggle";
import { APP_NAME } from "@/lib/config";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DemoBanner />
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-background/90 px-4 backdrop-blur lg:h-16">
          <div className="flex items-center gap-2 lg:hidden">
            <BrandMark className="h-7 w-7 text-sm" />
            <span className="font-bold">{APP_NAME}</span>
          </div>
          <AccountControls />
          <NotificationLink />
          <LanguageToggle />
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10"
        >
          <AccountStatus />
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
