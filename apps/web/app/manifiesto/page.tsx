import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";

const TEXT = {
  es: {
    metadata: "Manifiesto · VitaWende",
    title: "Manifiesto",
    lead:
      "En Alemania, los coches tienen una revisión técnica obligatoria cada dos años. Las personas, no.",
    paragraphs: [
      "No es que sea imposible organizarlo. Es que nadie lo ha propuesto todavía como un derecho concreto, financiado y accesible para todos.",
      "El sistema sanitario funciona razonablemente bien cuando uno ya está enfermo. Funciona mucho peor cuando uno quiere saber cómo está antes de estarlo.",
      "VitaMap es la herramienta personal que ya existe hoy. Guarda tu historial cifrado en un servidor bajo tu control. Un asistente lee ese historial y la evidencia científica, responde citando siempre la fuente, y no diagnostica.",
      "VitaWende es el marco mayor. La promesa de que lo que VitaMap hace para quien lo busca por su cuenta debería existir como derecho para todos, respaldado por centros de salud integral donde cada ciudadano pueda recibir, una vez al año, un mapa real de su estado de salud.",
    ],
    notTitle: "Lo que VitaWende no es:",
    notItems: [
      "No es un movimiento de medicina alternativa.",
      "No es un partido ni tiene posición sobre ningún otro tema.",
      "No es una empresa que vende salud.",
      "No promete resultados extraordinarios.",
    ],
    question:
      "Tiene una pregunta concreta: ¿por qué el Estado financia el tratamiento de enfermedades que podrían haberse detectado antes, y no financia la detección?",
    note:
      "Quien quiera ir más allá de usar la herramienta encontrará en VitaWende la forma de hacerlo. Quien no quiera, tiene igualmente todo lo que necesita.",
    centers: "Los centros →",
    seed: "← La semilla",
  },
  de: {
    metadata: "Manifest · VitaWende",
    title: "Manifest",
    lead:
      "In Deutschland müssen Autos alle zwei Jahre zur Hauptuntersuchung. Menschen nicht.",
    paragraphs: [
      "Nicht weil es unmöglich wäre, dies zu organisieren. Bislang wurde es nur nicht als konkretes, finanziertes und für alle zugängliches Recht vorgeschlagen.",
      "Das Gesundheitssystem funktioniert vergleichsweise gut, wenn ein Mensch bereits krank ist. Es funktioniert deutlich schlechter, wenn jemand wissen möchte, wie es ihm geht, bevor er krank wird.",
      "VitaMap ist das persönliche Werkzeug, das schon heute existiert. Es speichert deine Geschichte verschlüsselt auf einem kontrollierten Server. Ein Assistent liest diese Geschichte und wissenschaftliche Evidenz, nennt seine Quellen und stellt keine Diagnosen.",
      "VitaWende ist der größere Rahmen. Was VitaMap einzelnen Menschen auf eigene Initiative ermöglicht, sollte als Recht für alle bestehen: getragen von Zentren für ganzheitliche Gesundheit, in denen jeder Mensch einmal im Jahr eine wirkliche Karte seines Gesundheitszustands erhalten kann.",
    ],
    notTitle: "Was VitaWende nicht ist:",
    notItems: [
      "Keine Bewegung für Alternativmedizin.",
      "Keine Partei und keine Position zu anderen politischen Fragen.",
      "Kein Unternehmen, das Gesundheit verkauft.",
      "Kein Versprechen außergewöhnlicher Ergebnisse.",
    ],
    question:
      "VitaWende stellt eine konkrete Frage: Warum finanziert der Staat die Behandlung von Krankheiten, die früher hätten erkannt werden können, aber nicht ihre frühzeitige Erkennung?",
    note:
      "Wer über die Nutzung des Werkzeugs hinausgehen möchte, findet dazu in VitaWende einen Weg. Wer das nicht möchte, erhält mit VitaMap dennoch alles, was er benötigt.",
    centers: "Die Zentren →",
    seed: "← Der Samen",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).metadata };
}

export default async function ManifiestoPage() {
  const locale = await getLocale();
  const t = localize(locale, TEXT);
  return (
    <div className="max-w-2xl space-y-10 py-4">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
          VitaWende
        </p>
        <h1 className="text-3xl font-semibold leading-snug">{t.title}</h1>
      </header>

      <section className="space-y-5 text-[var(--color-muted)] leading-relaxed">
        <p className="text-[var(--color-foreground)] text-lg">
          {t.lead}
        </p>
        <p>{t.paragraphs[0]}</p>
        <p>{t.paragraphs[1]}</p>

        <hr className="border-[var(--color-border)]" />

        <p>{t.paragraphs[2]}</p>
        <p>{t.paragraphs[3]}</p>

        <hr className="border-[var(--color-border)]" />

        <div className="space-y-3">
          <p className="font-medium text-[var(--color-foreground)]">
            {t.notTitle}
          </p>
          <ul className="space-y-1 text-sm list-none pl-0">
            {t.notItems.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[var(--color-border)]">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p>{t.question}</p>
        <p className="text-xs text-[var(--color-muted)] italic">
          {t.note}
        </p>
      </section>

      <footer className="flex gap-4 text-sm pt-2">
        <Link
          href="/centros"
          className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
        >
          {t.centers}
        </Link>
        <Link
          href="/semilla"
          className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
        >
          {t.seed}
        </Link>
      </footer>
    </div>
  );
}
