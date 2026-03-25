/** Strapi `richtext` is often stored as plain or markdown-style text. No raw HTML for safety. */
export function MarkdownBody({ source }: { source: string }) {
  return (
    <div className="whitespace-pre-wrap text-base leading-relaxed text-zinc-700 dark:text-zinc-300 [&_a]:text-accent">
      {source}
    </div>
  );
}
