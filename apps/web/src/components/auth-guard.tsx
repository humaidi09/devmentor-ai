"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Spinner } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { DEMO_MODE } from "@/lib/config";
import { isAuthenticated } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const fail = () => { if (active) { setReady(false); router.replace("/sign-in"); } };
    window.addEventListener("auth-required", fail);
    const { data } = supabase?.auth.onAuthStateChange((_event, session) => { if (!DEMO_MODE && !session) fail(); }) ?? { data: null };
    isAuthenticated().then((ok) => {
      if (!active) return;
      if (ok) setReady(true);
      else router.replace("/sign-in");
    }).catch(fail);
    return () => {
      window.removeEventListener("auth-required", fail);
      data?.subscription.unsubscribe();
      active = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  return <>{children}</>;
}
