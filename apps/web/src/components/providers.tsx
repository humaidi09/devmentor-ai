"use client";

import { type ReactNode } from "react";

import { PreferencesProvider } from "@/lib/preferences";
import { OfflineSupport } from "@/components/offline-support";
import { LanguageProvider, useLanguage } from "@/lib/i18n";

export function Providers({ children }: { children: ReactNode }) {
  return <LanguageProvider><PreferencesProvider><SkipLink /><OfflineSupport />{children}</PreferencesProvider></LanguageProvider>;
}

function SkipLink() { const { lang } = useLanguage(); return <a href="#main-content" className="sr-only z-50 rounded-md bg-card p-3 text-primary focus:not-sr-only focus:fixed focus:left-3 focus:top-3">{lang === "bn" ? "মূল বিষয়বস্তুতে যান" : "Skip to main content"}</a>; }
