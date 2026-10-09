import Link from "next/link";

import { BrandMark } from "@/components/app-shell/nav";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-brand-gradient">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark className="h-9 w-9" />
          <span className="font-display text-lg font-bold">DevMentor AI</span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="relative grid flex-1 place-items-center px-6 py-10">
        <div className="w-full max-w-md animate-in">{children}</div>
      </main>
    </div>
  );
}
