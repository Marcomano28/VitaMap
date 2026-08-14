import { ChatUI } from "@/components/chat-ui";
import { copy } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { requireViewSubject } from "@/lib/data-access-guards";
import { DemoBanner } from "@/components/demo-notice";
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

  return (
    <div className="space-y-3">
      {anonymous ? <DemoBanner locale={locale} /> : null}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {t.body}
        </p>
      </header>
      <ChatUI locale={locale} />
    </div>
  );
}
