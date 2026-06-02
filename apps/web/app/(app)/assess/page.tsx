import Link from "next/link";

export const metadata = { title: "Escalas validadas" };

const INSTRUMENTS = [
  {
    slug: "phq-9",
    title: "PHQ-9",
    description: "Cuestionario de salud del paciente — depresión. 9 ítems, 5 min.",
  },
  {
    slug: "gad-7",
    title: "GAD-7",
    description: "Cuestionario de ansiedad generalizada. 7 ítems, 4 min.",
  },
];

export default function AssessLandingPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Escalas validadas</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Cuestionarios estandarizados que producen una puntuación
          comparable en el tiempo. Las respuestas se guardan en tu memoria.
        </p>
      </div>

      <ul className="grid sm:grid-cols-2 gap-3">
        {INSTRUMENTS.map((i) => (
          <li key={i.slug}>
            <Link
              href={`/assess/${i.slug}`}
              className="block rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-4 hover:border-[var(--color-accent)] transition"
            >
              <p className="font-medium">{i.title}</p>
              <p className="text-sm text-[var(--color-muted)] mt-1">
                {i.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
