import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = { title: "Resultado" };

interface PageProps {
  params: Promise<{ instrument: string }>;
  searchParams: Promise<{ score?: string; q9?: string }>;
}

function phq9Band(score: number) {
  if (score <= 4) return "mínima";
  if (score <= 9) return "leve";
  if (score <= 14) return "moderada";
  if (score <= 19) return "moderadamente severa";
  return "severa";
}

function gad7Band(score: number) {
  if (score <= 4) return "mínima";
  if (score <= 9) return "leve";
  if (score <= 14) return "moderada";
  return "severa";
}

export default async function ResultPage({ params, searchParams }: PageProps) {
  const { instrument } = await params;
  const sp = await searchParams;
  const score = Number(sp.score ?? "0");
  const q9 = Number(sp.q9 ?? "0");

  const cfg =
    instrument === "phq-9"
      ? { label: "PHQ-9", max: 27, band: phq9Band(score) }
      : instrument === "gad-7"
        ? { label: "GAD-7", max: 21, band: gad7Band(score) }
        : null;
  if (!cfg) notFound();

  const showSupportNote = instrument === "phq-9" && q9 > 0;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Resultado {cfg.label}</h1>
      </header>

      <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-2">
        <p className="text-sm uppercase tracking-wide text-[var(--color-muted)]">
          Puntuación
        </p>
        <p className="text-4xl font-semibold">
          {score} <span className="text-base text-[var(--color-muted)]">/ {cfg.max}</span>
        </p>
        <p className="text-sm text-[var(--color-muted)]">
          Banda orientativa: <strong>{cfg.band}</strong>.
        </p>
      </section>

      <p className="text-sm">
        El resultado se ha guardado en tu memoria como una observación. La
        puntuación aislada tiene valor limitado; lo útil es ver su
        evolución a lo largo del tiempo y conversarlo con un profesional
        cuando corresponda.
      </p>

      {showSupportNote && (
        <section className="rounded-md border-l-4 border-[var(--color-warning)] bg-[var(--color-card)] p-4 text-sm">
          <p>
            En la pregunta 9 has señalado pensamientos de hacerte daño o
            de estar mejor sin estar aquí. Si te están preocupando, hablar
            con un profesional sanitario o con una línea de apoyo puede
            ayudar.
          </p>
          <p className="mt-2">
            En España: <strong>024</strong> (atención a la conducta
            suicida, 24/7). En otros países, busca el equivalente local.
          </p>
        </section>
      )}

      <div className="flex gap-3">
        <Link
          href="/memory"
          className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-card)]"
        >
          Ver mi memoria
        </Link>
        <Link
          href="/assess"
          className="text-sm self-center text-[var(--color-muted)] hover:underline"
        >
          Otro cuestionario
        </Link>
      </div>
    </div>
  );
}
