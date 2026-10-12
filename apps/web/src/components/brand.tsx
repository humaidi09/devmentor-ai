import { cn } from "@/lib/utils";

/** Simple brand mark: a rounded "C" tile in the brand teal. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-grid aspect-square place-items-center rounded-md bg-primary font-bold text-primary-foreground",
        className,
      )}
      aria-hidden
    >
      C
    </span>
  );
}
