import { Check, Sparkles } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/app-shell/nav";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">

      <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark className="h-9 w-9" />
          <span className="font-display text-lg font-bold">DevMentor AI</span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="relative mx-auto grid w-full max-w-7xl flex-1 items-center gap-14 px-6 py-10 lg:grid-cols-2 lg:px-12">
        <section className="hidden rounded-3xl border border-primary/20 bg-primary/5 p-12 lg:block"><Sparkles className="mb-10 h-10 w-10 text-primary" /><p className="eyebrow mb-5">YOUR NEXT CHAPTER</p><h1 className="text-5xl font-semibold leading-tight tracking-tight">Build skills.<br />Find your focus.<br /><span className="text-primary">Keep your momentum.</span></h1><p className="mt-6 max-w-sm text-base leading-7 text-muted-foreground">A personal workspace for the developer you&apos;re becoming.</p><div className="mt-10 space-y-4">{["Learn with a personal AI mentor", "Make progress with a realistic plan", "Practice, build, and reflect"].map(t => <p key={t} className="flex items-center gap-3 text-sm"><Check className="h-4 w-4 text-primary" />{t}</p>)}</div></section>
        <div className="mx-auto w-full max-w-md animate-in">{children}</div>
      </main>
    </div>
  );
}
