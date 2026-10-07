"use client";

import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { CodeBlock } from "@/components/code-block";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/components/toast";
import { Badge, Spinner } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import type { Page, Snippet } from "@/lib/types";

const CATEGORIES = [
  "Python",
  "JavaScript / TypeScript",
  "React / Next.js",
  "Node.js / Express",
  "FastAPI / Python backend",
  "C++ STL & CP",
  "SQL",
  "Git",
  "Docker & Deployment",
  "Testing",
  "Design Patterns",
  "Error Handling & Debugging",
];
const LANGUAGES = ["python", "javascript", "typescript", "tsx", "cpp", "sql", "bash", "dockerfile", "yaml", "java"];

export default function SnippetsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [language, setLanguage] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState("");
  const [selected, setSelected] = useState<Snippet | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "60" });
    if (q) params.set("q", q);
    if (language) params.set("language", language);
    if (category) params.set("category", category);
    if (visibility) params.set("visibility", visibility);
    try {
      const data = await api.get<Page<Snippet>>(`/api/snippets?${params}`);
      setItems(data.items);
    } catch {
      toast("Could not load snippets.", "error");
    } finally {
      setLoading(false);
    }
  }, [q, language, category, visibility, toast]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function saveToLibrary(s: Snippet) {
    try {
      await api.post("/api/snippets", {
        title: s.title,
        description: s.description,
        language: s.language,
        category: s.category,
        code: s.code,
        notes: s.notes,
        tags: s.tags,
        visibility: "private",
      });
      toast("Saved to your library.", "success");
      load();
    } catch {
      toast("Could not save.", "error");
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Snippet library"
        subtitle="Stop re-Googling syntax — search, copy, and save your own."
      >
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" /> New snippet
        </Button>
      </PageHeader>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search snippets…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="">All languages</option>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </Select>
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
          <option value="">Public + mine</option>
          <option value="public">Built-in only</option>
          <option value="private">My snippets</option>
        </Select>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Spinner className="h-6 w-6" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No snippets match. Try a different search.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <button key={s.id} className="text-left" onClick={() => setSelected(s)}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="default">{s.language}</Badge>
                    {s.is_owner && <Badge variant="muted">mine</Badge>}
                  </div>
                  <h3 className="font-semibold leading-tight">{s.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {s.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {s.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-xs text-muted-foreground">
                        #{t}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      {/* Detail */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
        className="max-w-2xl"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">{selected.language}</Badge>
              <Badge variant="muted">{selected.category}</Badge>
              {selected.tags.map((t) => (
                <span key={t} className="text-xs text-muted-foreground">#{t}</span>
              ))}
            </div>
            {selected.description && (
              <p className="text-sm text-muted-foreground">{selected.description}</p>
            )}
            <CodeBlock
              code={selected.code}
              onCopy={() => api.post(`/api/snippets/${selected.id}/copy-event`).catch(() => {})}
            />
            {selected.notes && (
              <div className="rounded-md border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/10 p-3 text-sm">
                <span className="font-medium">Caveat: </span>
                {selected.notes}
              </div>
            )}
            {!selected.is_owner && (
              <Button variant="outline" onClick={() => saveToLibrary(selected)}>
                Save to my library
              </Button>
            )}
          </div>
        )}
      </Modal>

      <NewSnippetModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={load}
      />
    </div>
  );
}

function NewSnippetModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [f, setF] = useState({
    title: "",
    language: "python",
    category: "Python",
    code: "",
    notes: "",
    tags: "",
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!f.title.trim() || !f.code.trim()) return;
    setBusy(true);
    try {
      await api.post("/api/snippets", {
        title: f.title,
        language: f.language,
        category: f.category,
        code: f.code,
        notes: f.notes || null,
        tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
        visibility: "private",
      });
      toast("Snippet saved.", "success");
      setF({ ...f, title: "", code: "", notes: "", tags: "" });
      onClose();
      onCreated();
    } catch {
      toast("Could not save snippet.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New snippet" className="max-w-2xl">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Language</Label>
            <Select value={f.language} onChange={(e) => setF({ ...f, language: e.target.value })}>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Code</Label>
          <Textarea
            className="min-h-[160px] font-mono"
            value={f.code}
            onChange={(e) => setF({ ...f, code: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Caveat / note</Label>
          <Input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Tags (comma-separated)</Label>
          <Input value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy || !f.title.trim() || !f.code.trim()}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
