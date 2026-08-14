/**
 * Cuota diaria de consultas al LLM, en tres capas con propósitos distintos.
 *
 * Complementa a `lib/rate-limit.ts`, que es un limitador de ráfaga en memoria
 * (N peticiones por minuto). Esto es lo contrario: una cuota **diaria** y
 * **persistente**, pensada para acotar el gasto de inferencia y el abuso.
 *
 *   1. `anon`  — visitante sin cuenta en la demo pública. Ajustado: impide que
 *                la instancia se use como LLM gratuito de terceros.
 *   2. `user`  — persona suscrita. Generoso: en uso normal NUNCA debe notarse.
 *                Existe como red de seguridad ante una sesión robada o un
 *                bucle del cliente, no para racionar a quien paga.
 *   3. global  — techo de toda la instancia. Última línea de defensa: pase lo
 *                que pase con las otras dos, la factura del proveedor de
 *                inferencia tiene un máximo conocido de antemano.
 *
 * Se cuenta **una unidad por consulta del usuario**, no por llamada al modelo.
 * Una consulta dispara varias pasadas (generación + guardrail + reescritura
 * ocasional, ADR-006/ADR-010); contarlas por separado haría que el número
 * configurado no significara nada intuitivo. Al dimensionar el tope global hay
 * que tener presente ese multiplicador.
 *
 * La persistencia es deliberada: con contadores en memoria, reiniciar el
 * contenedor reiniciaría el tope global, que es justo la garantía que no debe
 * poder saltarse. Vive en la misma `auth.sqlite` que el resto (ADR-005).
 */

import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { getEnv } from "./env";

// =====================================================================
// Tipos y configuración
// =====================================================================

export type QuotaTier = "anon" | "user";

export interface QuotaDecision {
  allowed: boolean;
  /** Motivo del rechazo. `null` si se permitió. */
  reason: "kill_switch" | "global_daily" | "actor_daily" | null;
  /** Consultas restantes hoy para este actor (tras consumir). */
  actorRemaining: number;
  /** Consultas restantes hoy en toda la instancia (tras consumir). */
  globalRemaining: number;
  /** Segundos hasta el reinicio de la cuota (medianoche UTC). */
  resetsInSec: number;
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    console.warn(`[llm-quota] ${name}="${raw}" no es un entero >= 0; se usa ${fallback}`);
    return fallback;
  }
  return parsed;
}

/**
 * Interruptor de emergencia. Con "true" se deniega TODA consulta al LLM sin
 * tocar el resto de la aplicación: sesión, exportación, borrado y billing
 * siguen funcionando. Pensado para cortar de raíz un abuso en curso.
 */
export function llmDisabled(): boolean {
  return process.env.LLM_DISABLED === "true";
}

export function quotaLimits() {
  return {
    global: envInt("LLM_DAILY_GLOBAL_MAX", 300),
    anon: envInt("LLM_DAILY_ANON_MAX", 12),
    user: envInt("LLM_DAILY_USER_MAX", 100),
  };
}

// =====================================================================
// DB
// =====================================================================

const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS llm_quota_usage (
    day        TEXT NOT NULL,
    actor_key  TEXT NOT NULL,
    count      INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (day, actor_key)
  );
