/**
 * Rate limiting en memoria, por clave (p. ej. `chat:<userId>`).
 *
 * Ventana fija: N peticiones por ventana de tiempo. Suficiente para el
 * piloto (una sola instancia de Next, 3 usuarios). Si en Fase 2+ hay
 * varias instancias, sustituir por un backend compartido.
 *
 * El objetivo principal no es protección contra ataques sofisticados,
 * sino evitar que una sesión (legítima o robada) sature el LLM en CPU
 * y deniegue servicio al resto de usuarios.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Evita crecimiento sin límite del Map en procesos de larga vida. */
function sweepIfNeeded(now: number) {
  if (buckets.size < 1000) return;
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Segundos hasta que la ventana se reinicia (solo si !allowed). */
  retryAfterSec: number;
}

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweepIfNeeded(now);

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (bucket.count >= max) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

/** Solo para tests: vacía el estado. */
export function resetRateLimits() {
  buckets.clear();
}
