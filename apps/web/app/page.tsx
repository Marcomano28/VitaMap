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
        <svg
          className="vitawende-seed-svg"
          viewBox="0 0 200 240"
          focusable="false"
          aria-hidden="true"
        >
          <path
            className="seed-face"
            d="M100 14 C146 54 174 120 154 178 C140 220 60 220 46 178 C26 120 54 54 100 14Z"
          />
          <path
            className="seed-face-inner"
            d="M100 18 C91 76 91 156 100 220 C109 156 109 76 100 18Z"
          />
          <path
            className="seed-facet"
            d="M100 18 C72 86 58 148 46 178 M100 18 C128 86 142 148 154 178"
          />
          <path
            className="seed-facet seed-facet-soft"
            d="M63 194 C86 176 114 176 137 194 M56 151 C83 134 117 134 144 151 M70 98 C88 86 112 86 130 98"
          />
          <path
            className="seed-rib"
            d="M46 178 C72 166 128 166 154 178 M64 205 C88 194 112 194 136 205"
          />
          <path
            className="seed-germ-shadow"
            d="M100 157 C89 170 84 185 91 196 C99 207 116 202 119 188 C121 176 113 164 100 157Z"
          />
          <path
            className="seed-germ"
            d="M100 157 C89 170 84 185 91 196 C99 207 116 202 119 188 C121 176 113 164 100 157Z"
          />
        </svg>
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
