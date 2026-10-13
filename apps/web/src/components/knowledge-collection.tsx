"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

import { api, useAccount } from "@/lib/account";
import { useLanguage } from "@/lib/i18n";
import type { KnowledgeCollection as Collection } from "@/lib/knowledge/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Reference {
  external_id: string;
  title: string;
  url: string;
  source: string;
  collection: Collection;
  retrieved_at: string;
}

export function KnowledgeCollection({ collection, onDemoAdd }: {
  collection: "study" | "developer";
  onDemoAdd?: (title: string) => void;
}) {
  const { demo } = useAccount();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [items, setItems] = useState<Reference[]>([]);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (demo) {
      try {
        const rows: unknown = JSON.parse(sessionStorage.getItem("close-ai-saved-knowledge") ?? "[]");
        if (Array.isArray(rows)) setItems(rows.filter((row) => row && row.collection === collection).map((row) => ({
          external_id: row.id, title: row.title, url: row.url, source: row.source,
          collection: row.collection, retrieved_at: row.retrievedAt,
        })).slice(0, 20));
      } catch { /* browser storage unavailable */ }
      return;
    }
    void api<{ items: Reference[] }>("/api/knowledge/saved")
      .then((response) => setItems(response.items.filter((item) => item.collection === collection)))
      .catch(() => setNotice(bn ? "সংরক্ষিত উৎস আনা যায়নি।" : "Saved sources could not be loaded."));
  }, [demo, collection, bn]);
  if (!items.length) return null;
  async function addTask(title: string) {
    const task = `Review source: ${title}`.slice(0, 200);
    try {
      if (demo) onDemoAdd?.(task);
      else await api("/api/data/study-tasks", { title: task });
      setNotice(bn ? "পড়ার কাজ যোগ হয়েছে।" : "Study task added.");
    } catch { setNotice(bn ? "কাজ যোগ করা যায়নি।" : "Unable to add task."); }
  }
  return <Card className="space-y-3 border-primary/20 bg-primary/5 p-4">
    <div><h2 className="font-bold">{collection === "study" ? (bn ? "সংরক্ষিত গবেষণা ও রিসোর্স" : "Saved research and resources") : (bn ? "ডেভেলপার পাথের উৎস" : "Developer Path sources")}</h2><p className="text-xs text-muted-foreground">{bn ? "মূল উৎস দেখে নিজে সিদ্ধান্ত নিন।" : "Open the original source before relying on it."}</p></div>
    <ul className="space-y-2">{items.map((item) => <li key={item.external_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-card p-3">
      <div className="min-w-0"><a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline">{item.title}<ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden /></a><p className="text-xs text-muted-foreground">{item.source} · {bn ? "আনা হয়েছে" : "Retrieved"} {new Date(item.retrieved_at).toLocaleDateString(bn ? "bn-BD" : "en-US")}</p></div>
      {collection === "study" && <Button size="sm" variant="secondary" onClick={() => void addTask(item.title)}>{bn ? "পড়ার কাজ করুন" : "Create study task"}</Button>}
    </li>)}</ul>
    {notice && <p role="status" className="text-xs">{notice}</p>}
  </Card>;
}
