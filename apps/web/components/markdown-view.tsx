/**
 * Render markdown con soporte de tablas, listas y formato GFM.
 * Server Component (no usa state/effect), bundle de cliente mínimo.
 *
 * Sanitización: react-markdown ignora HTML crudo por defecto. Mantener
 * `skipHtml` true (default) — nunca renderizar HTML inline.
 */

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
}

export function MarkdownView({ content }: Props) {
  return (
    <div className="markdown-view space-y-4 text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-semibold mt-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold mt-3">{children}</h2>,
          h3: ({ children }) => <h3 className="font-medium mt-2">{children}</h3>,
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1">{children}</ol>,
          code: ({ children, className }) =>
            className ? (
              <code className={`${className} block rounded bg-[var(--color-card)] p-2 text-xs overflow-auto`}>
                {children}
              </code>
            ) : (
              <code className="rounded bg-[var(--color-card)] px-1 text-xs">{children}</code>
            ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="w-full border-collapse text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[var(--color-card)]">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-[var(--color-border)] px-2 py-1 text-left font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-[var(--color-border)] px-2 py-1">{children}</td>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[var(--color-border)] pl-3 italic text-[var(--color-muted)]">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a href={href} className="underline" target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
