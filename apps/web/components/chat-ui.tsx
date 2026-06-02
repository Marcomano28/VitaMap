"use client";

import { useEffect, useRef, useState } from "react";
import { MarkdownView } from "./markdown-view";
import { CitationCard } from "./citation-card";
import { InlineDisclaimer } from "./disclaimer";
import { copy, type Locale } from "@/lib/i18n";

interface Citation {
  source: "personal" | "evidence";
  title: string;
  path: string;
  score: number;
  evidenceLevel?: string;
  sourceUrl?: string | null;
  observedAt?: string;
}

interface AssistantMessage {
  role: "assistant";
  content: string;
  citations: Citation[];
  guardrail: { verdict: "safe" | "rewrite" | "block"; flags?: string[] };
}

interface UserMessage {
  role: "user";
  content: string;
}

type Message = UserMessage | AssistantMessage;

const HISTORY_FOR_LLM = 10; // últimos N mensajes que enviamos al LLM

export function ChatUI({ locale = "es" }: { locale?: Locale }) {
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
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: nextHistory
            .slice(-HISTORY_FOR_LLM - 1, -1) // sin el actual
            .map((m) => ({ role: m.role, content: m.content })),
        }),
        credentials: "same-origin",
      });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login?next=/chat";
          return;
        }
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as {
        text: string;
        citations: Citation[];
        guardrail: { verdict: "safe" | "rewrite" | "block"; flags?: string[] };
      };
      setMessages([
        ...nextHistory,
        {
          role: "assistant",
          content: json.text,
          citations: json.citations,
          guardrail: json.guardrail,
        },
      ]);
    } catch (err) {
      setError(String(err).slice(0, 300));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 pr-2"
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
        className="mt-4 flex items-end gap-2 border-t border-[var(--color-border)] pt-4"
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
          className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none"
        />
        <button
          type="submit"
          disabled={loading || input.trim().length === 0}
          className="rounded-md bg-[var(--color-foreground)] text-[var(--color-background)] px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
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
      <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[var(--color-foreground)] text-[var(--color-background)] px-4 py-2 text-sm whitespace-pre-wrap">
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

  return (
    <div className="space-y-3">
      <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-[var(--color-card)] border border-[var(--color-border)] px-4 py-3">
        {(blocked || rewritten) && (
          <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted)] mb-2">
            {blocked ? t.blocked : t.rewritten}
          </p>
        )}
        <MarkdownView content={m.content} />
        <InlineDisclaimer locale={locale} />
      </div>

      {m.citations.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
            {t.sources} ({m.citations.length})
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {m.citations.map((c, i) => (
              <CitationCard key={i} c={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
