"use client";
import Link from "next/link";
import { useState } from "react";
import { SUPABASE_CONFIGURED, DEMO_MODE } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";
import { BrandMark } from "@/components/brand";
import { LanguageToggle } from "@/components/language-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { safeNext } from "@/lib/auth/paths";
export default function AuthPage() {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: signup ? "signup" : "signin",
          email,
          password,
        }),
      });
      if (!response.ok) throw new Error("auth");
      const result = await response.json();
      if (result.confirmation) {
        setNotice(
          bn
            ? "ইমেইলের confirmation link খুলে তারপর সাইন ইন করুন।"
            : "Open the confirmation link in your email, then sign in.",
        );
        setPassword("");
      } else {
        window.location.assign(
          safeNext(new URLSearchParams(location.search).get("next")),
        );
      }
    } catch {
      setError(
        bn
          ? "সাইন ইন বা অ্যাকাউন্ট তৈরি করা যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।"
          : "Unable to sign in or create the account. Check your details and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto max-w-md px-4 py-12"
    >
      <div className="mb-6 flex items-center justify-between">
        <BrandMark />
        <LanguageToggle />
      </div>
      <Card className="space-y-4 p-6">
        <h1 className="text-2xl font-bold">
          {signup
            ? bn
              ? "অ্যাকাউন্ট তৈরি করুন"
              : "Create your account"
            : bn
              ? "Close AI-তে সাইন ইন"
              : "Sign in to Close AI"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {bn
            ? "আপনার পছন্দ ও অনুমোদিত ধাপ নিজের অ্যাকাউন্টে সংরক্ষণ করুন।"
            : "Keep preferences and approved steps in your own account."}
        </p>
        {!SUPABASE_CONFIGURED || DEMO_MODE ? (
          <p role="status">
            {bn
              ? "Account service চালু নেই। ডেমো ব্যবহার করুন।"
              : "Account service is not enabled. Explore the demo."}
          </p>
        ) : (
          <form className="space-y-4" onSubmit={submit}>
            <div>
              <label htmlFor="email">{bn ? "ইমেইল" : "Email"}</label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </div>
            <div>
              <label htmlFor="password">{bn ? "পাসওয়ার্ড" : "Password"}</label>
              <Input
                id="password"
                type="password"
                autoComplete={signup ? "new-password" : "current-password"}
                minLength={signup ? 12 : 1}
                maxLength={128}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                aria-describedby={
                  error ? "auth-error" : signup ? "password-help" : undefined
                }
              />
              {signup && (
                <p id="password-help" className="text-xs text-muted-foreground">
                  {bn ? "কমপক্ষে ১২ অক্ষর।" : "At least 12 characters."}
                </p>
              )}
            </div>
            {error && (
              <p
                id="auth-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="text-sm">
                {notice}
              </p>
            )}
            <Button type="submit" disabled={busy}>
              {busy
                ? bn
                  ? "অপেক্ষা করুন…"
                  : "Please wait…"
                : signup
                  ? bn
                    ? "অ্যাকাউন্ট তৈরি করুন"
                    : "Create account"
                  : bn
                    ? "সাইন ইন"
                    : "Sign in"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setSignup(!signup);
                setError("");
                setNotice("");
              }}
              className="block text-sm text-primary underline"
            >
              {signup
                ? bn
                  ? "আগে থেকেই অ্যাকাউন্ট আছে"
                  : "Already have an account"
                : bn
                  ? "নতুন অ্যাকাউন্ট তৈরি করুন"
                  : "Create a new account"}
            </button>
          </form>
        )}
        <Link
          href="/demo"
          prefetch={false}
          className="block text-primary underline"
        >
          {bn
            ? "অ্যাকাউন্ট ছাড়া ডেমো দেখুন"
            : "Explore demo without an account"}
        </Link>
      </Card>
    </main>
  );
}
