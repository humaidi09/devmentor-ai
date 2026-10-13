import { ProblemLibrary } from "@/components/cp/problem-library";
import { PageHeader } from "@/components/page-header";

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  return <div className="space-y-5"><PageHeader title="CP Problem Library" subtitle="Browse 1,200+ topic-based Codeforces, LeetCode and CodeChef problems, then track your practice." /><ProblemLibrary initialTopic={topic} /></div>;
}
