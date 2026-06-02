import { NextResponse } from "next/server";

/**
 * Healthcheck simple. Útil para Caddy / Docker / Uptime Kuma en Fase 1.
 * No expone información sensible. No requiere autenticación.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "vitamap-web",
    version: "0.1.0",
    phase: "0",
    ts: new Date().toISOString(),
  });
}
