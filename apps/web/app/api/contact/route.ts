/**
 * POST /api/contact — mensaje de un visitante al operador (ADR-020).
 *
 * Sin sesión: es precisamente para quien no tiene cuenta. Las defensas son
 * las de una ruta pública barata: honeypot, límite por IP (ráfaga y día),
 * cuerpo acotado y sin ningún dato del operador en la respuesta. El correo
 * de destino nunca sale del servidor.
 *
 * El registro de auditoría guarda que hubo un mensaje, su longitud y un hash
 * del remitente — no el texto. El texto viaja por email y no se persiste.
 */

import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { ContactBody, looksAutomated } from "@/lib/contact";
import { demoContactEmail, clientIpKey, visitorQuotaKey } from "@/lib/demo";
import { getEnv } from "@/lib/env";
import { sendContactMessage } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAuditEventSafe } from "@/lib/audit";

export const runtime = "nodejs";

const BURST_MAX = 3; // por IP y 10 minutos
const BURST_WINDOW_MS = 10 * 60_000;
const DAILY_MAX = 5; // por IP y día
const DAILY_WINDOW_MS = 24 * 60 * 60_000;

export async function POST(req: Request) {
  const to = demoContactEmail();
  if (!to) {
    // Sin destinatario configurado no hay formulario: la interfaz no lo
    // pinta, pero la ruta también lo dice por si alguien llama directo.
    return NextResponse.json({ error: "contact_unavailable" }, { status: 503 });
  }

  const ipKey = visitorQuotaKey(clientIpKey(req), getEnv().MASTER_KEY);
  const burst = checkRateLimit(`contact:burst:${ipKey}`, BURST_MAX, BURST_WINDOW_MS);
  const daily = checkRateLimit(`contact:day:${ipKey}`, DAILY_MAX, DAILY_WINDOW_MS);
  if (!burst.allowed || !daily.allowed) {
    const retry = Math.max(burst.retryAfterSec, daily.retryAfterSec);
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: retry },
      { status: 429, headers: { "Retry-After": String(retry) } },
    );
  }

  let body: ContactBody;
  try {
    body = ContactBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  // Honeypot: mismo 202 que un envío real, pero no se envía nada.
  if (looksAutomated(body)) {
    return NextResponse.json({ ok: true }, { status: 202 });
  }

  try {
    await sendContactMessage({
      to,
      fromEmail: body.email,
      message: body.message,
      locale: body.locale,
    });
  } catch (err) {
    console.error("[contact] send_failed", err);
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }

  const senderHash = createHash("sha256")
    .update(body.email.toLowerCase())
    .digest("hex")
    .slice(0, 16);
  await logAuditEventSafe({
    actor: "anon",
    action: "demo.contact",
    payloadSum: `sender=${senderHash} chars=${body.message.length} locale=${body.locale}`,
  });

  return NextResponse.json({ ok: true }, { status: 202 });
}
