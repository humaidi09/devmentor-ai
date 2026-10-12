"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Bot, Send, User, Users } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { ResourceCard } from "@/components/resource-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { buildDemoReply } from "@/lib/support-engine";
import { useLanguage, type Lang } from "@/lib/i18n";
import type { ChatMessage, SuggestedAction } from "@/lib/types";
import { cn } from "@/lib/utils";

function ActionChip({ action }: { action: SuggestedAction }) {
  const cls =
    "rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-muted";
  if (action.kind === "open_resource" && action.resourceId)
    return <Link href={`/support/resources/${action.resourceId}`} className={cls}>{action.label}</Link>;
  if (action.kind === "human")
    return <Link href="/support/human" className={cls}>{action.label}</Link>;
  if (action.kind === "checklist")
    return <Link href="/support/steps" className={cls}>{action.label}</Link>;
  if (action.kind === "continue")
    return <Link href="/support/resources" className={cls}>{action.label}</Link>;
  return <span className={cls}>{action.label}</span>;
}

function ChatInner() {
  const { t, lang } = useLanguage();
  const bn = lang === "bn";
  const params = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);
  const langRef = useRef<Lang>(lang);
  langRef.current = lang;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || loading) return;
    const activeLang = langRef.current;
    setMessages((m) => [...m, { id: `u_${Date.now()}`, role: "user", content: msg }]);
    setInput("");
    setLoading(true);
    try {
      if (!navigator.onLine) {
        setMessages(m => [...m, buildDemoReply(msg, activeLang)]);
        return;
      }
      const resp = await fetch("/api/chat", {
        method: "POST",
        signal: AbortSignal.timeout(15000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, lang: activeLang }),
      });
      if (!resp.ok) throw new Error("Chat unavailable");
      const data = (await resp.json()) as ChatMessage;
      if (data.role !== "assistant" || typeof data.content !== "string") throw new Error("Invalid chat response");
      setMessages((m) => [...m, data]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `e_${Date.now()}`,
          role: "assistant",
          content: bn
            ? "দুঃখিত, কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন, অথবা একজন মানুষের সাথে কথা বলুন।"
            : "Sorry, something went wrong. Please try again, or talk to a human.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const q = params.get("q");
    if (q && !sentInitial.current) {
      sentInitial.current = true;
      void send(q);
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const starters = bn
    ? ["টিউশন ফি নিয়ে চিন্তিত", "একটা কোর্সে সাহায্য দরকার", "ইন্টার্নশিপ খুঁজছি"]
    : ["I'm worried about tuition fees", "I need help with a course", "I'm looking for an internship"];

  return (
    <div className="flex h-[calc(100dvh-10rem)] min-h-[440px] flex-col">
      <PageHeader
        title={t("support")}
        subtitle={
          bn
            ? "আপনার বাধাটা বলুন। যা মিলবে তার উৎস দেখানো হবে।"
            : "Describe your barrier. We'll show the source for anything we find."
        }
      >
        <Link href="/support/human" className={buttonVariants({ variant: "secondary", size: "sm" })}>
          <Users className="h-4 w-4" aria-hidden />
          {t("talkToHuman")}
        </Link>
      </PageHeader>

      <div
        className="flex-1 space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-4"
        role="log"
        aria-label={bn ? "কথোপকথন" : "Conversation"}
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="grid h-full place-items-center text-center">
            <div>
              <Bot className="mx-auto mb-3 h-10 w-10 text-primary" aria-hidden />
              <p className="mb-4 text-sm text-muted-foreground">
                {bn ? "যেকোনো কিছু জিজ্ঞেস করুন। যেমন:" : "Ask me anything. For example:"}
              </p>
              <div className="mx-auto flex max-w-md flex-wrap justify-center gap-2">
                {starters.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-muted"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                m.role === "user" ? "bg-muted" : "bg-primary text-primary-foreground",
              )}
            >
              {m.role === "user" ? <User className="h-4 w-4" aria-hidden /> : <Bot className="h-4 w-4" aria-hidden />}
            </div>
            <div className={cn("max-w-[85%] space-y-3", m.role === "user" && "flex flex-col items-end")}>
              <div
                className={cn(
                  "rounded-lg px-4 py-2.5 text-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : m.uncertain
                      ? "border border-warning/40 bg-warning/5"
                      : "bg-muted",
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              </div>
              {m.sources && m.sources.length > 0 && (
                <div className="w-full space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {bn ? "উৎস" : "Sources"}
                  </p>
                  {m.sources.map((r) => (
                    <ResourceCard key={r.id} resource={r} />
                  ))}
                </div>
              )}
              {m.suggestedActions && m.suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {m.suggestedActions.map((a, i) => (
                    <ActionChip key={i} action={a} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" aria-hidden />
            </div>
            <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
              {bn ? "ভাবছি…" : "Thinking…"}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <label htmlFor="support-message" className="mt-3 text-sm font-medium">{bn ? "বার্তা" : "Message"}</label>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex items-end gap-2"
      >
        <Textarea
          id="support-message"
          maxLength={2000}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder={bn ? "আপনার বাধাটা লিখুন… (Enter পাঠাতে)" : "Describe your barrier… (Enter to send)"}
          className="min-h-[48px] flex-1"
          aria-label={bn ? "বার্তা" : "Message"}
        />
        <Button type="submit" size="icon" className="h-12 w-12" disabled={loading} aria-label={t("send")}>
          <Send className="h-4 w-4" aria-hidden />
        </Button>
      </form>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {bn
          ? "Close AI পরামর্শ দেয়, সিদ্ধান্ত নেয় না। আপনি চাইলে উত্তর না-ও দিতে পারেন।"
          : "Close AI suggests, never decides. You can choose not to answer."}
      </p>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading…</div>}>
      <ChatInner />
    </Suspense>
  );
}
