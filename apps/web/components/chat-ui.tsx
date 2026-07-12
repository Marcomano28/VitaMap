"use client";

import { useEffect, useRef, useState } from "react";
import { MarkdownView } from "./markdown-view";
import { CitationCard } from "./citation-card";
import { InlineDisclaimer } from "./disclaimer";
import { LabTimeline } from "./lab-timeline";
import { LabValueBand } from "./lab-value-band";
import { copy, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import type { LabSeries } from "@/lib/lab-visualization";

interface Citation {
  source: "personal" | "evidence";
  title: string;
  path: string;
  score: number;
  sourceKind?: string;
  sourceDocumentType?: string;
  sourceUrl?: string | null;
  sourceLanguage?: string;
  sourceJurisdiction?: string[];
  observedAt?: string;
}

interface ChatVisualization {
  kind: "lab-series";
  series: Array<{ markerId: string; displayName: string; series: LabSeries }>;
  mapHref: string;
}

interface AssistantMessage {
  role: "assistant";
  content: string;
  citations: Citation[];
  guardrail: { verdict: "safe" | "rewrite" | "block"; flags?: string[] };
  /** Aviso fijo de recursos de crisis: nunca generado por el LLM. */
  crisis?: boolean;
  /** Series estructuradas del propio usuario; el servidor las construye
   *  de forma determinista y el cliente las dibuja. El LLM no interviene. */
  visualization?: ChatVisualization;
}

interface UserMessage {
  role: "user";
  content: string;
}

type Message = UserMessage | AssistantMessage;

const HISTORY_FOR_LLM = 10; // últimos N mensajes que enviamos al LLM

export function ChatUI({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = copy[locale].chat;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const nextHistory: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 165_000);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          locale,
          history: nextHistory
            .slice(-HISTORY_FOR_LLM - 1, -1) // sin el actual
            .map((m) => ({ role: m.role, content: m.content })),
        }),
        credentials: "same-origin",
        signal: controller.signal,
      });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login?next=/chat";
          return;
        }
        if (res.status === 402) {
          window.location.href = "/settings/billing?required=1";
          return;
        }
        throw new Error(t.requestFailed);
      }
      const json = (await res.json()) as {
        text: string;
        citations: Citation[];
        guardrail: { verdict: "safe" | "rewrite" | "block"; flags?: string[] };
        crisis?: boolean;
        visualization?: ChatVisualization;
      };
      setMessages([
        ...nextHistory,
        {
          role: "assistant",
          content: json.text,
          citations: json.citations,
          guardrail: json.guardrail,
          crisis: json.crisis === true,
          visualization: json.visualization,
        },
      ]);
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === "AbortError"
          ? t.requestTimedOut
          : err instanceof Error && err.message === t.requestFailed
            ? err.message
            : t.requestFailed,
      );
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  return (
    <div className="vitamap-chat-panel flex flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 pr-1 sm:pr-2"
      >
        {messages.length === 0 && !loading && (
          <div className="text-sm text-[var(--color-muted)] rounded-md border border-dashed border-[var(--color-border)] p-4">
            {t.empty}
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <UserBubble key={i} content={m.content} />
          ) : (
            <AssistantBubble key={i} m={m} locale={locale} />
          ),
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
            {t.loading}
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={send}
        className="mt-4 flex flex-col items-stretch gap-2 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:items-end"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(e as unknown as React.FormEvent);
            }
          }}
          rows={2}
          maxLength={4000}
          placeholder={t.placeholder}
          className="min-w-0 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none"
        />
        <button
          type="submit"
          disabled={loading || input.trim().length === 0}
          className="rounded-md bg-[var(--color-foreground)] text-[var(--color-background)] px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 sm:w-auto"
        >
          {t.send}
        </button>
      </form>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[92%] rounded-2xl rounded-br-sm bg-[var(--color-foreground)] text-[var(--color-background)] px-4 py-2 text-sm whitespace-pre-wrap sm:max-w-[80%]">
        {content}
      </div>
    </div>
  );
}

function AssistantBubble({
  m,
  locale,
}: {
  m: AssistantMessage;
  locale: Locale;
}) {
  const t = copy[locale].chat;
  const blocked = m.guardrail.verdict === "block";
  const rewritten = m.guardrail.verdict === "rewrite";
  const [showCitations, setShowCitations] = useState(false);

  // Aviso fijo de crisis: estilo propio, sin disclaimer educativo ni
  // etiquetas de guardrail — es un mensaje del sistema, no del modelo.
  if (m.crisis) {
    return (
      <div className="max-w-[96%] rounded-2xl rounded-bl-sm border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-100 whitespace-pre-wrap sm:max-w-[90%]">
        {m.content}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="max-w-[96%] rounded-2xl rounded-bl-sm bg-[var(--color-card)] border border-[var(--color-border)] px-4 py-3 sm:max-w-[90%]">
        {(blocked || rewritten) && (
          <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted)] mb-2">
            {blocked ? t.blocked : t.rewritten}
          </p>
        )}
        <MarkdownView content={m.content} />
        <InlineDisclaimer locale={locale} />
      </div>

      {m.visualization && m.visualization.series.length > 0 && (
        <div className="max-w-[96%] space-y-3 sm:max-w-[90%]">
          {m.visualization.series.map(({ markerId, displayName, series }) => (
            <div
              key={markerId}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:p-5"
            >
              {series.points.length > 1 ? (
                <LabTimeline
                  displayName={displayName}
                  series={series}
                  locale={locale}
                  sourceHref={(point) => `/memory/view/${encodeURI(point.sourcePath)}`}
                />
              ) : (
                <LabValueBand
                  displayName={displayName}
                  value={series.points[0].value}
                  unit={series.points[0].unitOriginal ?? series.points[0].unitUcum ?? ""}
                  observedAt={series.points[0].observedAt}
                  labName={series.points[0].labName}
                  reference={series.points[0].reference}
                  referenceOriginal={series.points[0].referenceOriginal}
                  sourceHref={`/memory/view/${encodeURI(series.points[0].sourcePath)}`}
                  locale={locale}
                />
              )}
            </div>
          ))}
          <a
            href={m.visualization.mapHref}
            className="inline-block text-xs text-[var(--color-muted)] underline hover:text-[var(--color-foreground)]"
          >
            {locale === "de" ? "Auf der Gesundheitskarte vergrößern" : "Ampliar en el mapa de salud"} →
          </a>
        </div>
      )}

      {m.citations.length > 0 && (
        <div className="max-w-[96%] sm:max-w-[90%]">
          <button
            onClick={() => setShowCitations((v) => !v)}
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
          >
            <span
              className="inline-block transition-transform duration-200"
              style={{ transform: showCitations ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              ▶
            </span>
            {t.sources} ({m.citations.length})
          </button>

          {showCitations && (
            <div className="mt-2 grid sm:grid-cols-2 gap-2">
              {m.citations.map((c, i) => (
                <CitationCard key={i} c={c} locale={locale} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
