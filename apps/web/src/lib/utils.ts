import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | Date | null | undefined, lang: "en" | "bn" = "en"): string {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function daysUntil(input: string | Date): number {
  const d = typeof input === "string" ? new Date(input) : input;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
