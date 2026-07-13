"use client";

import { useEffect, useRef, useState } from "react";
import { MarkdownView } from "./markdown-view";
import { CitationCard } from "./citation-card";
import { InlineDisclaimer } from "./disclaimer";
import { LabTimeline } from "./lab-timeline";
import { LabValueBand } from "./lab-value-band";
import { copy, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import type { LabSeries } from "@/lib/lab-visualization";

type EditorialDepth = "discover" | "understand" | "deep";

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

interface CuriosityCardData {
  id: string;
  title: string;
  body: string;
  sourceUrl: string;
  publicationDate?: string;
  limitations: string[];
  markers: string[];
  related: boolean;
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
  request: string;
  depth: EditorialDepth;
  editorialComposed?: boolean;
  topics?: string[];
  curiosityOpened?: boolean;
}

interface UserMessage {
  role: "user";
  content: string;
}

interface CuriosityMessage {
  role: "curiosity";
  card: CuriosityCardData;
}

type Message = UserMessage | AssistantMessage | CuriosityMessage;

const HISTORY_FOR_LLM = 10; // últimos N mensajes que enviamos al LLM

export function ChatUI({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = copy[locale].chat;
  // El catálogo piloto está redactado en español. No se traduce con el LLM.
  const curiosityEnabled = locale === "es";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [curiosityLoading, setCuriosityLoading] = useState(false);
  const [seenCuriosityIds, setSeenCuriosityIds] = useState<string[]>([]);
  const [depth, setDepth] = useState<EditorialDepth>("understand");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function requestAssistant(
    text: string,
    history: Message[],
    requestedDepth: EditorialDepth,
    forceDepth = false,
  ): Promise<Omit<AssistantMessage, "role" | "request">> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 165_000);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          locale,
          depth: requestedDepth,
          forceDepth,
          history: history
            .filter(
              (m): m is UserMessage | AssistantMessage => m.role !== "curiosity",
            )
            .slice(-HISTORY_FOR_LLM)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
        credentials: "same-origin",
        signal: controller.signal,
      });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login?next=/chat";
          throw new Error(t.requestFailed);
        }
        if (res.status === 402) {
          window.location.href = "/settings/billing?required=1";
          throw new Error(t.requestFailed);
        }
        throw new Error(t.requestFailed);
      }
      const json = (await res.json()) as {
        text: string;
        citations: Citation[];
        guardrail: { verdict: "safe" | "rewrite" | "block"; flags?: string[] };
        crisis?: boolean;
        visualization?: ChatVisualization;
        depth: EditorialDepth;
        editorialComposed?: boolean;
        topics?: string[];
      };
      return {
        content: json.text,
        citations: json.citations,
        guardrail: json.guardrail,
        crisis: json.crisis === true,
        visualization: json.visualization,
        depth: json.depth ?? requestedDepth,
        editorialComposed: json.editorialComposed,
        topics: json.topics ?? [],
      };
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function readableError(err: unknown): string {
    return err instanceof DOMException && err.name === "AbortError"
      ? t.requestTimedOut
      : err instanceof Error && err.message === t.requestFailed
        ? err.message
        : t.requestFailed;
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const history = [...messages];
    const nextHistory: Message[] = [...history, { role: "user", content: text }];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const assistant = await requestAssistant(text, history, depth);
      setDepth(assistant.depth);
      setMessages([
        ...nextHistory,
        { role: "assistant", request: text, ...assistant },
      ]);
    } catch (err) {
      setError(readableError(err));
    } finally {
      setLoading(false);
    }
  }

  async function recompose(messageIndex: number, targetDepth: EditorialDepth) {
    const message = messages[messageIndex];
    if (loading || message?.role !== "assistant" || message.crisis) return;
    setLoading(true);
    setError(null);
    try {
      const historyEnd = Math.max(0, messageIndex - 1);
      const assistant = await requestAssistant(
        message.request,
        messages.slice(0, historyEnd),
        targetDepth,
        true,
      );
      setDepth(assistant.depth);
      setMessages((current) =>
        current.map((item, index) =>
          index === messageIndex
            ? { role: "assistant", request: message.request, ...assistant }
            : item,
        ),
      );
    } catch (err) {
      setError(readableError(err));
    } finally {
      setLoading(false);
    }
  }

  async function openCuriosity(topics: string[], afterIndex?: number) {
    if (curiosityLoading || loading) return;
    setCuriosityLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/curiosity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics, seenIds: seenCuriosityIds }),
        credentials: "same-origin",
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
        throw new Error(res.status === 404 ? t.noCuriosity : t.requestFailed);
      }
      const card = (await res.json()) as CuriosityCardData;
      setSeenCuriosityIds((current) => [...current, card.id]);
      setMessages((current) => {
        const next = current.map((message, index) =>
          index === afterIndex && message.role === "assistant"
            ? { ...message, curiosityOpened: true }
            : message,
        );
        const insertion = afterIndex === undefined ? next.length : afterIndex + 1;
        next.splice(insertion, 0, { role: "curiosity", card });
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.requestFailed);
    } finally {
      setCuriosityLoading(false);
    }
  }

  function exploreCuriosity(title: string) {
    setInput(`${t.exploreCuriosity}: ${title}`);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="vitamap-chat-panel flex flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 pr-1 sm:pr-2"
      >
        {messages.length === 0 && !loading && (
          <div className="space-y-3 text-sm text-[var(--color-muted)] rounded-md border border-dashed border-[var(--color-border)] p-4">
            <p>{t.empty}</p>
            {curiosityEnabled && <button
              type="button"
              disabled={curiosityLoading}
              onClick={() => openCuriosity([])}
              className="text-xs underline hover:text-[var(--color-foreground)] disabled:opacity-50"
            >
              {curiosityLoading ? t.openingCuriosity : t.openCuriosity}
            </button>}
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <UserBubble key={i} content={m.content} />
          ) : m.role === "assistant" ? (
            <AssistantBubble
              key={i}
              m={m}
              locale={locale}
              disabled={loading}
              onDepthChange={(target) => recompose(i, target)}
              onCuriosity={() => openCuriosity(m.topics ?? [], i)}
              curiosityLoading={curiosityLoading}
              curiosityEnabled={curiosityEnabled}
            />
          ) : (
            <CuriosityBubble
              key={`${m.card.id}-${i}`}
              card={m.card}
              locale={locale}
              onClose={() =>
                setMessages((current) => current.filter((_, index) => index !== i))
              }
              onExplore={() => exploreCuriosity(m.card.title)}
            />
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
        <fieldset className="flex shrink-0 gap-1" aria-label={t.depthLabel}>
          {(["discover", "understand", "deep"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={depth === value}
              onClick={() => setDepth(value)}
              disabled={loading}
              className={`rounded-md border px-2 py-2 text-xs transition-colors disabled:opacity-50 ${
                depth === value
                  ? "border-[var(--color-accent)] bg-[var(--color-card)] text-[var(--color-foreground)]"
                  : "border-[var(--color-border)] text-[var(--color-muted)]"
              }`}
            >
              {t.depth[value]}
            </button>
          ))}
        </fieldset>
        <textarea
          ref={inputRef}
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
  disabled,
  onDepthChange,
  onCuriosity,
  curiosityLoading,
  curiosityEnabled,
}: {
  m: AssistantMessage;
  locale: Locale;
  disabled: boolean;
  onDepthChange: (depth: EditorialDepth) => void;
  onCuriosity: () => void;
  curiosityLoading: boolean;
  curiosityEnabled: boolean;
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
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-3">
          <span className="text-xs text-[var(--color-muted)]">
            {t.depthLabel}: {t.depth[m.depth]}
          </span>
          {m.depth !== "discover" && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onDepthChange(m.depth === "deep" ? "understand" : "discover")}
              className="text-xs underline text-[var(--color-muted)] hover:text-[var(--color-foreground)] disabled:opacity-50"
            >
              {t.simpler}
            </button>
          )}
          {m.depth !== "deep" && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onDepthChange(m.depth === "discover" ? "understand" : "deep")}
              className="text-xs underline text-[var(--color-muted)] hover:text-[var(--color-foreground)] disabled:opacity-50"
            >
              {t.moreDetail}
            </button>
          )}
          {curiosityEnabled && !blocked && !m.curiosityOpened && (
            <button
              type="button"
              disabled={disabled || curiosityLoading}
              onClick={onCuriosity}
              className="ml-auto text-xs underline text-[var(--color-muted)] hover:text-[var(--color-foreground)] disabled:opacity-50"
            >
              {curiosityLoading ? t.openingCuriosity : t.openCuriosity}
            </button>
          )}
        </div>
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

function CuriosityBubble({
  card,
  locale,
  onClose,
  onExplore,
}: {
  card: CuriosityCardData;
  locale: Locale;
  onClose: () => void;
  onExplore: () => void;
}) {
  const t = copy[locale].chat;
  return (
    <aside className="max-w-[96%] rounded-2xl border border-[var(--color-accent)]/40 bg-[var(--color-card)] px-4 py-4 sm:max-w-[90%]">
      <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
        {card.related ? t.relatedCuriosity : t.generalCuriosity}
      </p>
      <h3 className="mb-3 font-medium">{card.title}</h3>
      <MarkdownView content={card.body} />
      {card.limitations[0] && (
        <p className="mt-3 text-xs text-[var(--color-muted)]">{card.limitations[0]}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] pt-3 text-xs">
        <a
          href={card.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="underline text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
        >
          {t.curiositySource}{card.publicationDate ? ` · ${card.publicationDate}` : ""}
        </a>
        <button type="button" onClick={onExplore} className="underline">
          {t.exploreThis}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="underline text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
        >
          {t.backToTopic}
        </button>
      </div>
    </aside>
  );
}
