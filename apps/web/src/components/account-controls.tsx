"use client";
import Link from "next/link";
import { useState } from "react";
import { useAccount, api } from "@/lib/account";
import { DEMO_MODE } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";
export function AccountControls() {
  const { demo, userId, data } = useAccount();
  const { lang } = useLanguage();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const bn = lang === "bn";
  async function signout() {
    setBusy(true);
    try {
      await api("/api/auth", {}, "DELETE");
      window.location.assign("/auth");
    } catch {
      setError(
        bn
          ? "সাইন আউট করা যায়নি। আবার চেষ্টা করুন।"
          : "Unable to sign out. Try again.",
      );
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      {demo ? (
        <span>DEMO</span>
      ) : (
        <span>{bn ? "নিজের অ্যাকাউন্ট" : "Your account"}</span>
      )}
      {!DEMO_MODE &&
        (userId && !demo ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void signout()}
            className="text-primary underline"
          >
            {bn ? "সাইন আউট" : "Sign out"}
          </button>
        ) : (
          <Link className="text-primary underline" href="/auth">
            {bn ? "সাইন ইন" : "Sign in"}
          </Link>
        ))}
      {!demo && data?.roles.length !== 0 && data && (
        <Link href="/maintainer" className="text-primary underline">
          {bn ? "রিসোর্স workspace" : "Resource workspace"}
        </Link>
      )}
      {error && <span role="alert">{error}</span>}
    </div>
  );
}
