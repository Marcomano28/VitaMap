/**
 * Email transaccional vía Brevo (proveedor UE — coherente con el
 * encuadre GDPR del proyecto). Solo emails de cuenta: verificación y
 * recuperación de contraseña. Nunca contenido de salud.
 *
 * Sin SDK: la API v3 de Brevo es un POST simple. Si BREVO_API_KEY no
 * está configurada, los envíos se registran en el log y se descartan
 * (en desarrollo la URL del enlace aparece en el log para poder probar
 * el flujo sin proveedor).
 *
 * Los emails van bilingües (ES + DE): el locale del usuario no se
 * persiste en la tabla user y con 3 pilotos no compensa añadirlo.
 */

import { getEnv } from "./env";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const SEND_TIMEOUT_MS = 10_000;

interface SendInput {
  to: string;
  subject: string;
  text: string;
  /** Sustituye a EMAIL_REPLY_TO para este envío (formulario de contacto). */
  replyTo?: string;
}

interface BrevoPayload {
  sender: { name: string; email: string };
  to: Array<{ email: string }>;
  subject: string;
  textContent: string;
  replyTo?: { email: string };
}

export function buildBrevoPayload(
  input: SendInput,
  from: string,
  replyTo?: string,
): BrevoPayload {
  const m = from.match(/^(.*)<([^>]+)>\s*$/);
  const sender = m
    ? { name: m[1].trim().replace(/^"|"$/g, "") || "VitaMap", email: m[2].trim() }
    : { name: "VitaMap", email: from.trim() };

  return {
    sender,
    to: [{ email: input.to }],
    subject: input.subject,
    textContent: input.text,
    ...(replyTo ? { replyTo: { email: replyTo } } : {}),
  };
}

async function sendEmail(input: SendInput): Promise<void> {
  const env = getEnv();
  const apiKey = env.BREVO_API_KEY ?? "";
  const from = env.EMAIL_FROM ?? "";

  if (!apiKey || !from) {
    if (env.NODE_ENV === "production") {
      throw new Error("BREVO_API_KEY/EMAIL_FROM sin configurar");
    }
    console.warn(
      `[email] proveedor sin configurar; email a ${maskEmail(input.to)} no enviado\n----\n${input.text}\n----`,
    );
    return;
  }

  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(
      buildBrevoPayload(input, from, input.replyTo ?? env.EMAIL_REPLY_TO),
    ),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo ${res.status}: ${body.slice(0, 300)}`);
  }
}

export async function sendResetPasswordEmail(to: string, url: string): Promise<void> {
  await sendEmail({
    to,
    subject: "VitaMap — Restablecer contraseña / Passwort zurücksetzen",
    text: [
      "Has pedido restablecer tu contraseña de VitaMap. Abre este enlace (caduca en 1 hora):",
      url,
      "",
      "Si no lo has pedido tú, ignora este mensaje; tu contraseña no cambia.",
      "",
      "— — —",
      "",
      "Du hast das Zurücksetzen deines VitaMap-Passworts angefordert. Öffne diesen Link (gültig für 1 Stunde):",
      url,
      "",
      "Falls du das nicht warst, ignoriere diese Nachricht; dein Passwort bleibt unverändert.",
    ].join("\n"),
  });
}

export async function sendVerificationEmail(to: string, url: string): Promise<void> {
  await sendEmail({
    to,
    subject: "VitaMap — Verifica tu email / E-Mail bestätigen",
    text: [
      "Bienvenido a VitaMap. Confirma tu dirección de email abriendo este enlace:",
      url,
      "",
      "— — —",
      "",
      "Willkommen bei VitaMap. Bestätige deine E-Mail-Adresse über diesen Link:",
      url,
    ].join("\n"),
  });
}

function maskEmail(e: string): string {
  const [user, domain] = e.split("@");
  if (!domain) return "***";
  return `${user.slice(0, 2)}***@${domain}`;
}

/**
 * Mensaje de un visitante al operador (formulario de contacto, ADR-020).
 *
 * El visitante no ve la dirección del operador: el destinatario sale de
 * `DEMO_CONTACT_EMAIL` (o `EMAIL_REPLY_TO`) en el servidor. Su propio correo
 * va como `replyTo`, de modo que responder desde el buzón es un "Responder"
 * normal, y también en el cuerpo por si el cliente de correo lo pierde.
 *
 * No es un email de cuenta: el remitente puede escribir lo que quiera. Por eso
 * el texto se acota en longitud antes de llegar aquí y no se interpreta.
 */
export async function sendContactMessage(input: {
  to: string;
  fromEmail: string;
  message: string;
  locale: "es" | "de";
}): Promise<void> {
  await sendEmail({
    to: input.to,
    replyTo: input.fromEmail,
    subject:
      input.locale === "de"
        ? "VitaMap — Nachricht einer Besucherin / eines Besuchers"
        : "VitaMap — mensaje de un visitante",
    text: [
      `De / Von: ${input.fromEmail}`,
      `Idioma / Sprache: ${input.locale}`,
      "",
      "— — —",
      "",
      input.message,
    ].join("\n"),
  });
}
