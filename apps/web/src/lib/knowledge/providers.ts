import "server-only";

import { externalFetch } from "@/lib/integrations/http";
import { crossref, github, selectProviderIds, worldBank, type ProviderAdapter } from "./adapters";
import type { KnowledgeCategory, KnowledgeProvider } from "./types";

const wrapped = (adapter: ProviderAdapter): ProviderAdapter => ({
  id: adapter.id,
  search: (query, now) => adapter.search(query, now, externalFetch),
});
export const PROVIDERS: Record<KnowledgeProvider, ProviderAdapter> = {
  crossref: wrapped(crossref),
  "world-bank": wrapped(worldBank),
  github: wrapped(github),
};
export function selectProviders(query: string, category: KnowledgeCategory): ProviderAdapter[] {
  return selectProviderIds(query, category).map((id) => PROVIDERS[id]);
}
