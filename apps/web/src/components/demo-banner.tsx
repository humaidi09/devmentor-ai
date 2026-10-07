import { Sparkles } from "lucide-react";

import { DEMO_MODE } from "@/lib/config";

export function DemoBanner() {
  if (!DEMO_MODE) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-accent/10 px-4 py-1.5 text-center text-xs text-accent-foreground">
      <Sparkles className="h-3.5 w-3.5 text-accent" />
      <span className="text-muted-foreground">
        <strong className="text-foreground">Demo mode</strong> — using in-memory
        sample data. Add Supabase &amp; Gemini keys to go live.
      </span>
    </div>
  );
}
