import { cn } from "@/lib/utils";

/** Simple brand mark: a rounded "C" tile in the electric-blue brand colour. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-lg font-bold text-primary-foreground",
        className,
      )}
      aria-hidden
    >
      C
    </span>
  );
}
