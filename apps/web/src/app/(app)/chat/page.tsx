"use client";

import { ArrowUpRight, BookOpen, Bot, Code2, ListChecks, Plus, Send, Sparkles, Trophy, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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
  suggested_actions?: { label: string; kind: string }[];
  actions_taken?: string[];
}

const SUGGESTION_ICONS = [BookOpen, ListChecks, Trophy, Code2];
const SUGGESTION_TITLES = ["Understand a concept", "Find your focus", "Practice a challenge", "Improve your code"];
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
  const [history, setHistory] = useState<{id: string; title: string}[]>([]);
  const [notice, setNotice] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const selectConversation = useCallback((id: string | null) => {
    setConvId(id);
    window.history.replaceState(null, "", id ? `/chat?conversation=${encodeURIComponent(id)}` : "/chat");
  }, []);
  const loadConversation = useCallback(async (id: string) => {
    setLoading(true); setNotice("");
    try {
      const rows = await api.get<Msg[]>(`/api/conversations/${encodeURIComponent(id)}/messages`);
      setMessages(rows); selectConversation(id);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not load history."); }
    finally { setLoading(false); }
  }, [selectConversation]);
  useEffect(() => {
    api.get<{id: string; title: string}[]>("/api/conversations").then(setHistory).catch(error => setNotice(error.message));
    const selected = new URLSearchParams(window.location.search).get("conversation");
    if (selected) void loadConversation(selected);
    // History is restored once; subsequent navigation is through the selector.
  }, [loadConversation]);
  async function runAction(action: {label: string; kind: string}) {
    const path = action.kind === "generate_weekly_plan" ? "/api/tasks/generate-weekly-plan" : action.kind === "cp_recommend" ? "/api/cp/recommendations/generate" : null;
    if (!path) { window.location.assign("/tasks"); return; }
    if (!window.confirm(`${action.label}? This will add items to your workspace.`)) return;
    setLoading(true);
    try { await api.post(path, {}); setNotice("Done. Open your planner or Codeforces page to review the results."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Action failed."); }
    finally { setLoading(false); }
  }

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
      selectConversation(resp.conversation_id);
      void api.get<{id: string; title: string}[]>("/api/conversations").then(setHistory).catch(() => setNotice("Reply saved; history list could not refresh."));
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: resp.answer,
          mocked: resp.mocked,
          intent: resp.intent,
          links: resp.links,
          suggested_actions: resp.suggested_actions,
          actions_taken: resp.actions_taken,
        },
      ]);
    } catch (error) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: error instanceof Error ? error.message : "Could not send your message. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-12rem)] max-w-4xl flex-col">
      <PageHeader title="Your AI mentor" subtitle="A thinking partner for everything you're learning.">
        <Button variant="outline" size="sm" disabled={loading || messages.length === 0} onClick={() => { setMessages([]); selectConversation(null); setInput(""); setNotice(""); }}><Plus className="h-4 w-4" /> New chat</Button>
        <Select aria-label="Response language" value={language} onChange={(e) => setLanguage(e.target.value)} className="w-36">
          <option value="en">English</option>
          <option value="bn">বাংলা</option>
          <option value="bilingual">Bilingual</option>
        </Select>
      </PageHeader>

      <Select aria-label="Conversation history" className="mb-3" disabled={loading} value={convId || ""} onChange={e => { if (e.target.value) void loadConversation(e.target.value); }}>
        <option value="">Open a previous conversation</option>
        {history.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
      </Select>
      {notice && <p role="status" className="mb-3 text-sm text-muted-foreground">{notice}</p>}
      <div className="flex-1 space-y-6 overflow-y-auto p-2 sm:p-5">
        {messages.length === 0 && (
          <div className="grid h-full place-items-center">
            <div className="text-center">
              <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-primary/20 bg-primary/10"><Sparkles className="h-7 w-7 text-primary" /></div>
              <p className="eyebrow mb-3">A LITTLE CLARITY GOES A LONG WAY</p>
              <h2 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">What are we learning today?</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Bring your questions, your code, or your next big idea.
              </p>
              <div className="mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
                {SUGGESTIONS.map((s, index) => { const Icon = SUGGESTION_ICONS[index]; return (
                  <button type="button"
                    key={s}
                    onClick={() => send(s)}
                    className="group rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span className="mb-4 flex items-center justify-between"><Icon className="h-5 w-5 text-primary" /><ArrowUpRight className="h-4 w-4 text-muted-foreground" /></span>
                    <span className="block text-sm font-semibold">{SUGGESTION_TITLES[index]}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{s}</span>
                  </button>
                ); })}
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
              {m.actions_taken?.map((action, index) => <p key={index} className="mt-2 text-xs text-muted-foreground">{action}</p>)}
              {m.suggested_actions?.map((action, index) => <Button key={index} size="sm" variant="outline" className="mr-2 mt-3" disabled={loading} onClick={() => void runAction(action)}>{action.label}</Button>)}
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
            <div role="status" className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
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
        className="chat-composer mt-6 flex items-end gap-3 rounded-2xl border border-border bg-card p-3"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send(input);
            }
          }}
          aria-label="Message your mentor"
          maxLength={8000}
          placeholder="Ask a question, share an idea, or paste your code…"
          className="min-h-[56px] flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        <Button type="submit" size="icon" variant="gradient" className="h-12 w-12" aria-label="Send message" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">Enter to send · Shift + Enter for a new line. AI responses can be imperfect; verify important details.</p>
    </div>
  );
}
