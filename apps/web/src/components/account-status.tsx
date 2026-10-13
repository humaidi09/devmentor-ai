"use client";
import Link from "next/link";
import { useAccount } from "@/lib/account";
import { useLanguage } from "@/lib/i18n";
import { Button } from "./ui/button";
export function AccountStatus() {
  const { demo, loading, busy, error, refresh } = useAccount();
  const { lang } = useLanguage();
  if (demo) return null;
  return (
    <div className="mb-4 space-y-2">
      {(loading || busy) && (
        <p role="status">
          {lang === "bn" ? "অ্যাকাউন্ট আপডেট হচ্ছে…" : "Updating account…"}
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive p-3 text-sm"
        >
          <p>
            {lang === "bn"
              ? "তথ্য লোড বা সংরক্ষণ করা যায়নি। সংযোগ ও অনুমতি যাচাই করুন।"
              : error}
          </p>
          <Button variant="secondary" onClick={() => void refresh()}>
            {lang === "bn" ? "আবার চেষ্টা করুন" : "Retry"}
          </Button>
          <Link className="ml-3 text-primary underline" href="/auth">
            {lang === "bn" ? "সাইন ইন" : "Sign in"}
          </Link>
        </div>
      )}
    </div>
  );
}
