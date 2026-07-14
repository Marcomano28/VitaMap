import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { copy } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SupershapeOrb } from "@/components/supershape-orb";
import { PenumbraTone } from "@/components/penumbra-tone";

export const dynamic = "force-dynamic";

export default async function VitaWendeShell() {
  const session = await getSession();
  if (session?.user) redirect("/memory");

  const locale = await getLocale();
  const t = copy[locale].vitawende;

  return (
    <div className="vitawende-shell">
      <PenumbraTone />
      <div className="vitawende-grid" aria-hidden="true" />
      <div className="vitawende-light" aria-hidden="true" />
      <div className="vitawende-floor" aria-hidden="true" />
      <div className="vitawende-vignette" aria-hidden="true" />
      <div className="vitawende-dust" aria-hidden="true" />
      <div className="vitawende-frame" aria-hidden="true" />

      <div className="vitawende-shell-toggle">
        <LanguageSwitcher locale={locale} />
        <ThemeToggle intent="palette" />
      </div>

      <div className="vitawende-brand" aria-hidden="true">
        <span className="vitawende-brand-mark" />
        <span className="vitawende-brand-name">VitaWende</span>
      </div>

      <div className="vitawende-system-readout" aria-hidden="true">
        <span>SYS</span>
        <strong>VITA-7</strong>
        <span>TEMP</span>
        <strong>36.7</strong>
      </div>

      <span className="vitawende-wordmark" aria-hidden="true">
        VitaWende
      </span>

      <Link href="/login" className="vitawende-crystal">
        <span className="vitawende-crystal-kicker">01 - VITAL DYNAMICS</span>
        <span className="vitawende-crystal-title">VitaMap</span>
        <span className="vitawende-crystal-sub">{t.crystalSub}</span>
      </Link>

      <div className="vitawende-orb" aria-hidden="true">
        <SupershapeOrb />
        <span className="vitawende-orb-glass" />
      </div>

      <div className="vitawende-readout" aria-hidden="true">
        <span className="vitawende-readout-title">SPECTRAL READOUT</span>
        <dl>
          <div>
            <dt>Chronotype</dt>
            <dd>07.4</dd>
          </div>
          <div>
            <dt>Inflammation</dt>
            <dd>0.18</dd>
          </div>
          <div>
            <dt>Recovery</dt>
            <dd>82%</dd>
          </div>
          <div>
            <dt>Active Signals</dt>
            <dd>7 / 9</dd>
          </div>
        </dl>
      </div>

      <div className="vitawende-timeline" aria-hidden="true">
        <span />
        <p>SIGNALS TIMELINE - VITAMAP DYNAMICS</p>
      </div>

      <nav className="vitawende-nav" aria-label="VitaWende">
        <Link href="/semilla">{t.nav.semilla}</Link>
        <Link href="/manifiesto">{t.nav.manifiesto}</Link>
        <Link href="/centros">{t.nav.centros}</Link>
      </nav>
    </div>
  );
}
