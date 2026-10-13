export interface KnowledgeExplanation {
  summary: string;
  findings: { text: string; sourceIds: string[] }[];
  differences: string[];
}

export function validateExplanation(value: unknown, allowedIds: string[]): KnowledgeExplanation {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_explanation");
  const record = value as Record<string, unknown>;
  const summary = record.summary;
  if (typeof summary !== "string" || !summary.trim() || summary.length > 1000)
    throw new Error("invalid_explanation");
  if (!Array.isArray(record.findings) || record.findings.length > 5)
    throw new Error("invalid_explanation");
  const findings = record.findings.map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_explanation");
    const row = value as Record<string, unknown>;
    if (typeof row.text !== "string" || !row.text.trim() || row.text.length > 600 ||
      !Array.isArray(row.sourceIds) || !row.sourceIds.length || row.sourceIds.length > 5 ||
      !row.sourceIds.every((id) => typeof id === "string" && allowedIds.includes(id)))
      throw new Error("invalid_explanation");
    return { text: row.text, sourceIds: row.sourceIds as string[] };
  });
  if (!Array.isArray(record.differences) || record.differences.length > 3 ||
    !record.differences.every((item) => typeof item === "string" && item.length <= 500))
    throw new Error("invalid_explanation");
  return { summary, findings, differences: record.differences as string[] };
}
