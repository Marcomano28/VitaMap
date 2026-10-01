import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";

// Texto revisado 2026-09-30: sin afirmaciones rebatibles en el contexto alemán
// (el Check-up 35 existe y la GKV paga la detección precoz). El centro del
// argumento es la continuidad y la comprensión de los propios datos.
const SOURCE_URL =
  "https://www.aerzteblatt.de/archiv/frueherkennung-jeder-vierte-berechtigte-nutzt-check-up-35-32d26845-c561-4969-96c7-3df2d52563fc";

const TEXT = {
  es: {
    metadata: "Por qué construimos VitaMap · VitaWende",
    title: "Por qué construimos VitaMap",
    lead:
      "En Alemania, los coches pasan la revisión técnica cada dos años. Para las personas existe el Check-up 35: cada tres años, y lo usa aproximadamente una de cada cuatro.",
    paragraphs: [
      "Y lo que se detecta ahí, en la consulta de cabecera, en el laboratorio o en el hospital, queda disperso en cartas, PDF y carpetas. Rara vez en un lugar donde pueda leerse en conjunto.",
      "El sistema sanitario es fuerte cuando alguien ya está enfermo. Lo es menos a la hora de acompañar a las personas, a lo largo de los años, para que entiendan su propio estado antes de que ocurra algo.",
      "VitaMap trabaja justo ahí. Guarda tus propios informes cifrados en un servidor bajo control, los ordena en el tiempo y te ayuda a entenderlos: con fuentes citadas y sin diagnósticos. Para llegar mejor preparado a la próxima consulta.",
      "Detrás hay una pregunta más amplia: ¿cómo sería una prevención que acompañe a las personas durante años y no en citas aisladas, basada en la evidencia, accesible para todos y con los datos en manos de cada uno? Con el nombre VitaWende pensamos en cómo podrían ser esos lugares. Es una visión, no una oferta.",
    ],
    notTitle: "Lo que VitaWende no es:",
    notItems: [
      "No es un movimiento de medicina alternativa.",
      "No es un partido ni tiene posición sobre ningún otro tema.",
      "No es una empresa que vende salud.",
      "No promete resultados extraordinarios.",
    ],
    question:
      "Tiene una pregunta concreta: pagamos pruebas de detección precoz, pero ¿quién ayuda a las personas a reunir sus resultados a lo largo de los años y a entenderlos?",
    note:
      "VitaMap funciona con independencia de esa visión. Quien quiera pensar en la pregunta más amplia la encontrará en VitaWende; quien no, tiene en VitaMap todo lo que necesita.",
    source:
      "Uso del Check-up 35: análisis de la Techniker Krankenkasse para 2017 (24,8 % de las personas con derecho), publicado en el Deutsches Ärzteblatt.",
    centers: "Los centros →",
    seed: "← La semilla",
  },
  de: {
    metadata: "Warum wir VitaMap bauen · VitaWende",
    title: "Warum wir VitaMap bauen",
    lead:
      "Autos müssen alle zwei Jahre zur Hauptuntersuchung. Für Menschen gibt es den Check-up 35 – alle drei Jahre, genutzt von etwa jedem Vierten.",
    paragraphs: [
      "Und was dort, beim Hausarzt, im Labor oder in der Klinik festgestellt wird, liegt verstreut in Briefen, PDFs und Ordnern – selten dort, wo man es im Zusammenhang lesen kann.",
      "Das Gesundheitssystem ist stark, wenn jemand bereits krank ist. Weniger stark ist es darin, Menschen über die Jahre dabei zu begleiten, ihren eigenen Zustand zu verstehen, bevor etwas geschieht.",
      "VitaMap setzt genau hier an: Es bewahrt die eigenen Befunde verschlüsselt auf einem kontrollierten Server auf, ordnet sie über die Zeit und hilft, sie zu verstehen – mit Quellenangaben, ohne Diagnosen. Damit man besser vorbereitet ins nächste Arztgespräch geht.",
      "Dahinter steht eine größere Frage: Wie sähe Vorsorge aus, die Menschen über Jahre begleitet statt in Einzelterminen – evidenzbasiert, für alle zugänglich, mit den Daten in der Hand der Betroffenen? Unter dem Namen VitaWende denken wir darüber nach, wie solche Orte aussehen könnten. Das ist eine Vision, kein Angebot.",
    ],
    notTitle: "Was VitaWende nicht ist:",
    notItems: [
      "Keine Bewegung für Alternativmedizin.",
      "Keine Partei und keine Position zu anderen politischen Fragen.",
      "Kein Unternehmen, das Gesundheit verkauft.",
      "Kein Versprechen außergewöhnlicher Ergebnisse.",
    ],
    question:
      "VitaWende stellt eine konkrete Frage: Früherkennung wird bezahlt – aber wer hilft Menschen, ihre Befunde über die Jahre zusammenzuführen und zu verstehen?",
    note:
      "VitaMap funktioniert unabhängig von dieser Vision. Wer sich für die größere Frage interessiert, findet sie in VitaWende; wer nicht, hat mit VitaMap alles, was er braucht.",
    source:
      "Nutzung des Check-up 35: Auswertung der Techniker Krankenkasse für 2017 (24,8 % der Berechtigten), berichtet im Deutschen Ärzteblatt.",
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
        <p className="text-xs text-[var(--color-muted)]">
          <a href={SOURCE_URL} className="underline underline-offset-2 hover:text-[var(--color-foreground)]" rel="noopener noreferrer" target="_blank">
            {t.source}
          </a>
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
