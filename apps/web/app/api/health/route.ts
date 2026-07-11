import { NextResponse } from "next/server";
import { verifyAuditChain } from "@/lib/audit";

export const runtime = "nodejs"; // verifyAuditChain usa better-sqlite3

/**
 * Healthcheck. Útil para Caddy / Docker / Uptime Kuma en Fase 1.
 * No expone información sensible. No requiere autenticación.
 *
 * Incluye la verificación de la cadena de hashes del audit log: una
 * cadena que nunca se verifica no detecta manipulación. El resultado se
 * cachea AUDIT_CHECK_TTL_MS porque Docker llama cada 30 s y la
 * verificación recorre la tabla completa.
 *
 * Una rotura de cadena NO tumba el healthcheck (el servicio sigue vivo);
 * se expone como "audit_chain": "broken" y se loguea para alertar.
 */
const AUDIT_CHECK_TTL_MS = 5 * 60_000;

let lastAuditCheck = 0;
let lastAuditResult: "ok" | "broken" | "error" = "ok";

async function auditChainStatus(): Promise<"ok" | "broken" | "error"> {
  const now = Date.now();
  if (now - lastAuditCheck < AUDIT_CHECK_TTL_MS) return lastAuditResult;
  lastAuditCheck = now;
  try {
    const result = await verifyAuditChain();
    lastAuditResult = result.ok ? "ok" : "broken";
    if (!result.ok) {
      console.error("[health] CADENA DE AUDITORÍA ROTA en id", result.brokenAt);
    }
  } catch (err) {
    console.error("[health] error verificando cadena de auditoría", err);
    lastAuditResult = "error";
  }
  return lastAuditResult;
}

export async function GET() {
  const auditChain = await auditChainStatus();
  return NextResponse.json({
    status: "ok",
    service: "vitamap-web",
    version: "0.1.0",
    response_policy: "lab-v5",
    phase: "0",
    audit_chain: auditChain,
    ts: new Date().toISOString(),
  });
}
