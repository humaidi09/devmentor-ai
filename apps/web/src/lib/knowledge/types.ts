export const KNOWLEDGE_CATEGORIES = [
  "all",
  "research",
  "programming",
  "economics",
  "technology",
  "competitive-programming",
  "learning-resources",
] as const;

export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];
export type KnowledgeProvider = "crossref" | "world-bank" | "github";
export type KnowledgeCollection = "general" | "study" | "developer" | "cp";

export interface KnowledgeResult {
  id: string;
  provider: KnowledgeProvider;
  category: KnowledgeCategory;
  title: string;
  url: string;
  source: string;
  authors: string[];
  publishedAt: string | null;
  updatedAt: string | null;
  retrievedAt: string;
  summary: string;
  stale: boolean;
  collection?: KnowledgeCollection;
}

export interface KnowledgeResponse {
  query: string;
  category: KnowledgeCategory;
  results: KnowledgeResult[];
  unavailable: KnowledgeProvider[];
  searchedAt: string;
}
