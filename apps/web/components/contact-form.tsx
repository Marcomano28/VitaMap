"use client";

import { useState, type FormEvent } from "react";
import { localize, type Locale } from "@/lib/i18n";

/**
 * Formulario de contacto del visitante (ADR-020).
 *
 * El visitante no ve la dirección del operador; escribe, deja su correo y el
 * servidor reenvía. El campo `website` es un honeypot: oculto para personas,
 * visible para bots. No se guarda nada en el navegador.
 */
export function ContactForm({ locale }: { locale: Locale }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorKey, setErrorKey] = useState<"rate_limited" | "invalid" | "generic">("generic");

  const t = localize(locale, {
    es: {
      title: "Escríbeme",
      intro:
        "Si quieres participar en el piloto o colaborar, cuéntame brevemente quién eres y qué te interesa. Deja tu correo para poder responderte.",
      email: "Tu correo",
      message: "Mensaje",
      placeholder: "Quién eres, qué te interesa (contenido, código, probar la herramienta)…",
      send: "Enviar",
      sending: "Enviando…",
      sent: "Mensaje enviado. Te respondo a ese correo.",
      errors: {
        rate_limited: "Has enviado varios mensajes seguidos. Prueba más tarde.",
        invalid: "Revisa el correo y que el mensaje tenga al menos 20 caracteres.",
        generic: "No se ha podido enviar. Inténtalo de nuevo más tarde.",
      },
      privacy:
        "Tu correo y tu mensaje se envían al responsable de VitaMap por email y no se guardan en esta aplicación. No incluyas datos de salud.",
    },
    de: {
      title: "Schreiben Sie mir",
      intro:
        "Wenn Sie am Piloten teilnehmen oder mitarbeiten möchten, erzählen Sie kurz, wer Sie sind und was Sie interessiert. Hinterlassen Sie Ihre E-Mail, damit ich antworten kann.",
      email: "Ihre E-Mail",
      message: "Nachricht",
      placeholder: "Wer Sie sind, was Sie interessiert (Inhalte, Code, Testen)…",
      send: "Senden",
      sending: "Wird gesendet…",
      sent: "Nachricht gesendet. Ich antworte an diese Adresse.",
      errors: {
        rate_limited: "Sie haben mehrere Nachrichten hintereinander gesendet. Bitte später erneut versuchen.",
        invalid: "Bitte E-Mail prüfen; die Nachricht braucht mindestens 20 Zeichen.",
        generic: "Senden nicht möglich. Bitte später erneut versuchen.",
      },
      privacy:
        "Ihre E-Mail und Ihre Nachricht werden per E-Mail an den Verantwortlichen von VitaMap übermittelt und nicht in dieser Anwendung gespeichert. Bitte keine Gesundheitsdaten angeben.",
    },
  });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(data.get("email") ?? ""),
          message: String(data.get("message") ?? ""),
          website: String(data.get("website") ?? ""),
          locale,
        }),
      });
      if (res.status === 202) {
        setStatus("sent");
        form.reset();
        return;
      }
      setErrorKey(
        res.status === 429 ? "rate_limited" : res.status === 400 ? "invalid" : "generic",
      );
      setStatus("error");
    } catch {
      setErrorKey("generic");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p role="status" className="rounded-md border border-[var(--color-border)] px-4 py-3 text-sm">
        {t.sent}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" aria-labelledby="contact-title">
      <h3 id="contact-title" className="font-medium">
        {t.title}
      </h3>
      <p className="text-sm text-[var(--color-muted)]">{t.intro}</p>

      {/* Honeypot: fuera de la vista y del orden de tabulación. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          {t.email}
        </span>
        <input
          type="email"
          name="email"
          required
          maxLength={254}
          autoComplete="email"
          className={inputCls}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          {t.message}
        </span>
        <textarea
          name="message"
          required
          minLength={20}
          maxLength={2000}
          rows={5}
          placeholder={t.placeholder}
          className={inputCls}
        />
      </label>

      {status === "error" ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {t.errors[errorKey]}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-md bg-[var(--color-foreground)] px-4 py-2 text-sm font-medium text-[var(--color-background)] hover:opacity-90 disabled:opacity-60"
      >
        {status === "sending" ? t.sending : t.send}
      </button>

      <p className="text-xs text-[var(--color-muted)]">{t.privacy}</p>
    </form>
  );
}

const inputCls =
  "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]";
