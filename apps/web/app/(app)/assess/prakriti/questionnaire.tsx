"use client";

import { useState } from "react";
import type { Dosha, PrakritiItem } from "@/lib/prakriti";
import { savePrakritiAction } from "./actions";

interface QuestionnaireText {
  question: string;
  of: string;
  sections: {
    physical: string;
    physiological: string;
    behavioral: string;
  };
  chooseClosest: string;
  secondaryQ: string;
  secondaryHint: string;
  secondaryNone: string;
  previous: string;
  next: string;
  reviewTitle: string;
  reviewIntro: string;
  date: string;
  notes: string;
  notesPlaceholder: string;
  save: string;
}

interface PrakritiQuestionnaireProps {
  items: PrakritiItem[];
  today: string;
  text: QuestionnaireText;
}

function sectionFor(index: number, sections: QuestionnaireText["sections"]): string {
  if (index < 5) return sections.physical;
  if (index < 11) return sections.physiological;
  return sections.behavioral;
}

export function PrakritiQuestionnaire({
  items,
  today,
  text,
}: PrakritiQuestionnaireProps) {
  const [step, setStep] = useState(0);
  const [primary, setPrimary] = useState<Record<string, Dosha>>({});
  const [secondary, setSecondary] = useState<Record<string, Dosha | null>>({});
  const [observedAt, setObservedAt] = useState(today);
  const [notes, setNotes] = useState("");
  const reviewing = step === items.length;
  const item = items[step];

  function selectPrimary(itemId: string, dosha: Dosha) {
    setPrimary((current) => ({ ...current, [itemId]: dosha }));
    setSecondary((current) => ({
      ...current,
      [itemId]: current[itemId] === dosha ? null : (current[itemId] ?? null),
    }));
  }

  return (
    <form
      action={savePrakritiAction}
      className="space-y-6"
      onSubmit={(event) => {
        if (!reviewing) event.preventDefault();
      }}
    >
      {items.map((answerItem) => (
        <div key={answerItem.id}>
          <input
            type="hidden"
            name={`q_${answerItem.id}`}
            value={primary[answerItem.id] ?? ""}
          />
          <input
            type="hidden"
            name={`q_${answerItem.id}_sec`}
            value={secondary[answerItem.id] ?? "none"}
          />
        </div>
      ))}

      {!reviewing && item ? (
        <section className="space-y-5" aria-labelledby={`question-${item.id}`}>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs text-[var(--color-muted)]">
              <span>{sectionFor(step, text.sections)}</span>
              <span>
                {text.question} {step + 1} {text.of} {items.length}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-[var(--color-card)]"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={items.length}
              aria-valuenow={step + 1}
            >
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-[width]"
                style={{ width: `${((step + 1) / items.length) * 100}%` }}
              />
            </div>
          </div>

          <fieldset className="space-y-3">
            <legend id={`question-${item.id}`} className="text-lg font-semibold">
              {item.prompt}
            </legend>
            <p className="text-sm text-[var(--color-muted)]">{text.chooseClosest}</p>
            <div className="grid gap-2">
              {item.options.map((option) => {
                const checked = primary[item.id] === option.dosha;
                return (
                  <label
                    key={option.dosha}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 text-sm transition ${
                      checked
                        ? "border-[var(--color-accent)] bg-[var(--color-card)]"
                        : "border-[var(--color-border)] hover:bg-[var(--color-card)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`primary_${item.id}`}
                      value={option.dosha}
                      checked={checked}
                      onChange={() => selectPrimary(item.id, option.dosha)}
                      className="mt-0.5"
                    />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {primary[item.id] ? (
            <fieldset className="space-y-3 rounded-md border border-dashed border-[var(--color-border)] p-4">
              <legend className="px-1 text-sm font-medium">{text.secondaryQ}</legend>
              <p className="text-xs text-[var(--color-muted)]">{text.secondaryHint}</p>
              <div className="grid gap-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 text-sm">
                  <input
                    type="radio"
                    name={`secondary_${item.id}`}
                    value="none"
                    checked={!secondary[item.id]}
                    onChange={() =>
                      setSecondary((current) => ({ ...current, [item.id]: null }))
                    }
                    className="mt-0.5"
                  />
                  <span>{text.secondaryNone}</span>
                </label>
                {item.options
                  .filter((option) => option.dosha !== primary[item.id])
                  .map((option) => {
                    const checked = secondary[item.id] === option.dosha;
                    return (
                      <label
                        key={option.dosha}
                        className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm transition ${
                          checked
                            ? "border-[var(--color-accent)] bg-[var(--color-card)]"
                            : "border-[var(--color-border)] hover:bg-[var(--color-card)]"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`secondary_${item.id}`}
                          value={option.dosha}
                          checked={checked}
                          onChange={() =>
                            setSecondary((current) => ({
                              ...current,
                              [item.id]: option.dosha,
                            }))
                          }
                          className="mt-0.5"
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
              </div>
            </fieldset>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              disabled={step === 0}
              className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[var(--color-card)]"
            >
              {text.previous}
            </button>
            <button
              type="button"
              onClick={() => setStep((current) => Math.min(items.length, current + 1))}
              disabled={!primary[item.id]}
              className="rounded-md bg-[var(--color-foreground)] px-4 py-2 text-sm font-medium text-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-90"
            >
              {text.next}
            </button>
          </div>
        </section>
      ) : (
        <section className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{text.reviewTitle}</h2>
            <p className="text-sm text-[var(--color-muted)]">{text.reviewIntro}</p>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="prakriti-observed-at"
              className="text-xs uppercase tracking-wide text-[var(--color-muted)]"
            >
              {text.date}
            </label>
            <input
              id="prakriti-observed-at"
              type="date"
              name="observed_at"
              value={observedAt}
              onChange={(event) => setObservedAt(event.target.value)}
              required
              className="block rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="prakriti-notes"
              className="text-xs uppercase tracking-wide text-[var(--color-muted)]"
            >
              {text.notes}
            </label>
            <textarea
              id="prakriti-notes"
              name="notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              placeholder={text.notesPlaceholder}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(items.length - 1)}
              className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-card)]"
            >
              {text.previous}
            </button>
            <button
              type="submit"
              className="rounded-md bg-[var(--color-foreground)] px-4 py-2 text-sm font-medium text-[var(--color-background)] hover:opacity-90"
            >
              {text.save}
            </button>
          </div>
        </section>
      )}
    </form>
  );
}
