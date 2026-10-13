"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { AUTH_ENABLED } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";

export function AuthButton() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const { lang } = useLanguage();
  const bn = lang === "bn";

  if (!AUTH_ENABLED || loading) return null;

  if (!session) {
    return (
      <Link href="/login" className={buttonVariants({ variant: "secondary", size: "sm" })}>
        <LogIn className="h-4 w-4" aria-hidden />
        {bn ? "সাইন ইন" : "Sign in"}
      </Link>
    );
  }

  async function out() {
    await signOut();
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={out}
      aria-label={bn ? "সাইন আউট" : "Sign out"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <LogOut className="h-4 w-4" aria-hidden />
    </button>
  );
}
