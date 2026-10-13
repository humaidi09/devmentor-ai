"use client";
import Link from "next/link";
import { useLearningProgress } from "@/lib/learning-store";
import { useLanguage } from "@/lib/i18n";
import { Button } from "../ui/button";
import { relatedVisual } from "@/lib/recommendations/learning";
export function ProgressControls({
  topic,
  position,
}: {
  topic: string;
  position: number;
}) {
  const { progress, save, remove, busy, error, demo, userId } =
      useLearningProgress(),
    { lang } = useLanguage(),
    bn = lang === "bn";
  const record = progress.find(
    (p) => p.kind === "visual" && p.topic_key === topic,
  );
  return (
    <section
      className="space-y-2 rounded-lg border p-3"
      aria-label={
        bn ? "ঐচ্ছিক learning progress" : "Optional learning progress"
      }
    >
      <p className="text-xs text-muted-foreground">
        {bn
          ? "Progress সংরক্ষণ ঐচ্ছিক। বোতাম চাপলেই শুধু বর্তমান ধাপ মনে রাখা হবে।"
          : "Remembering progress is optional. Only pressing a button stores this step."}
      </p>
      {record && (
        <p role="status" className="text-xs">
          {bn ? "সংরক্ষিত ধাপ" : "Remembered step"}: {record.position + 1} ·{" "}
          {record.status}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={busy || (!demo && !userId)}
          onClick={() => void save("visual", topic, "viewed", position)}
        >
          {bn ? "এই ধাপ মনে রাখুন" : "Remember this step"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={busy || (!demo && !userId)}
          onClick={() => void save("visual", topic, "completed", position)}
        >
          {bn ? "শেখা সম্পন্ন চিহ্নিত করুন" : "Mark learning completed"}
        </Button>
        {record && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => void remove("visual", topic)}
          >
            {bn ? "Progress মুছুন" : "Forget progress"}
          </Button>
        )}
        {!demo && !userId && (
          <Link href="/auth" className="text-sm text-primary underline">
            {bn ? "Progress রাখতে Sign in" : "Sign in to remember progress"}
          </Link>
        )}
      </div>
      {relatedVisual(topic).map((id) => (
        <Link
          key={id}
          href={`/learn/visual-lab/${id}`}
          className="mr-3 text-xs text-primary underline"
        >
          {bn ? "সম্পর্কিত ধারণা" : "Related concept"}: {id}
        </Link>
      ))}
      <Link href="/cp" className="text-xs text-primary underline">
        {bn ? "CP practice-এ ফিরে যান" : "Return to CP practice"}
      </Link>
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
    </section>
  );
}
