"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Spinner } from "@/components/ui/badge";
import { isAuthenticated } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    isAuthenticated().then((ok) => {
      if (!active) return;
      if (ok) setReady(true);
      else router.replace("/sign-in");
    });
    return () => {
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
