"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { signUpWithPassword } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/config";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signUpWithPassword(email, password);
      setDone(true);
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          Set up your mentor in a couple of minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {DEMO_MODE && (
          <div className="rounded-md border border-accent/40 bg-accent/5 p-3 text-sm text-muted-foreground">
            Demo mode is on — try onboarding without an account.
            <Link href="/onboarding" className="ml-1 font-medium text-primary">
              Start onboarding →
            </Link>
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              disabled={DEMO_MODE}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={DEMO_MODE}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {done && (
            <p className="text-sm text-[hsl(var(--success))]">
              Check your email to confirm, then sign in.
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading || DEMO_MODE}>
            {loading ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-primary">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
