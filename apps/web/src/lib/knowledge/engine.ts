import "server-only";

import { KnowledgeEngine } from "./core";
import { PROVIDERS } from "./providers";
import { selectProviderIds } from "./adapters";
import type { KnowledgeCategory } from "./types";

const engine = new KnowledgeEngine(PROVIDERS, selectProviderIds);
export const searchKnowledge = (query: string, category: KnowledgeCategory) => engine.search(query, category);
