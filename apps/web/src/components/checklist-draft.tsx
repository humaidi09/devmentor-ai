"use client";
import Link from "next/link";
import { useState } from "react";
import { useAccount } from "@/lib/account";
import { useLanguage } from "@/lib/i18n";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { ChatMessage } from "@/lib/types";
export function ChecklistDraft({
  draft,
}: {
  draft: NonNullable<ChatMessage["draft"]>;
}) {
  const { demo, request, refresh } = useAccount(),
    { lang } = useLanguage(),
    bn = lang === "bn";
  const [steps, setSteps] = useState(draft.steps),
    [title, setTitle] = useState(draft.title),
    [token] = useState(() => crypto.randomUUID()),
    [state, setState] = useState(""),
    [busy, setBusy] = useState(false),
    [rejected, setRejected] = useState(false);
  async function save() {
    setBusy(true);
    setState("");
    try {
      if (demo) {
        const prior = JSON.parse(
          sessionStorage.getItem("close-ai-demo-approved-steps") || "[]",
        );
        sessionStorage.setItem(
          "close-ai-demo-approved-steps",
          JSON.stringify([
            ...prior,
            ...steps.map((t, i) => ({
              id: `${token}_${i}`,
              title: t,
              status: "not_started",
              source: "ai_suggestion",
              resourceId: draft.resourceId,
            })),
          ]),
        );
      } else {
        await request("/api/plans/draft", {
          title,
          resourceId: draft.resourceId,
          steps,
          token,
          confirmed: true,
        });
        await refresh();
      }
      setState("saved");
    } catch {
      setState("error");
    } finally {
      setBusy(false);
    }
  }
  if (rejected)
    return (
      <p className="text-xs text-muted-foreground">
        {bn ? "খসড়া বাতিল হয়েছে।" : "Draft rejected."}
      </p>
    );
  if (state === "saved")
    return (
      <p role="status" className="text-sm">
        {bn ? "অনুমোদিত ধাপ সংরক্ষিত।" : "Approved steps saved."}{" "}
        <Link href="/support/steps" className="text-primary underline">
          {bn ? "পরবর্তী ধাপ খুলুন" : "Open My Next Steps"}
        </Link>
      </p>
    );
  return (
    <section
      className="space-y-2 rounded-lg border p-3"
      aria-label={bn ? "চেকলিস্ট খসড়া" : "Checklist draft"}
    >
      <p className="text-xs text-muted-foreground">
        {bn
          ? "AI প্রস্তাব—এখনও সংরক্ষিত নয়। সম্পাদনা বা বাতিল করুন।"
          : "AI suggestion — unsaved. Edit or reject before saving."}
      </p>
      <label className="block text-sm">
        {bn ? "শিরোনাম" : "Checklist title"}
        <Input
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      {steps.map((s, i) => (
        <div key={i} className="flex gap-2">
          <label className="flex-1 text-xs">
            {bn ? "ধাপ" : "Step"} {i + 1}
            <Input
              maxLength={200}
              value={s}
              onChange={(e) =>
                setSteps(steps.map((x, j) => (i === j ? e.target.value : x)))
              }
            />
          </label>
          <Button
            variant="ghost"
            onClick={() => setSteps(steps.filter((_, j) => i !== j))}
            aria-label={`Remove step ${i + 1}`}
          >
            ×
          </Button>
        </div>
      ))}
      <p className="text-sm">
        {bn
          ? "এই ধাপগুলো সংরক্ষণ করবেন? কোনো reminder তৈরি হবে না।"
          : "Would you like to save these steps? No reminder will be created."}
      </p>
      {state === "error" && (
        <p role="alert">
          {bn
            ? "সংরক্ষণ হয়নি। Settings-এ data storage consent যাচাই করে আবার চেষ্টা করুন।"
            : "Not saved. Check data storage consent in Settings and retry."}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          disabled={
            busy ||
            !title.trim() ||
            !steps.length ||
            steps.some((s) => !s.trim())
          }
          onClick={save}
        >
          {bn ? "অনুমোদন করে সংরক্ষণ" : "Approve and save"}
        </Button>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => setRejected(true)}
        >
          {bn ? "বাতিল" : "Reject"}
        </Button>
      </div>
    </section>
  );
}
