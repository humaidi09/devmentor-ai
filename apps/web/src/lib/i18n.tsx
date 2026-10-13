"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useAccount } from "./account";

export type Lang = "en" | "bn";

type Dict = Record<string, { en: string; bn: string }>;

/** UI string table. Keys are looked up loosely so a missing key just renders
 *  itself rather than breaking the build. */
export const strings: Dict = {
  getSupport: { en: "Get Support", bn: "সহায়তা নিন" },
  mainNav: { en: "Main navigation", bn: "মূল নেভিগেশন" },
  primaryNav: { en: "Primary navigation", bn: "প্রধান নেভিগেশন" },
  home: { en: "Home", bn: "হোম" },
  support: { en: "Support", bn: "সহায়তা" },
  learn: { en: "Learn", bn: "শেখা" },
  settings: { en: "Settings", bn: "সেটিংস" },
  dashboard: { en: "Dashboard", bn: "ড্যাশবোর্ড" },
  resources: { en: "Resources", bn: "রিসোর্স" },
  resourceDirectory: { en: "Resource Directory", bn: "রিসোর্স ডিরেক্টরি" },
  saved: { en: "Saved", bn: "সংরক্ষিত" },
  savedResources: { en: "Saved Resources", bn: "সংরক্ষিত রিসোর্স" },
  nextSteps: { en: "My Next Steps", bn: "আমার পরবর্তী ধাপ" },
  humanSupport: { en: "Human Support", bn: "মানব সহায়তা" },
  talkToHuman: { en: "Talk to a Human", bn: "একজন মানুষের সাথে কথা বলুন" },
  verified: { en: "Verified", bn: "যাচাইকৃত" },
  needsReview: { en: "Needs review", bn: "পর্যালোচনা প্রয়োজন" },
  expired: { en: "Expired", bn: "মেয়াদোত্তীর্ণ" },
  unverified: { en: "Unverified", bn: "অযাচাইকৃত" },
  archived: { en: "Archived", bn: "আর্কাইভড" },
  draft: { en: "Draft", bn: "খসড়া" },
  officialSource: { en: "Official source", bn: "অফিসিয়াল উৎস" },
  lastChecked: { en: "Last checked", bn: "সর্বশেষ যাচাই" },
  save: { en: "Save", bn: "সংরক্ষণ" },
  createChecklist: { en: "Create checklist", bn: "চেকলিস্ট তৈরি করুন" },
  send: { en: "Send", bn: "পাঠান" },
  search: { en: "Search", bn: "খুঁজুন" },
  preferNotToSay: { en: "Prefer not to say", bn: "বলতে চাই না" },
  language: { en: "Language", bn: "ভাষা" },
  tagline: {
    en: "From student barriers to real support.",
    bn: "শিক্ষার্থীর বাধা থেকে বাস্তব সহায়তায়।",
  },
  demoNotice: {
    en: "Demo mode — sample data, no account needed.",
    bn: "ডেমো মোড — নমুনা তথ্য, কোনো অ্যাকাউন্ট লাগবে না।",
  },
  academicStudy: { en: "Academic Study", bn: "একাডেমিক স্টাডি" },
  developerPath: { en: "Developer Path", bn: "ডেভেলপার পাথ" },
  cpCoach: { en: "CP Coach", bn: "CP কোচ" },
  cp: { en: "CP", bn: "CP" },
  visualLab: { en: "Visual Lab", bn: "ভিজ্যুয়াল ল্যাব" },
};

interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const Ctx = createContext<LanguageCtx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { demo, data, request } = useAccount();
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    if (!demo) return;
    let saved: Lang | null = null;
    try {
      saved =
        typeof window !== "undefined"
          ? (window.localStorage.getItem("close-ai-lang") as Lang | null)
          : null;
    } catch {
      /* storage can be disabled */
    }
    if (saved === "en" || saved === "bn") {
      setLangState(saved);
      document.documentElement.lang = saved;
    }
  }, [demo]);

  useEffect(() => {
    if (!demo && data) {
      const value = data.profile.preferred_language === "bn" ? "bn" : "en";
      setLangState(value);
      document.documentElement.lang = value;
    }
  }, [demo, data]);

  function setLang(l: Lang) {
    if (!demo && data) {
      const previous = lang;
      setLangState(l);
      document.documentElement.lang = l;
      void request("/api/account", { preferred_language: l }, "PATCH").catch(
        () => {
          setLangState(previous);
          document.documentElement.lang = previous;
        },
      );
      return;
    }
    setLangState(l);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("close-ai-lang", l);
      } catch {
        /* session-only language */
      }
      document.documentElement.lang = l;
    }
  }

  const t = (key: string) => strings[key]?.[lang] ?? key;

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useLanguage() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
