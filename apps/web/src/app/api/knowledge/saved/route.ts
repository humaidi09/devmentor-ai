import type { NextRequest } from "next/server";

import { account, dbResult, failure, json } from "@/lib/server-api";
import { KNOWLEDGE_CATEGORIES, type KnowledgeProvider } from "@/lib/knowledge/types";
import { ApiError, choice, exact, object, text, https } from "@/lib/validation";
import { requestJson } from "@/lib/validation/request";

const PROVIDERS = ["crossref", "world-bank", "github"] as const;
const HOSTS: Record<KnowledgeProvider, string[]> = {
  crossref: ["doi.org"],
  "world-bank": ["data.worldbank.org"],
  github: ["github.com"],
};

export async function GET(req: NextRequest) {
  try {
    const { db, user } = await account(req);
    const rows = dbResult(await db.from("saved_knowledge")
      .select("external_id,provider,category,title,url,source,summary,published_at,retrieved_at,saved_at,collection")
      .eq("user_id", user.id).order("saved_at", { ascending: false }).limit(100));
    return json({ items: rows });
  } catch (error) { return failure(error); }
}

export async function POST(req: NextRequest) {
  try {
    const { db, user } = await account(req);
    const body = object(await requestJson(req));
    exact(body, ["id", "provider", "category", "title", "url", "source", "summary", "publishedAt", "retrievedAt", "collection"]);
    const provider = choice(body.provider, PROVIDERS);
    const url = https(body.url);
    if (!HOSTS[provider].includes(new URL(url).hostname))
      throw new ApiError(400, "Source URL does not match provider.");
    const id = text(body.id, 350);
    if (!id.startsWith(`${provider}:`)) throw new ApiError(400, "Invalid source ID.");
    const retrievedAt = text(body.retrievedAt, 40);
    if (!Number.isFinite(Date.parse(retrievedAt))) throw new ApiError(400, "Invalid retrieval date.");
    dbResult(await db.from("saved_knowledge").upsert({
      user_id: user.id,
      external_id: id,
      provider,
      category: choice(body.category, KNOWLEDGE_CATEGORIES),
      title: text(body.title, 300),
      url,
      source: text(body.source, 150),
      collection: choice(body.collection ?? "general", ["general", "study", "developer", "cp"]),
      summary: text(body.summary, 500, true),
      published_at: body.publishedAt === null ? null : text(body.publishedAt, 40),
      retrieved_at: new Date(retrievedAt).toISOString(),
    }, { onConflict: "user_id,external_id" }));
    return json({ ok: true });
  } catch (error) { return failure(error); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { db, user } = await account(req);
    const body = object(await requestJson(req));
    exact(body, ["id"]);
    dbResult(await db.from("saved_knowledge").delete().eq("user_id", user.id).eq("external_id", text(body.id, 350)));
    return json({ ok: true });
  } catch (error) { return failure(error); }
}
