import * as React from "react";

import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "destructive"
  | "muted"
  | "outline";

const variants: Record<Variant, string> = {
  default: "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20",
  primary: "bg-primary text-primary-foreground",
  success: "bg-success/15 text-success ring-1 ring-inset ring-success/20",
  warning: "bg-warning/15 text-warning ring-1 ring-inset ring-warning/25",
  destructive: "bg-destructive/15 text-destructive ring-1 ring-inset ring-destructive/20",
  muted: "bg-muted text-muted-foreground",
  outline: "border border-border text-muted-foreground",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
      aria-label="Loading"
      role="status"
    />
  );
}
