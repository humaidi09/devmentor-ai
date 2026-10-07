import * as React from "react";

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`"))
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
          {p.slice(1, -1)}
        </code>
      );
    if (p.startsWith("_") && p.endsWith("_"))
      return (
        <em key={i} className="text-muted-foreground">
          {p.slice(1, -1)}
        </em>
      );
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}

/** Minimal Markdown renderer: #/##/### headings, - bullets, **bold**, _italic_,
 *  `code`. Enough for the structured AI review/roadmap output; no dependency. */
export function MarkdownLite({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("### "))
          return <h4 key={i} className="mt-3 font-semibold">{renderInline(line.slice(4))}</h4>;
        if (line.startsWith("## "))
          return <h3 key={i} className="mt-4 font-semibold text-primary">{renderInline(line.slice(3))}</h3>;
        if (line.startsWith("# "))
          return <h2 key={i} className="mt-4 text-lg font-bold">{renderInline(line.slice(2))}</h2>;
        if (line.startsWith("- ") || line.startsWith("* "))
          return (
            <p key={i} className="flex gap-2 pl-1">
              <span className="text-muted-foreground">•</span>
              <span>{renderInline(line.slice(2))}</span>
            </p>
          );
        if (!line.trim()) return <div key={i} className="h-2" />;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}