`;

/** Clave reservada para el contador de toda la instancia. */
const GLOBAL_KEY = "__global__";

const connections = new Map<string, Database.Database>();

function getDb(): Database.Database {
  const dbPath = path.resolve(getEnv().AUTH_DB_PATH);
  const existing = connections.get(dbPath);
  if (existing) return existing;
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const conn = new Database(dbPath);
  conn.pragma("journal_mode = WAL");
  conn.pragma("synchronous = NORMAL");
  conn.exec(CREATE_TABLES_SQL);
  connections.set(dbPath, conn);
  return conn;
}

// =====================================================================
// Ventana diaria
// =====================================================================

/** Día UTC en formato YYYY-MM-DD. UTC y no local: el servidor puede migrar. */
export function currentDay(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function secondsToMidnightUtc(now: Date = new Date()): number {
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000));
}

function readCount(day: string, key: string): number {
  const row = getDb()
    .prepare(`SELECT count FROM llm_quota_usage WHERE day = ? AND actor_key = ?`)
    .get(day, key) as { count: number } | undefined;
  return row?.count ?? 0;
}

function bump(day: string, key: string, delta: number): void {
  getDb()
    .prepare(
      `INSERT INTO llm_quota_usage (day, actor_key, count)
       VALUES (?, ?, ?)
       ON CONFLICT(day, actor_key)
       DO UPDATE SET count = MAX(0, count + excluded.count)`,
    )
    .run(day, key, delta);
}

// =====================================================================
// API
// =====================================================================

/**
 * Consume una unidad de cuota. Devuelve si la consulta puede seguir adelante.
 *
 * Orden de comprobación deliberado: interruptor → global → actor. Así, cuando
 * la instancia ya está al tope, no se gasta cuota individual de nadie.
 *
 * Los contadores solo se incrementan si la consulta se permite: un rechazo no
 * consume cuota, para que un cliente en bucle contra el límite no impida que
 * el resto del día siga disponible cuando el problema se corrija.
 *
 * @param actorKey  Identificador estable del actor. Para `user`, el userId;
 *                  para `anon`, la IP normalizada. Nunca datos personales en
 *                  claro más allá de eso.
 */
export function consumeLlmQuota(
  actorKey: string,
  tier: QuotaTier,
  now: Date = new Date(),
): QuotaDecision {
  const limits = quotaLimits();
  const actorMax = tier === "anon" ? limits.anon : limits.user;
  const resetsInSec = secondsToMidnightUtc(now);

  if (llmDisabled()) {
    return {
      allowed: false,
      reason: "kill_switch",
      actorRemaining: 0,
      globalRemaining: 0,
      resetsInSec,
    };
  }

  const day = currentDay(now);
  const scopedKey = `${tier}:${actorKey}`;

  const globalUsed = readCount(day, GLOBAL_KEY);
  if (globalUsed >= limits.global) {
    return {
      allowed: false,
      reason: "global_daily",
      actorRemaining: Math.max(0, actorMax - readCount(day, scopedKey)),
      globalRemaining: 0,
      resetsInSec,
    };
  }

  const actorUsed = readCount(day, scopedKey);
  if (actorUsed >= actorMax) {
    return {
      allowed: false,
      reason: "actor_daily",
      actorRemaining: 0,
      globalRemaining: Math.max(0, limits.global - globalUsed),
      resetsInSec,
    };
  }

  // Ambas cuentas en una transacción: o suben las dos o ninguna.
  getDb().transaction(() => {
    bump(day, GLOBAL_KEY, 1);
    bump(day, scopedKey, 1);
  })();

  return {
    allowed: true,
    reason: null,
    actorRemaining: Math.max(0, actorMax - (actorUsed + 1)),
    globalRemaining: Math.max(0, limits.global - (globalUsed + 1)),
    resetsInSec,
  };
}

/**
 * Devuelve una unidad consumida. Para cuando la consulta se aborta antes de
 * llegar al modelo (validación fallida, cancelación del cliente): sería injusto
 * cobrarle al usuario una consulta que nunca se generó.
 */
export function refundLlmQuota(
  actorKey: string,
  tier: QuotaTier,
  now: Date = new Date(),
): void {
  const day = currentDay(now);
  getDb().transaction(() => {
    bump(day, GLOBAL_KEY, -1);
    bump(day, `${tier}:${actorKey}`, -1);
  })();
}

/** Estado actual sin consumir. Para paneles de administración y diagnóstico. */
export function quotaStatus(now: Date = new Date()) {
  const limits = quotaLimits();
  const day = currentDay(now);
  const globalUsed = readCount(day, GLOBAL_KEY);
  return {
    day,
    disabled: llmDisabled(),
    global: {
      used: globalUsed,
      max: limits.global,
      remaining: Math.max(0, limits.global - globalUsed),
    },
    limits,
    resetsInSec: secondsToMidnightUtc(now),
  };
}

/**
 * Borra contadores anteriores a `keepDays`. La tabla crece con el número de
 * actores distintos por día, así que conviene pasarle la escoba de vez en
 * cuando. Devuelve el número de filas eliminadas.
 */
export function pruneQuotaUsage(keepDays = 30, now: Date = new Date()): number {
  const cutoff = new Date(now.getTime() - keepDays * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const info = getDb()
    .prepare(`DELETE FROM llm_quota_usage WHERE day < ?`)
    .run(cutoff);
  return info.changes;
}
