"use client";

import { Bot, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { MarkdownLite } from "@/components/markdown-lite";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ChatResp {
  answer: string;
  intent: string;
  conversation_id: string | null;
  actions_taken: string[];
  suggested_actions: { label: string; kind: string }[];
  links: { label: string; url: string }[];
  mocked: boolean;
}
interface Msg {
  role: "user" | "assistant";
  content: string;
  mocked?: boolean;
  intent?: string;
  links?: { label: string; url: string }[];
}

const SUGGESTIONS = [
  "Explain binary search with an example",
  "Give me a study plan for DBMS this week",
  "What Codeforces problems should I solve today?",
  "Review this code for bugs",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [convId, setConvId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || loading) return;
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setInput("");
    setLoading(true);
    try {
      const resp = await api.post<ChatResp>("/api/chat", {
        message: msg,
        conversation_id: convId,
        language,
      });
      setConvId(resp.conversation_id);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: resp.answer,
          mocked: resp.mocked,
          intent: resp.intent,
          links: resp.links,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <PageHeader title="AI Chat" subtitle="Ask about CS, CP, debugging, or planning.">
        <Select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-36">
          <option value="en">English</option>
          <option value="bn">বাংলা</option>
          <option value="bilingual">Bilingual</option>
        </Select>
      </PageHeader>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-4">
        {messages.length === 0 && (
          <div className="grid h-full place-items-center">
            <div className="text-center">
              <Bot className="mx-auto mb-3 h-10 w-10 text-primary" />
              <p className="mb-4 text-sm text-muted-foreground">
                Ask me anything. Try one of these:
              </p>
              <div className="mx-auto flex max-w-md flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                m.role === "user" ? "bg-muted" : "bg-primary text-primary-foreground",
              )}
            >
              {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-2.5 text-sm",
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {m.role === "assistant" && m.mocked && (
                <Badge variant="muted" className="mb-2">Demo response</Badge>
              )}
              {m.role === "assistant" ? (
                <MarkdownLite text={m.content} />
              ) : (
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              )}
              {m.links && m.links.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.links.map((l) => (
                    <a
                      key={l.url}
                      href={l.url}
                      className="text-xs font-medium text-primary underline"
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
              Thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex items-end gap-2"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Ask DevMentor… (Enter to send, Shift+Enter for newline)"
          className="min-h-[48px] flex-1"
        />
        <Button type="submit" size="icon" className="h-12 w-12" disabled={loading}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
