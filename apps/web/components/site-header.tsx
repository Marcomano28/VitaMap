import Link from "next/link";
import { getSession } from "@/lib/session";
import { signOutAction } from "@/app/(auth)/login/actions";
import { copy } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { hasActiveSubscription } from "@/lib/billing";
import { isAdminEmail } from "@/lib/admin";
import { assessmentsEnabled, demoModeEnabled } from "@/lib/flags";

export async function SiteHeader() {
  const locale = await getLocale();
  const t = copy[locale].nav;
  const session = await getSession();
  const authed = !!session?.user;
  const admin = isAdminEmail(session?.user.email);
  const assessEnabled = assessmentsEnabled();
  const subscribed = session?.user
    ? hasActiveSubscription(session.user.id)
    : false;
  const navAuthed = [
    { href: "/memory", label: t.memory },
    { href: "/memory/map", label: t.map },
    { href: "/upload", label: t.upload },
    ...(assessEnabled ? [{ href: "/assess", label: t.assess }] : []),
    { href: "/chat", label: t.chat },
    { href: "/guide", label: t.guide },
  ];
  const mobileNavAuthed = [
    { href: "/memory/map", label: t.map },
    ...(assessEnabled ? [{ href: "/assess", label: t.assess }] : []),
    { href: "/guide", label: t.guide },
    { href: "/chat", label: t.chat },
    { href: "/settings", label: t.account },
  ];
  /**
   * Navegación del visitante sin cuenta en modo demostración (ADR-020).
   *
   * Se le enseñan las habitaciones que cuentan algo del producto: la memoria,
   * el mapa, el asistente, la guía y la subida —esta última inerte, con su
   * explicación—. Fuera quedan ajustes, bandeja y cuestionarios: sin datos
   * propios no enseñan nada. `/admin/corpus` no aparece nunca: la superficie
   * administrativa se oculta, no se desactiva.
   */
  const demoNav = [
    { href: "/memory", label: t.memory },
    { href: "/memory/map", label: t.map },
    { href: "/chat", label: t.chat },
    { href: "/upload", label: t.upload },
    { href: "/guide", label: t.guide },
  ];
  const demoActive = demoModeEnabled() && !authed;

  const anonNav = [
    { href: "/guide", label: t.guide },
    { href: "/settings/billing", label: t.subscription },
    { href: "/settings", label: t.account },
  ];

  const visibleNav = demoActive
    ? demoNav
    : subscribed
      ? navAuthed
      : anonNav;
  const visibleMobileNav = demoActive
    ? demoNav
    : subscribed
      ? mobileNavAuthed
      : anonNav;

  return (
    <header className="vitamap-header">
      <div className="vitamap-header-inner mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-4">
        <div className="vitamap-header-top">
          <Link
            href="/"
            className="vitamap-logo font-semibold tracking-tight whitespace-nowrap"
          >
            VitaMap
          </Link>
          <div className="vitamap-mobile-tools">
            <LanguageSwitcher locale={locale} />
            <ThemeToggle intent="palette" />
            <ThemeToggle />
          </div>
        </div>

        <nav className="vitamap-header-nav vitamap-desktop-nav text-sm">
          {authed && (
            <>
              <div className="vitamap-desktop-nav-main">
                {visibleNav.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  >
                    {n.label}
                  </Link>
                ))}
                {admin && (
                  <Link
                    href="/admin/corpus"
                    className="text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  >
                    {t.admin}
                  </Link>
                )}
                <Link
                  href="/settings"
                  className="vitamap-account-link text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  aria-label={t.settings}
                >
                  {session!.user.email}
                </Link>
                <LanguageSwitcher locale={locale} />
                <ThemeToggle intent="palette" />
                <ThemeToggle />
              </div>
              <div className="vitamap-desktop-nav-session">
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="rounded-md border border-[var(--color-border)] px-3 py-1 hover:bg-[var(--color-card)]"
                  >
                    {t.logout}
                  </button>
                </form>
              </div>
            </>
          )}
          {!authed && (
            <div className="vitamap-desktop-nav-main">
              <Link
                href="/register"
                className="text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              >
                {t.requestAccess}
              </Link>
              <LanguageSwitcher locale={locale} />
              <ThemeToggle intent="palette" />
              <ThemeToggle />
              <Link
                href="/login"
                className="rounded-md border border-[var(--color-border)] px-3 py-1 hover:bg-[var(--color-card)]"
              >
                {t.login}
              </Link>
            </div>
          )}
        </nav>

        <nav
          className="vitamap-mobile-nav"
          aria-label={locale === "de" ? "Navigation" : "Navegación"}
        >
          {authed ? (
            visibleMobileNav.map((n) => (
              <Link key={n.href} href={n.href}>
                {n.label}
              </Link>
            ))
          ) : (
            <>
              <Link href="/guide">{t.guide}</Link>
              <Link href="/register">{t.requestAccess}</Link>
              <Link href="/login">{t.login}</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
