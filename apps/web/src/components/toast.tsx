"use client";

import { createContext, useCallback, useContext, useState } from "react";

import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "error";
interface Toast {
  id: number;
  title: string;
  variant: Variant;
}

const ToastCtx = createContext<{
  toast: (title: string, variant?: Variant) => void;
}>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const toast = useCallback((title: string, variant: Variant = "default") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, title, variant }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-md border px-4 py-3 text-sm shadow-lg bg-card",
              t.variant === "error" && "border-destructive/40 text-destructive",
              t.variant === "success" &&
                "border-[hsl(var(--success))]/40 text-[hsl(var(--success))]",
            )}
          >
            {t.title}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
