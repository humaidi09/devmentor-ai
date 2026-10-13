import type { KnowledgeCategory, KnowledgeProvider, KnowledgeResult } from "./types";

export interface ProviderAdapter {
  id: KnowledgeProvider;
  search(query: string, now: string, request?: typeof fetch): Promise<KnowledgeResult[]>;
}

type Row = Record<string, unknown>;
const row = (value: unknown): Row | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Row : null;
const str = (value: unknown, max = 300): string =>
  typeof value === "string" ? value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";
const iso = (value: unknown): string | null => {
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

async function getJson(url: string, headers: Record<string, string> = {}, request: typeof fetch = fetch): Promise<unknown> {
  const response = await request(url, {
    headers: { Accept: "application/json", "User-Agent": "CloseAI/1.0 (educational metadata search)", ...headers },
    signal: AbortSignal.timeout(7000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(response.status === 429 ? "rate_limit" : "unavailable");
  if (Number(response.headers.get("content-length")) > 1_000_000) throw new Error("oversized");
  const body = await response.text();
  if (body.length > 1_000_000) throw new Error("oversized");
  return JSON.parse(body) as unknown;
}

export const crossref: ProviderAdapter = {
  id: "crossref",
  async search(query, now, request) {
    const recent = /\b(recent|latest|current|new)\b/i.test(query);
    const term = query.replace(/\b(recent|latest|current|new)\b/gi, " ").trim() || query;
    const filter = recent ? `&filter=from-pub-date:${new Date(now).getUTCFullYear() - 3}-01-01` : "";
    const data = row(await getJson(`https://api.crossref.org/works?query=${encodeURIComponent(term)}&rows=6&select=DOI,title,author,published,created,URL,publisher,abstract,type${filter}`, {}, request));
    const items = row(data?.message)?.items;
    if (!Array.isArray(items)) throw new Error("malformed");
    return items.flatMap((value): KnowledgeResult[] => {
      const item = row(value);
      const doi = str(item?.DOI, 300);
      const title = Array.isArray(item?.title) ? str(item.title[0]) : "";
      if (!doi || !title || !/^10\.[^\s]+\/.+/.test(doi)) return [];
      const authors = Array.isArray(item?.author)
        ? item.author.slice(0, 4).map((a) => {
            const person = row(a);
            return [str(person?.given, 80), str(person?.family, 80)].filter(Boolean).join(" ");
          }).filter(Boolean) : [];
      const published = row(item?.published);
      const parts = published?.["date-parts"];
      const year = Array.isArray(parts) && Array.isArray(parts[0]) ? Number(parts[0][0]) : NaN;
      const publishedAt = Number.isInteger(year) && year > 1800 && year < 2200 ? String(year) : null;
      return [{
        id: `crossref:${doi}`,
        provider: "crossref",
        category: "research",
        title,
        url: `https://doi.org/${encodeURIComponent(doi).replace(/%2F/gi, "/")}`,
        source: str(item?.publisher, 120) || "Crossref DOI record",
        authors,
        publishedAt,
        updatedAt: iso(row(item?.created)?.["date-time"]),
        retrievedAt: now,
        summary: str(item?.abstract, 360) || `Publication metadata (${str(item?.type, 60) || "work"}). Open the DOI for details.`,
        stale: false,
      }];
    });
  },
};

const indicators = [
  { terms: /inflation|price|মূল্যস্ফীতি/i, id: "FP.CPI.TOTL.ZG", title: "Inflation, consumer prices (annual %)" },
  { terms: /population|জনসংখ্যা/i, id: "SP.POP.TOTL", title: "Population, total" },
  { terms: /unemployment|বেকারত্ব/i, id: "SL.UEM.TOTL.ZS", title: "Unemployment, total (% of labor force)" },
  { terms: /internet|ইন্টারনেট/i, id: "IT.NET.USER.ZS", title: "Individuals using the Internet (% of population)" },
  { terms: /gdp|econom|growth|অর্থনীতি|জিডিপি/i, id: "NY.GDP.MKTP.CD", title: "GDP (current US$)" },
];
const countries = [
  { terms: /bangladesh|বাংলাদেশ/i, id: "BGD", name: "Bangladesh" },
  { terms: /india|ভারত/i, id: "IND", name: "India" },
  { terms: /pakistan/i, id: "PAK", name: "Pakistan" },
  { terms: /united states|\busa\b|\bus\b/i, id: "USA", name: "United States" },
];

export const worldBank: ProviderAdapter = {
  id: "world-bank",
  async search(query, now, request) {
    const indicator = indicators.find((item) => item.terms.test(query)) ?? indicators[4];
    const country = countries.find((item) => item.terms.test(query)) ?? { id: "WLD", name: "World" };
    const data = await getJson(`https://api.worldbank.org/v2/country/${country.id}/indicator/${indicator.id}?format=json&per_page=12`, {}, request);
    if (!Array.isArray(data) || !Array.isArray(data[1])) throw new Error("malformed");
    const observations = data[1].filter((value: unknown) => row(value) && typeof row(value)?.value === "number");
    return observations.slice(0, 3).map((value: unknown): KnowledgeResult => {
      const item = row(value)!;
      const year = str(item.date, 8);
      const number = Number(item.value);
      const display = indicator.id === "SP.POP.TOTL" ? number.toLocaleString("en-US") : number.toLocaleString("en-US", { maximumFractionDigits: 2 });
      return {
        id: `world-bank:${country.id}:${indicator.id}:${year}`,
        provider: "world-bank",
        category: "economics",
        title: `${country.name}: ${indicator.title} (${year})`,
        url: `https://data.worldbank.org/indicator/${indicator.id}?locations=${country.id}`,
        source: "World Bank Open Data",
        authors: ["World Bank"],
        publishedAt: year,
        updatedAt: null,
        retrievedAt: now,
        summary: `Reported value: ${display}. Check the source for methodology and revisions.`,
        stale: false,
      };
    });
  },
};

export const github: ProviderAdapter = {
  id: "github",
  async search(query, now, request) {
    const token = process.env.GITHUB_SEARCH_TOKEN;
    const data = row(await getJson(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=6`, {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }, request));
    if (!Array.isArray(data?.items)) throw new Error("malformed");
    return data.items.flatMap((value): KnowledgeResult[] => {
      const item = row(value);
      const url = str(item?.html_url, 500);
      const title = str(item?.full_name, 200);
      if (!title || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(url)) return [];
      return [{
        id: `github:${item?.id}`,
        provider: "github",
        category: "programming",
        title,
        url,
        source: "GitHub repository",
        authors: [str(row(item?.owner)?.login, 100)].filter(Boolean),
        publishedAt: iso(item?.created_at),
        updatedAt: iso(item?.updated_at),
        retrievedAt: now,
        summary: str(item?.description, 360) || "Open the repository to inspect its documentation and license.",
        stale: false,
      }];
    });
  },
};

export function selectProviderIds(query: string, category: KnowledgeCategory): KnowledgeProvider[] {
  if (category === "research") return ["crossref"];
  if (category === "economics") return ["world-bank"];
  if (["programming", "technology", "competitive-programming"].includes(category)) return ["github"];
  if (category === "learning-resources") return ["crossref", "github"];
  const economic = /econom|gdp|population|inflation|বাংলাদেশ|অর্থনীতি|জনসংখ্যা/i.test(query);
  return economic ? ["world-bank", "crossref", "github"] : ["crossref", "github"];
}
