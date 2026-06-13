import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { copy } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export default async function VitaWendeShell() {
  const session = await getSession();
  if (session?.user) redirect("/memory");

  const locale = await getLocale();
  const t = copy[locale].vitawende;

  return (
    <div className="vitawende-shell">
      <div className="vitawende-light" aria-hidden="true" />
      <div className="vitawende-floor" aria-hidden="true" />
      <div className="vitawende-vignette" aria-hidden="true" />

      <div className="vitawende-brand" aria-hidden="true">
        <span className="vitawende-brand-mark" />
        <span className="vitawende-brand-name">VitaWende</span>
      </div>

      <span className="vitawende-wordmark" aria-hidden="true">
        VitaWende
      </span>

      <Link href="/login" className="vitawende-crystal">
        <span className="vitawende-crystal-title">VitaMap</span>
        <span className="vitawende-crystal-sub">{t.crystalSub}</span>
      </Link>

      <nav className="vitawende-nav" aria-label="VitaWende">
        <Link href="/semilla">{t.nav.semilla}</Link>
        <Link href="/manifiesto">{t.nav.manifiesto}</Link>
        <Link href="/centros">{t.nav.centros}</Link>
      </nav>
    </div>
  );
}
