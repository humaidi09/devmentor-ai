"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useAccount } from "./account";

export const DEFAULT_PREFERENCES = {
  support: true,
  campus: "demo-u",
  modules: { academic: true, developer: true, cp: true },
  reminders: false,
  quietStart: "22:00",
  quietEnd: "08:00",
  onboarded: false,
};
export type Preferences = typeof DEFAULT_PREFERENCES;
const Context = createContext<{
  preferences: Preferences;
  save: (value: Preferences) => void;
  storageUnavailable: boolean;
} | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { demo, data, mutate } = useAccount();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  useEffect(() => {
    if (!demo) return;
    try {
      const stored = JSON.parse(
        localStorage.getItem("close-ai-preferences") || "null",
      );
      if (stored && typeof stored === "object") {
        setPreferences({
          ...DEFAULT_PREFERENCES,
          campus: stored.campus === "not-listed" ? "not-listed" : "demo-u",
          modules: Object.fromEntries(
            Object.entries(DEFAULT_PREFERENCES.modules).map(([key, value]) => [
              key,
              typeof stored.modules?.[key] === "boolean"
                ? stored.modules[key]
                : value,
            ]),
          ) as Preferences["modules"],
          reminders: stored.reminders === true,
          quietStart: /^\d{2}:\d{2}$/.test(stored.quietStart)
            ? stored.quietStart
            : "22:00",
          quietEnd: /^\d{2}:\d{2}$/.test(stored.quietEnd)
            ? stored.quietEnd
            : "08:00",
          onboarded: stored.onboarded === true,
        });
      }
    } catch {
      setStorageUnavailable(true);
    }
  }, [demo]);
  function save(value: Preferences) {
    if (!demo) {
      void mutate("preferences", value);
      return;
    }
    setPreferences(value);
    try {
      localStorage.setItem("close-ai-preferences", JSON.stringify(value));
      setStorageUnavailable(false);
    } catch {
      setStorageUnavailable(true);
    }
  }
  return (
    <Context.Provider
      value={{
        preferences: demo
          ? preferences
          : (data?.preferences ?? {
              ...DEFAULT_PREFERENCES,
              campus: "not-listed",
            }),
        save,
        storageUnavailable,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function usePreferences() {
  const value = useContext(Context);
  if (!value) throw new Error("PreferencesProvider is required");
  return value;
}

export function moduleVisible(href: string, preferences: Preferences) {
  if (href === "/study") return preferences.modules.academic;
  if (href === "/learn") return preferences.modules.developer;
  if (href === "/cp") return preferences.modules.cp;
  return true;
}
