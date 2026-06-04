import Link from "next/link";
import { getSession } from "@/lib/session";
import { signOutAction } from "@/app/(auth)/login/actions";
import { copy } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { LanguageSwitcher } from "@/components/language-switcher";

export async function SiteHeader() {
  const locale = await getLocale();
  const t = copy[locale].nav;
  const session = await getSession();
  const authed = !!session?.user;
  const navAuthed = [
    { href: "/memory", label: t.memory },
    { href: "/upload", label: t.upload },
    { href: "/assess", label: t.assess },
    { href: "/chat", label: t.chat },
    { href: "/guide", label: t.guide },
  ];

  return (
    <header className="border-b border-[var(--color-border)]">
      <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="font-semibold tracking-tight whitespace-nowrap">
          VitaMap
        </Link>

        <nav className="flex items-center gap-3 text-sm flex-wrap justify-end">
          {authed && (
            <>
              {navAuthed.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                >
                  {n.label}
                </Link>
              ))}
              <Link
                href="/settings"
                className="text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                aria-label={t.settings}
              >
                {session!.user.email}
              </Link>
              <LanguageSwitcher locale={locale} />
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-[var(--color-border)] px-3 py-1 hover:bg-[var(--color-card)]"
                >
                  {t.logout}
                </button>
              </form>
            </>
          )}
          {!authed && (
            <>
              <Link
                href="/register"
                className="text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              >
                {t.requestAccess}
              </Link>
              <LanguageSwitcher locale={locale} />
              <Link
                href="/login"
                className="rounded-md border border-[var(--color-border)] px-3 py-1 hover:bg-[var(--color-card)]"
              >
                {t.login}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
