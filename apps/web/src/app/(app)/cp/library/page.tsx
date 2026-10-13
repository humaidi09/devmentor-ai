import { ProblemLibrary } from "@/components/cp/problem-library";
import { PageHeader } from "@/components/page-header";

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  return <div className="space-y-5"><PageHeader title="CP Problem Library" subtitle="Browse topic-based Codeforces and curated LeetCode links, then track your own practice." /><ProblemLibrary initialTopic={topic} /></div>;
}
