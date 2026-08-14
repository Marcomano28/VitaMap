import Link from "next/link";
import { localize, type Locale } from "@/lib/i18n";

/**
 * Avisos del modo demostración (ADR-020).
 *
 * Dos piezas, con propósitos distintos:
 *
 *  · `DemoBanner` — cartel permanente. Que nadie mire una gráfica de valores
 *    creyendo que son de una persona real. Es la condición no negociable del
 *    ADR: en una herramienta de salud, la claridad sobre qué es cada cosa
 *    forma parte del producto.
 *
 *  · `DemoLockedNotice` — sustituye a una funcionalidad que el visitante no
 *    puede usar. Explica el porqué sin asustar ni prometer: la aplicación está
 *    en fase de prueba, subir datos de salud reales exige requisitos que aún se
 *    están completando, y por eso el acceso es por invitación.
 */

export function DemoBanner({ locale }: { locale: Locale }) {
  const t = localize(locale, {
    es: {
      title: "Estás viendo una demostración",
      body:
        "Los datos que aparecen son ficticios y se han creado para enseñar cómo " +
        "funciona VitaMap. No pertenecen a ninguna persona real.",
    },
    de: {
      title: "Sie sehen eine Demonstration",
      body:
        "Die angezeigten Daten sind fiktiv und wurden erstellt, um die " +
        "Funktionsweise von VitaMap zu zeigen. Sie gehören keiner realen Person.",
    },
  });

  return (
    <div
      role="note"
      className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
    >
      <p className="font-medium">{t.title}</p>
      <p className="text-[var(--color-muted)]">{t.body}</p>
    </div>
  );
}

export function DemoLockedNotice({
  locale,
  what,
}: {
  locale: Locale;
  /** Qué intentaba hacer el visitante, para encabezar el aviso. */
  what: "upload" | "account";
}) {
  const t = localize(locale, {
    es: {
      headings: {
        upload: "Para subir tus propios documentos hace falta una cuenta",
        account: "El registro está abierto solo por invitación",
      },
      stage:
        "VitaMap está en fase de prueba. Todavía no admite datos de salud de " +
        "personas ajenas al proyecto.",
      why:
        "No es una limitación comercial. Los datos de salud son categoría " +
        "especial bajo el Art. 9 del RGPD, y custodiarlos exige requisitos que " +
        "aún se están completando: autenticación en dos pasos, cifrado del " +
        "almacenamiento y la documentación de protección de datos correspondiente. " +
        "Hasta que estén cerrados, admitir datos reales de terceros sería " +
        "prometer una seguridad que todavía no puede sostenerse.",
      how:
        "Mientras tanto, el acceso se abre por invitación a quienes colaboran en " +
        "el proyecto. Si te interesa participar —en el contenido científico, en " +
        "el código o probando la herramienta— escríbeme y hablamos.",
      cta: "Ver cómo funciona el acceso",
    },
    de: {
      headings: {
        upload: "Zum Hochladen eigener Dokumente ist ein Konto nötig",
        account: "Die Registrierung ist nur auf Einladung möglich",
      },
      stage:
        "VitaMap befindet sich in der Erprobungsphase. Gesundheitsdaten von " +
        "Personen außerhalb des Projekts werden noch nicht angenommen.",
      why:
        "Das ist keine kommerzielle Einschränkung. Gesundheitsdaten sind besondere " +
        "Kategorien nach Art. 9 DSGVO, und ihre Verwahrung setzt Anforderungen " +
        "voraus, die noch nicht abgeschlossen sind: Zwei-Faktor-Authentifizierung, " +
        "Verschlüsselung des Speichers und die zugehörige Datenschutzdokumentation. " +
        "Solange das offen ist, hieße die Aufnahme echter Daten Dritter, eine " +
        "Sicherheit zuzusagen, die noch nicht eingelöst werden kann.",
      how:
        "Bis dahin wird der Zugang auf Einladung an Mitwirkende geöffnet. Wenn Sie " +
        "mitarbeiten möchten — an den wissenschaftlichen Inhalten, am Code oder " +
        "beim Testen — schreiben Sie mir gern.",
      cta: "Wie der Zugang funktioniert",
    },
  });

  return (
    <section className="space-y-3 rounded-md border border-[var(--color-border)] p-4 text-sm">
      <h2 className="font-medium">{t.headings[what]}</h2>
      <p className="text-[var(--color-muted)]">{t.stage}</p>
      <p className="text-[var(--color-muted)]">{t.why}</p>
      <p className="text-[var(--color-muted)]">{t.how}</p>
      <p>
        <Link href="/register" className="underline hover:text-[var(--color-foreground)]">
          {t.cta}
        </Link>
      </p>
    </section>
  );
}
