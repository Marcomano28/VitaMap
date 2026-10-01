import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";

const TEXT = {
  es: {
    metadata: "Los centros · VitaWende",
    title: "Los centros de salud integral",
    intro:
      "No son hospitales. No son balnearios. Son un tercer tipo de lugar: el que todavía no existe pero cuya geometría ya está trazada. Esta página describe un concepto, no un servicio disponible.",
    conditions: "Dos condiciones deliberadas",
    cards: [
      {
        title: "Infraestructura técnica",
        body: "Laboratorio completo, diagnóstico por imagen y diagnóstico funcional, elegidos según la evidencia y la edad de cada persona. Otros marcos de observación, como la medicina tradicional china o el Ayurveda, podrían tener un lugar opcional, siempre con su nivel de evidencia indicado con claridad.",
      },
      {
        title: "Entorno natural",
        body: "Ubicación en bosque, montaña o costa. No por estética, sino porque el proceso de conocerse requiere tiempo y quietud. El entorno es parte del protocolo, no un accesorio.",
      },
    ],
    visit: "Una visita",
    steps: [
      "Llegada y entrevista de contexto. Si usas VitaMap, tu historial ya está organizado y puedes compartirlo en ese momento.",
      "Análisis completo: laboratorio, imagen, diagnóstico funcional y, si la persona lo desea, marcos de observación complementarios.",
      "Lectura cruzada del equipo interdisciplinar. No para diagnosticar, sino para leer el conjunto desde marcos distintos.",
      "Un informe que te llevas. Los datos vuelven a VitaMap si lo autorizas. Lo que el centro genera en un día, VitaMap lo mantiene los 364 días restantes.",
    ],
    sameProject:
      "VitaMap y los centros son el mismo proyecto visto a distancias distintas.",
    sameProjectBody:
      "VitaMap es el lugar personal de la relación cotidiana con el propio cuerpo. Los centros le dan a ese lugar un marco y una escala mayores. Uno sin el otro queda incompleto.",
    enter: "Entrar a VitaMap",
    manifesto: "← Por qué VitaMap",
  },
  de: {
    metadata: "Die Zentren · VitaWende",
    title: "Zentren für umfassende Vorsorge",
    intro:
      "Sie sind weder Krankenhäuser noch Wellnessanlagen. Sie bilden eine dritte Art von Ort: noch nicht gebaut, aber in ihrer Grundstruktur bereits erkennbar. Diese Seite beschreibt ein Konzept, kein bestehendes Angebot.",
    conditions: "Zwei bewusste Bedingungen",
    cards: [
      {
        title: "Technische Infrastruktur",
        body: "Umfassendes Labor, Bildgebung und Funktionsdiagnostik – ausgewählt nach Evidenz und Lebensalter. Andere Beobachtungsrahmen wie Traditionelle Chinesische Medizin oder Ayurveda könnten optional einen Platz haben, stets mit klar gekennzeichnetem Evidenzstand.",
      },
      {
        title: "Natürliche Umgebung",
        body: "Ein Standort im Wald, in den Bergen oder an der Küste. Nicht aus ästhetischen Gründen, sondern weil Selbsterkenntnis Zeit und Ruhe benötigt. Die Umgebung ist Teil des Protokolls, kein Zubehör.",
      },
    ],
    visit: "Ein Besuch",
    steps: [
      "Ankunft und Kontextgespräch. Wenn du VitaMap nutzt, ist deine Geschichte bereits geordnet und kann mit deiner Zustimmung geteilt werden.",
      "Umfassende Untersuchung: Labor, Bildgebung, Funktionsdiagnostik und – falls gewünscht – ergänzende Beobachtungsrahmen.",
      "Gemeinsame Betrachtung durch ein interdisziplinäres Team. Nicht um zu diagnostizieren, sondern um das Ganze aus verschiedenen Perspektiven zu lesen.",
      "Ein Bericht, den du mitnimmst. Mit deiner Zustimmung fließen die Daten zurück in VitaMap. Was das Zentrum an einem Tag erzeugt, begleitet VitaMap an den übrigen 364 Tagen.",
    ],
    sameProject:
      "VitaMap und die Zentren sind dasselbe Projekt aus unterschiedlicher Entfernung betrachtet.",
    sameProjectBody:
      "VitaMap ist der persönliche Ort der täglichen Verbindung mit dem eigenen Körper. Die Zentren geben diesem Ort einen größeren Rahmen und Maßstab. Ohne das jeweils andere bleibt beides unvollständig.",
    enter: "VitaMap öffnen",
    manifesto: "← Warum VitaMap",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).metadata };
}

export default async function CentrosPage() {
  const locale = await getLocale();
  const t = localize(locale, TEXT);
  return (
    <div className="max-w-2xl space-y-10 py-4">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
          VitaWende
        </p>
        <h1 className="text-3xl font-semibold leading-snug">
          {t.title}
        </h1>
        <p className="text-[var(--color-muted)]">
          {t.intro}
        </p>
      </header>

      <section className="space-y-8">
        <div className="space-y-3">
          <h2 className="font-medium">{t.conditions}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {t.cards.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-2"
              >
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-sm text-[var(--color-muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-medium">{t.visit}</h2>
          <ol className="space-y-3 text-sm text-[var(--color-muted)]">
            {t.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full border border-[var(--color-border)] flex items-center justify-center text-xs">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-sm text-[var(--color-muted)] space-y-1">
          <p className="font-medium text-[var(--color-foreground)]">
            {t.sameProject}
          </p>
          <p>
            {t.sameProjectBody}
          </p>
        </div>
      </section>

      <footer className="flex gap-4 text-sm pt-2">
        <Link
          href="/register"
          className="rounded-md bg-[var(--color-foreground)] text-[var(--color-background)] px-4 py-2 text-sm font-medium hover:opacity-90 transition"
        >
          {t.enter}
        </Link>
        <Link
          href="/manifiesto"
          className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition self-center"
        >
          {t.manifesto}
        </Link>
      </footer>
    </div>
  );
}
