import { notFound } from "next/navigation";
import { saveAssessmentAction } from "./actions";

export const metadata = { title: "Cuestionario" };

const PHQ9_QUESTIONS = [
  "Poco interés o placer en hacer las cosas",
  "Sentirse desanimado/a, deprimido/a o sin esperanza",
  "Dificultad para dormir, mantener el sueño o dormir demasiado",
  "Sentirse cansado/a o con poca energía",
  "Poco apetito o comer en exceso",
  "Sentirse mal consigo mismo/a — sentir que ha sido un fracaso o se ha decepcionado a sí mismo/a o a su familia",
  "Dificultad para concentrarse en cosas como leer el periódico o ver la televisión",
  "Moverse o hablar tan despacio que otras personas lo han notado — o lo contrario, estar tan inquieto/a que se mueve más de lo habitual",
  "Pensamientos de que estaría mejor muerto/a o de hacerse daño de alguna forma",
];

const GAD7_QUESTIONS = [
  "Sentirse nervioso/a, ansioso/a o muy alterado/a",
  "No ser capaz de parar o controlar la preocupación",
  "Preocuparse demasiado por diferentes cosas",
  "Tener dificultad para relajarse",
  "Estar tan inquieto/a que es difícil quedarse quieto/a",
  "Volverse fácilmente molesto/a o irritable",
  "Sentir miedo como si algo terrible pudiera pasar",
];

const OPTIONS = [
  { value: 0, label: "Ningún día" },
  { value: 1, label: "Varios días" },
  { value: 2, label: "Más de la mitad de los días" },
  { value: 3, label: "Casi todos los días" },
];

interface PageProps {
  params: Promise<{ instrument: string }>;
}

export default async function AssessmentForm({ params }: PageProps) {
  const { instrument: slug } = await params;
  const cfg = pickInstrument(slug);
  if (!cfg) notFound();

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{cfg.label}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {cfg.intro} En las últimas <strong>2 semanas</strong>, ¿con qué
          frecuencia te ha molestado cada uno de los siguientes problemas?
        </p>
      </header>

      <form action={saveAssessmentAction} className="space-y-6">
        <input type="hidden" name="instrument" value={cfg.label} />

        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
            Fecha
          </label>
          <input
            type="date"
            name="observed_at"
            defaultValue={today}
            required
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1 text-sm"
          />
        </div>

        <ol className="space-y-5">
          {cfg.questions.map((q, idx) => (
            <li key={idx} className="space-y-2 border-l-2 border-[var(--color-border)] pl-4">
              <p className="text-sm font-medium">
                {idx + 1}. {q}
              </p>
              <div className="grid sm:grid-cols-4 gap-2">
                {OPTIONS.map((o) => (
                  <label
                    key={o.value}
                    className="flex items-center gap-2 rounded border border-[var(--color-border)] px-3 py-2 text-sm cursor-pointer hover:bg-[var(--color-card)]"
                  >
                    <input
                      type="radio"
                      name={`q${idx + 1}`}
                      value={o.value}
                      defaultChecked={o.value === 0}
                      required
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ol>

        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
            Notas (opcional)
          </label>
          <textarea
            name="notes"
            rows={3}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            placeholder="Contexto que quieras recordar (estrés en el trabajo, dormir mal esta semana, etc.)"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-[var(--color-foreground)] text-[var(--color-background)] px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Guardar en mi memoria
        </button>
      </form>
    </div>
  );
}

function pickInstrument(slug: string) {
  if (slug === "phq-9")
    return {
      label: "PHQ-9" as const,
      intro: "Cuestionario validado de cribado de depresión.",
      questions: PHQ9_QUESTIONS,
    };
  if (slug === "gad-7")
    return {
      label: "GAD-7" as const,
      intro: "Cuestionario validado de cribado de ansiedad generalizada.",
      questions: GAD7_QUESTIONS,
    };
  return null;
}
