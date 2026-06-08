import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";

const TEXT = {
  es: {
    metadata: "La semilla · VitaWende",
    title: "La semilla y el árbol",
    intro:
      "El trigo sarraceno no es un trigo. Es una planta que aprendió a parecer grano para que la sembraran. Su semilla tiene forma de pirámide de tres caras: la forma más estable que puede adoptar un cuerpo pequeño para ser llevado por el viento y encontrar tierra donde caer de pie.",
    threeFaces: "Esta semilla tiene tres caras. También las tiene VitaWende.",
    faces: [
      {
        title: "Primera cara — el individuo",
        body: "Una persona con su historial. VitaMap es esta cara: la más pequeña, la más íntima, la que toca directamente la palma de la mano. Aquí empieza todo porque aquí es donde todo tiene sentido para alguien concreto: este cuerpo, esta memoria, este momento.",
      },
      {
        title: "Segunda cara — la comunidad",
        body: "Personas que reconocen en la experiencia del otro la propia. Que entienden, al usar la herramienta, que lo que les falta no es mala suerte individual sino ausencia de un derecho que todavía no existe.",
      },
      {
        title: "Tercera cara — el descubrimiento colectivo",
        body: "Cuando suficientes personas han tenido la misma experiencia y se reconocen en ella, lo que cada uno vivió en privado se convierte, sumado, en un argumento compartido. Esa posibilidad existe. No se impone. Se encuentra.",
      },
    ],
    conviction:
      "VitaWende no convence a nadie de nada. Crea las condiciones para que cada persona llegue a su propia convicción a través de su propia experiencia.",
    tree:
      "La semilla no le explica al árbol cómo crecer. Le da el impulso inicial y confía en que la naturaleza hace el resto.",
    manifesto: "Manifiesto →",
    back: "← Volver",
  },
  de: {
    metadata: "Der Samen · VitaWende",
    title: "Der Samen und der Baum",
    intro:
      "Buchweizen ist kein Weizen. Er ist eine Pflanze, die einem Korn ähnlich wurde und deshalb angebaut wurde. Sein Samen hat die Form einer dreiseitigen Pyramide: eine besonders stabile Form für einen kleinen Körper, der vom Wind getragen wird und auf der Erde Halt finden muss.",
    threeFaces: "Dieser Samen hat drei Seiten. VitaWende ebenfalls.",
    faces: [
      {
        title: "Erste Seite — der einzelne Mensch",
        body: "Ein Mensch mit seiner Geschichte. VitaMap ist diese Seite: die kleinste, persönlichste, die unmittelbar in der eigenen Hand liegt. Hier beginnt alles, weil es hier für einen konkreten Menschen Bedeutung erhält: dieser Körper, diese Erinnerung, dieser Augenblick.",
      },
      {
        title: "Zweite Seite — die Gemeinschaft",
        body: "Menschen erkennen in der Erfahrung anderer ihre eigene. Durch die Nutzung des Werkzeugs verstehen sie, dass ihnen nicht wegen persönlichen Pechs etwas fehlt, sondern weil ein Recht noch nicht existiert.",
      },
      {
        title: "Dritte Seite — die gemeinsame Entdeckung",
        body: "Wenn genügend Menschen dieselbe Erfahrung machen und sich darin wiedererkennen, wird das privat Erlebte gemeinsam zu einem geteilten Argument. Diese Möglichkeit besteht. Sie wird nicht aufgezwungen, sondern entdeckt.",
      },
    ],
    conviction:
      "VitaWende will niemanden von etwas überzeugen. Es schafft Bedingungen, unter denen Menschen durch ihre eigene Erfahrung zu einer eigenen Überzeugung gelangen können.",
    tree:
      "Der Samen erklärt dem Baum nicht, wie er wachsen soll. Er gibt den ersten Impuls und vertraut darauf, dass die Natur den Rest übernimmt.",
    manifesto: "Manifest →",
    back: "← Zurück",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).metadata };
}

export default async function SemillaPage() {
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
      </header>

      <section className="space-y-5 text-[var(--color-muted)] leading-relaxed">
        <p>
          {t.intro}
        </p>
        <p>{t.threeFaces}</p>

        <div className="space-y-4 pl-4 border-l border-[var(--color-border)]">
          {t.faces.map((face) => (
            <div key={face.title} className="space-y-1">
              <p className="text-sm font-medium text-[var(--color-foreground)]">
                {face.title}
              </p>
              <p className="text-sm">{face.body}</p>
            </div>
          ))}
        </div>

        <p>{t.conviction}</p>
        <p>{t.tree}</p>
      </section>

      <footer className="flex gap-4 text-sm pt-2">
        <Link
          href="/manifiesto"
          className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
        >
          {t.manifesto}
        </Link>
        <Link
          href="/"
          className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
        >
          {t.back}
        </Link>
      </footer>
    </div>
  );
}
