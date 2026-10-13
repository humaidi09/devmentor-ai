"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { signInWithPassword, signUpWithPassword } from "@/lib/auth";
import { AUTH_ENABLED } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await signInWithPassword(email, password);
        router.push("/dashboard");
      } else {
        await signUpWithPassword(email, password);
        setInfo(
          bn
            ? "অ্যাকাউন্ট তৈরি হয়েছে! ইমেইল confirmation চালু থাকলে ইনবক্স দেখুন, নাহলে এখন সাইন ইন করুন।"
            : "Account created! If email confirmation is on, check your inbox — otherwise sign in now.",
        );
        setMode("signin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : bn ? "কিছু একটা সমস্যা হয়েছে।" : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-sm p-6">
        <Link href="/" className="mb-5 flex items-center gap-2">
          <BrandMark className="h-8 w-8" />
          <span className="font-bold">Close AI</span>
        </Link>

        {!AUTH_ENABLED ? (
          <div className="text-sm text-muted-foreground">
            <p>{bn ? "এটি এখন ডেমো মোডে চলছে — লগইন লাগবে না।" : "This is running in demo mode — no login needed."}</p>
            <Link href="/dashboard" className="mt-3 inline-block font-medium text-primary hover:underline">
              {bn ? "ড্যাশবোর্ডে যান →" : "Go to the dashboard →"}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-bold">
              {mode === "signin" ? (bn ? "সাইন ইন" : "Sign in") : bn ? "অ্যাকাউন্ট তৈরি করুন" : "Create account"}
            </h1>
            <form onSubmit={submit} className="mt-4">
              <Field label={bn ? "ইমেইল" : "Email"} htmlFor="email">
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </Field>
              <Field label={bn ? "পাসওয়ার্ড" : "Password"} htmlFor="password" hint={bn ? "কমপক্ষে ৬ অক্ষর" : "At least 6 characters"}>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
              </Field>
              {error && <p className="mb-3 text-sm text-destructive" role="alert">{error}</p>}
              {info && <p className="mb-3 text-sm text-success">{info}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "…" : mode === "signin" ? (bn ? "সাইন ইন" : "Sign in") : bn ? "তৈরি করুন" : "Create account"}
              </Button>
            </form>
            <button
              type="button"
              onClick={() => {
                setMode((m) => (m === "signin" ? "signup" : "signin"));
                setError(null);
                setInfo(null);
              }}
              className="mt-3 text-sm text-primary hover:underline"
            >
              {mode === "signin"
                ? bn
                  ? "নতুন? অ্যাকাউন্ট তৈরি করুন"
                  : "New here? Create an account"
                : bn
                  ? "আগে থেকেই অ্যাকাউন্ট আছে? সাইন ইন"
                  : "Already have an account? Sign in"}
            </button>
          </>
        )}
      </Card>
    </div>
  );
}
