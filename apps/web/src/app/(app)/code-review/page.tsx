"use client";

import { Bot, Map, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { MarkdownLite } from "@/components/markdown-lite";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const LANGS = ["python", "cpp", "javascript", "typescript", "java", "sql", "bash"];
type Tab = "review" | "roadmap";

export default function DevToolsPage() {
  const [tab, setTab] = useState<Tab>("review");

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Developer tools"
        subtitle="Structured code review and project planning. Analysis-only — nothing is executed."
      />

      <div className="mb-5 flex gap-1 rounded-md bg-muted p-1 sm:w-80">
        <TabButton active={tab === "review"} onClick={() => setTab("review")}>
          <ShieldCheck className="h-4 w-4" /> Code review
        </TabButton>
        <TabButton active={tab === "roadmap"} onClick={() => setTab("roadmap")}>
          <Map className="h-4 w-4" /> Project roadmap
        </TabButton>
      </div>

      {tab === "review" ? <ReviewPanel /> : <RoadmapPanel />}

      <p className="mt-4 text-xs text-muted-foreground">
        DevMentor reviews and explains — it won&apos;t complete graded assignments
        for you, and it never runs untrusted code on the server.
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium",
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ReviewPanel() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [wantRewrite, setWantRewrite] = useState(false);
  const [result, setResult] = useState<{ review: string; mocked: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await api.post<{ review: string; mocked: boolean }>("/api/review", {
        code,
        language,
        want_rewrite: wantRewrite,
      });
      setResult(r);
    } catch {
      setResult({ review: "Something went wrong. Please try again.", mocked: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-3">
            <Label>Language</Label>
            <Select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-40">
              {LANGS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </Select>
          </div>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code here…"
            className="min-h-[300px] font-mono text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={wantRewrite}
              onChange={(e) => setWantRewrite(e.target.checked)}
            />
            Also suggest an improved version
          </label>
          <Button onClick={run} disabled={loading || !code.trim()}>
            <ShieldCheck className="h-4 w-4" />
            {loading ? "Reviewing…" : "Review code"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <OutputArea
            loading={loading}
            emptyHint="Your structured review will appear here."
            mocked={result?.mocked}
            text={result?.review}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function RoadmapPanel() {
  const [idea, setIdea] = useState("");
  const [stack, setStack] = useState("");
  const [result, setResult] = useState<{ roadmap: string; mocked: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (idea.trim().length < 3) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await api.post<{ roadmap: string; mocked: boolean }>("/api/roadmap", {
        idea,
        stack_preference: stack || null,
      });
      setResult(r);
    } catch {
      setResult({ roadmap: "Something went wrong. Please try again.", mocked: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="space-y-1.5">
            <Label>Project idea</Label>
            <Textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. A web app where students track habits and earn streaks…"
              className="min-h-[160px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Preferred stack (optional)</Label>
            <Input
              value={stack}
              onChange={(e) => setStack(e.target.value)}
              placeholder="e.g. Next.js + FastAPI + Postgres"
            />
          </div>
          <Button onClick={run} disabled={loading || idea.trim().length < 3}>
            <Map className="h-4 w-4" />
            {loading ? "Planning…" : "Generate roadmap"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <OutputArea
            loading={loading}
            emptyHint="Your project roadmap will appear here."
            mocked={result?.mocked}
            text={result?.roadmap}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function OutputArea({
  loading,
  emptyHint,
  mocked,
  text,
}: {
  loading: boolean;
  emptyHint: string;
  mocked?: boolean;
  text?: string;
}) {
  if (loading) return <p className="text-sm text-muted-foreground">Working on it…</p>;
  if (!text)
    return (
      <div className="grid h-full min-h-[300px] place-items-center text-center text-sm text-muted-foreground">
        <div>
          <Bot className="mx-auto mb-3 h-10 w-10 text-primary" />
          {emptyHint}
        </div>
      </div>
    );
  return (
    <div>
      {mocked && <Badge variant="muted" className="mb-3">Demo response</Badge>}
      <MarkdownLite text={text} />
    </div>
  );
}
