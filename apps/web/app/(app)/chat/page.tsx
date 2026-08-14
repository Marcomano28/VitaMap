import { ChatUI } from "@/components/chat-ui";
import { copy } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { requireViewSubject } from "@/lib/data-access-guards";
import { DemoConsentGate } from "@/components/demo-consent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: copy[locale].chat.title };
}

export default async function ChatPage() {
  const { anonymous } = await requireViewSubject("read");
  const locale = await getLocale();
  const t = copy[locale].chat;

  // Sin cartel de datos ficticios en esta página: la aceptación previa que se
  // muestra justo debajo ya lo dice, y con más detalle. Repetirlo sería ruido.
  return (
    <div className="space-y-3">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {t.body}
        </p>
      </header>
      {anonymous ? (
        <DemoConsentGate locale={locale}>
          <ChatUI locale={locale} demoConsent />
        </DemoConsentGate>
      ) : (
        <ChatUI locale={locale} />
      )}
    </div>
  );
}
