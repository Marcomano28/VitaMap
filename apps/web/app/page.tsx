import Link from "next/link";
import localFont from "next/font/local";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { copy, localize } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { demoModeEnabled } from "@/lib/flags";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AtmosphereScene } from "@/components/atmosphere-scene";

export const dynamic = "force-dynamic";

// Cursiva de acento del titular. El archivo vive en el repo (licencia OFL en app/fonts):
// sin peticiones a Google ni en el navegador ni al compilar.
const accent = localFont({
  src: "./fonts/playfair-display-latin-400-italic.woff2",
  style: "italic",
  weight: "400",
  variable: "--font-accent",
  display: "swap",
});

const TEXT = {
  es: {
    eyebrow: "Salud preventiva · Un proyecto en desarrollo",
    title: "Tu salud merece", titleEnd: "continuidad.",
    body: "Un proyecto que conecta centros de salud, seguimiento preventivo y conocimiento personal. Para que cuidarte tenga un lugar en tu vida.",
    proposal: "La propuesta", centers: "Los centros", enter: "Entrar en VitaMap", demo: "Explorar VitaMap",
    discover: "Conocer la propuesta",
    imageTitle: "Con tiempo. Con contexto. Contigo.",
    imageAlt: "Visión arquitectónica de un futuro centro VitaWende: una galería luminosa alrededor de un jardín interior.",
    imageNote: "Imagen conceptual · No es un centro existente",
    sections: [
      { number: "01 / CONTINUIDAD", title: "Tu seguimiento, conectado.", body: "La visión: ciclos de revisión, citas y estudios organizados en un mismo espacio.", link: "De la idea al proyecto", href: "/semilla" },
      { number: "02 / ATENCIÓN", title: "Centros para conocerte mejor.", body: "Equipos, tecnología y entornos pensados para una atención con tiempo.", link: "La visión de los centros", href: "/centros" },
      { number: "03 / CONOCIMIENTO", title: "Tu memoria tiene un lugar.", body: "VitaMap reúne tus observaciones y documentos y te ayuda a comprender tu información.", link: "Descubrir VitaMap", href: "entry" },
    ],
    footer: "VitaWende / Cuidar con continuidad", status: "Proyecto en desarrollo",
    nav: "Navegación de VitaWende",
  },
  de: {
    eyebrow: "Präventive Gesundheit · Ein Projekt im Aufbau",
    title: "Deine Gesundheit braucht", titleEnd: "Kontinuität.",
    body: "Ein Projekt, das Gesundheitszentren, Vorsorge und persönliches Wissen verbindet. Damit deine Gesundheit einen festen Platz in deinem Leben hat.",
    proposal: "Die Idee", centers: "Die Zentren", enter: "VitaMap öffnen", demo: "VitaMap erkunden",
    discover: "Die Idee kennenlernen",
    imageTitle: "Mit Zeit. Mit Kontext. Mit dir.",
    imageAlt: "Architektonische Vision eines künftigen VitaWende-Zentrums: eine helle Galerie um einen begrünten Innenhof.",
    imageNote: "Konzeptbild · Kein bestehendes Zentrum",
    sections: [
      { number: "01 / KONTINUITÄT", title: "Deine Vorsorge, verbunden.", body: "Die Vision: Untersuchungszyklen, Termine und Befunde an einem Ort organisieren.", link: "Von der Idee zum Projekt", href: "/semilla" },
      { number: "02 / BEGLEITUNG", title: "Zentren, die dich kennenlernen.", body: "Teams, Technologie und Räume für eine Betreuung, die sich Zeit nimmt.", link: "Die Vision der Zentren", href: "/centros" },
      { number: "03 / WISSEN", title: "Deine Geschichte hat einen Ort.", body: "VitaMap sammelt deine Beobachtungen und Dokumente und hilft dir, deine Informationen zu verstehen.", link: "VitaMap entdecken", href: "entry" },
    ],
    footer: "VitaWende / Gesundheit mit Kontinuität", status: "Projekt im Aufbau",
    nav: "VitaWende-Navigation",
  },
} as const;

export default async function VitaWendeShell() {
  const session = await getSession();
  if (session?.user) redirect("/memory");

  const locale = await getLocale();
  const t = localize(locale, TEXT);
  const legacy = copy[locale].vitawende;
  // Preserve the real entry route and access policy, including the demo.
  const demo = demoModeEnabled();
  const entryHref = demo ? "/memory" : "/login";
  const entrySub = demo ? legacy.crystalSubDemo : legacy.crystalSub;

  // VitaWende está siempre en penumbra: solo se elige la paleta (cálida o fría).
  // El día y la noche se eligen dentro de VitaMap.
  return (
    <div className={`vitawende-shell ${accent.variable}`}>
      <header className="vwa-nav">
        <Link href="/" className="vwa-brand"><span className="vwa-brand-mark" aria-hidden="true" />VitaWende</Link>
        <nav className="vwa-links" aria-label={t.nav}>
          <Link href="/manifiesto">{t.proposal}</Link>
          <Link href="/centros">{t.centers}</Link>
          <Link href={entryHref}>VitaMap</Link>
        </nav>
        <div className="vwa-tools">
          <LanguageSwitcher locale={locale} />
          <ThemeToggle intent="palette" locale={locale} />
        </div>
      </header>

      <section className="vwa-hero" aria-labelledby="vitawende-title">
        <AtmosphereScene src="/images/vitawende-courtyard.jpg" depthSrc="/images/vitawende-courtyard-depth.png" word="VitaWende" label={t.imageAlt} />
        <div className="vwa-hero-inner">
          <div className="vwa-copy">
            <p className="vwa-eyebrow">{t.eyebrow}</p>
            <h1 id="vitawende-title">{t.title} <em>{t.titleEnd.replace(/\.$/, "")}</em>.</h1>
            <p className="vwa-lede">{t.body}</p>
            <div className="vwa-actions">
              <Link href="/manifiesto" className="vwa-button">{t.discover}<span aria-hidden="true">→</span></Link>
              <Link href={entryHref} className="vwa-link">{demo ? t.demo : t.enter}<span aria-hidden="true">↗</span></Link>
            </div>
            <p className="vwa-entry-note">VitaMap · {entrySub}</p>
          </div>
          <p className="vwa-note"><strong>{t.imageTitle}</strong>{t.imageNote}</p>
        </div>
      </section>

      <section className="vwa-sections" aria-label={t.proposal}>
        {t.sections.map((item) => (
          <article key={item.number}>
            <p className="vwa-eyebrow">{item.number.split(" / ")[1]}</p>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
            <Link href={item.href === "entry" ? entryHref : item.href} className="vwa-link">{item.link}<span aria-hidden="true">↗</span></Link>
          </article>
        ))}
      </section>
      <footer className="vwa-footer"><span>{t.status}</span><span>{t.footer}</span></footer>
    </div>
  );
}
