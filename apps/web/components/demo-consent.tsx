"use client";

import { useState, type ReactNode } from "react";
import { localize, type Locale } from "@/lib/i18n";

/**
 * Aceptación previa a la primera pregunta del visitante anónimo (ADR-020).
 *
 * El cartel de datos ficticios informa sobre lo que el visitante **ve**. Esto
 * informa sobre lo que el visitante **escribe**: en cuanto teclea "tengo la
 * ferritina baja", eso es un dato de salud que sale del servidor hacia el
 * proveedor de inferencia. ADR-014 exige consentimiento explícito para esa
 * transferencia, y no deja de aplicar porque quien pregunte no tenga cuenta.
 *
 * **No se persiste nada.** La aceptación vive en estado de React y desaparece
 * al recargar. Podría guardarse en el navegador para no repetirla, pero eso
 * sería almacenar algo en el dispositivo de alguien que no ha creado ninguna
 * cuenta — justo lo que este modo evita. Volver a mostrarlo es barato; explicar
 * por qué se guardó algo, no.
 */
export function DemoConsentGate({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const [accepted, setAccepted] = useState(false);

  const t = localize(locale, {
    es: {
      title: "Antes de empezar a preguntar",
      points: [
        "Los datos que ves son ficticios. No pertenecen a ninguna persona real.",
        "Lo que escribas se envía a un proveedor de inteligencia artificial de la Unión Europea para generar la respuesta. No escribas datos que permitan identificarte ni información de salud tuya real.",
        "Tu conversación no se guarda: desaparece al cerrar esta página.",
        "VitaMap es una herramienta educativa. No diagnostica, no recomienda tratamientos y no sustituye a un profesional sanitario.",
      ],
      accept: "Entendido, quiero probar el asistente",
      note: "Este aviso vuelve a aparecer cada vez que entras, porque no se guarda nada en tu dispositivo.",
    },
    de: {
      title: "Bevor Sie Fragen stellen",
      points: [
        "Die angezeigten Daten sind fiktiv. Sie gehören keiner realen Person.",
        "Was Sie schreiben, wird zur Erzeugung der Antwort an einen KI-Anbieter in der Europäischen Union übermittelt. Geben Sie keine Daten ein, die Sie identifizieren, und keine echten eigenen Gesundheitsdaten.",
        "Ihr Gespräch wird nicht gespeichert: es verschwindet, wenn Sie diese Seite schließen.",
        "VitaMap ist ein Bildungswerkzeug. Es stellt keine Diagnosen, empfiehlt keine Behandlungen und ersetzt keine ärztliche Beratung.",
      ],
      accept: "Verstanden, ich möchte den Assistenten ausprobieren",
      note: "Dieser Hinweis erscheint bei jedem Besuch erneut, weil nichts auf Ihrem Gerät gespeichert wird.",
    },
  });

  if (accepted) return <>{children}</>;

  return (
    <section
      aria-labelledby="demo-consent-title"
      className="space-y-4 rounded-md border border-[var(--color-border)] p-5"
    >
      <h2 id="demo-consent-title" className="font-medium">
        {t.title}
      </h2>

      <ul className="space-y-2 text-sm text-[var(--color-muted)]">
        {t.points.map((point) => (
          <li key={point} className="flex gap-2">
            <span aria-hidden="true">·</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setAccepted(true)}
        className="rounded-md border border-[var(--color-accent)] bg-[var(--color-card)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-surface)]"
      >
        {t.accept}
      </button>

      <p className="text-xs text-[var(--color-muted)]">{t.note}</p>
    </section>
  );
}
