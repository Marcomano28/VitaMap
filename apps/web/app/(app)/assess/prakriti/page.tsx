import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";
import { requireSubscribedUserId } from "@/lib/subscription-access";
import { assessmentsEnabled } from "@/lib/flags";
import { getPrakritiItems, PROVENANCE } from "@/lib/prakriti";
import { PrakritiQuestionnaire } from "./questionnaire";

const TEXT = {
  es: {
    metadata: "Constitución (Ayurveda)",
    title: "Tu constitución según el Ayurveda",
    intro:
      "Responde pensando en cómo eres habitualmente, no solo en cómo te sientes hoy. Al terminar verás qué grupos de rasgos aparecen con más frecuencia en tus respuestas.",
    disclaimer:
      "Es un retrato tradicional para autoconocimiento, no un diagnóstico médico. No mide ni predice ningún valor de laboratorio.",
    question: "Pregunta",
    of: "de",
    sections: {
      physical: "Características físicas",
      physiological: "Funciones corporales",
      behavioral: "Hábitos y forma de reaccionar",
    },
    chooseClosest:
      "Elige la descripción que más se acerque a ti. No es necesario que coincidan todos los detalles.",
    date: "Fecha",
    notes: "Notas (opcional)",
    notesPlaceholder: "Cualquier matiz que quieras recordar.",
    save: "Guardar y ver mi resultado",
    secondaryQ: "¿Hay otra descripción que también se parece a ti?",
    secondaryHint: "Es opcional. Elige una segunda solo si representa una parte importante de ti.",
    secondaryNone: "No, la primera es suficiente",
    previous: "Anterior",
    next: "Siguiente",
    reviewTitle: "Ya has respondido las 20 preguntas",
    reviewIntro:
      "Puedes volver a la pregunta anterior para revisar tus respuestas. Cuando guardes, verás una explicación de tu perfil.",
  },
  de: {
    metadata: "Konstitution (Ayurveda)",
    title: "Deine Konstitution nach dem Ayurveda",
    intro:
      "Antworte danach, wie du normalerweise bist, nicht nur danach, wie du dich heute fühlst. Am Ende siehst du, welche Merkmalsgruppen in deinen Antworten am häufigsten vorkommen.",
    disclaimer:
      "Ein traditionelles Selbstbild zur Selbsterkenntnis, keine medizinische Diagnose. Es misst oder prognostiziert keinen Laborwert.",
    question: "Frage",
    of: "von",
    sections: {
      physical: "Körperliche Merkmale",
      physiological: "Körperfunktionen",
      behavioral: "Gewohnheiten und Reaktionen",
    },
    chooseClosest:
      "Wähle die Beschreibung, die dir am nächsten kommt. Nicht jedes Detail muss zutreffen.",
    date: "Datum",
    notes: "Notizen (optional)",
    notesPlaceholder: "Jede Nuance, die du festhalten möchtest.",
    save: "Speichern und Ergebnis ansehen",
    secondaryQ: "Passt eine weitere Beschreibung ebenfalls zu dir?",
    secondaryHint: "Optional. Wähle eine zweite nur, wenn sie einen wichtigen Teil von dir beschreibt.",
    secondaryNone: "Nein, die erste reicht aus",
    previous: "Zurück",
    next: "Weiter",
    reviewTitle: "Du hast alle 20 Fragen beantwortet",
    reviewIntro:
      "Du kannst zur vorherigen Frage zurückgehen und deine Antworten prüfen. Nach dem Speichern erhältst du eine Erklärung deines Profils.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).metadata };
}

export default async function PrakritiForm() {
  if (!assessmentsEnabled()) notFound();
  await requireSubscribedUserId();
  const locale = await getLocale();
  const t = localize(locale, TEXT);
  const items = getPrakritiItems(locale);
  const provenance = localize(locale, PROVENANCE);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-[var(--color-muted)]">{t.intro}</p>
        <p className="rounded-md border-l-4 border-[var(--color-accent)] bg-[var(--color-card)] px-3 py-2 text-sm">
          {t.disclaimer}
        </p>
      </header>

      <PrakritiQuestionnaire items={items} today={today} text={t} />
      <p className="text-xs text-[var(--color-muted)]">{provenance}</p>
    </div>
  );
}
