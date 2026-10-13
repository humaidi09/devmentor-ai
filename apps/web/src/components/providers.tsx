"use client";

import { type ReactNode } from "react";

import { AccountProvider } from "@/lib/account";
import { ResourcesProvider } from "@/lib/resources";
import { PreferencesProvider } from "@/lib/preferences";
import { OfflineSupport } from "@/components/offline-support";
import { LanguageProvider, useLanguage } from "@/lib/i18n";

export function Providers({
  children,
  demo,
  userId,
}: {
  children: ReactNode;
  demo: boolean;
  userId: string | null;
}) {
  return (
    <AccountProvider demo={demo} userId={userId}>
      <LanguageProvider>
        <PreferencesProvider>
          <ResourcesProvider>
            <SkipLink />
            <OfflineSupport />
            {children}
          </ResourcesProvider>
        </PreferencesProvider>
      </LanguageProvider>
    </AccountProvider>
  );
}

function SkipLink() {
  const { lang } = useLanguage();
  return (
    <a
      href="#main-content"
      className="sr-only z-50 rounded-md bg-card p-3 text-primary focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
    >
      {lang === "bn" ? "মূল বিষয়বস্তুতে যান" : "Skip to main content"}
    </a>
  );
}
