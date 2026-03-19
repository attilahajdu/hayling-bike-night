/** Strapi `richtext` is stored as a string (Markdown-style line breaks). No raw HTML for safety. */
export function MarkdownBody({ source }: { source: string }) {
  return (
    <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-zinc-300 [&_a]:text-accent">
      {source}
    </div>
  );
}
