"use client";

import { type ReactNode } from "react";

import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/lib/i18n";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>{children}</AuthProvider>
    </LanguageProvider>
  );
}
