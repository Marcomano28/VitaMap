/**
 * Modo demostración pública (ADR-020).
 *
 * Constantes y utilidades del visitante anónimo. El flag que enciende el modo
 * vive en `lib/flags.ts` (`demoModeEnabled`); aquí está el resto.
 */

/**
 * Sujeto de datos de la demostración.
 *
 * Es una carpeta más bajo `data/users/`, **sin propietario y sin grants**, en la
 * línea de los cubículos de ADR-018. La siembra la hace
 * `scripts/seed-demo-subject.mjs`, que solo admite analíticas sintéticas.
 *
 * Cumple el patrón de `safeUserId` ([a-zA-Z0-9_-]{8,64}).
 *
 * ⚠ Si cambias este valor, cámbialo también en `scripts/seed-demo-subject.mjs`:
 * ese script es `.mjs` y no puede importar de aquí.
 */
export const DEMO_SUBJECT_ID = "demo-public";

/** ¿Es este el sujeto de demostración? Útil para decidir qué NO permitir. */
export function isDemoSubject(subjectId: string): boolean {
  return subjectId === DEMO_SUBJECT_ID;
}

/**
 * Clave de limitación para un visitante sin cuenta: su dirección IP.
 *
 * **Por qué se puede confiar en la cabecera.** El `Caddyfile` hace
 * `header_up X-Forwarded-For {remote_host}`, que **reemplaza** el valor en vez
 * de añadirlo. Lo mismo con `X-Real-IP`. Así, lo que llega a la aplicación es
 * la IP que vio Caddy, no lo que el cliente dijera: un visitante no puede
 * falsear su IP para saltarse la cuota.
 *
 * Si algún día se pusiera otro proxy delante, o se cambiara `header_up` por
 * `header_up +`, esta suposición dejaría de valer y habría que quedarse con el
 * ÚLTIMO valor de la lista (el que añade el proxy más cercano), nunca el
 * primero.
 *
 * Sin cabecera —acceso directo al contenedor, que en producción no ocurre— se
 * devuelve una clave común. Es deliberado: en el peor caso todos comparten
 * cuota, que falla del lado seguro.
 */
export function clientIpKey(req: Request): string {
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return normalizeIp(realIp);

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    // El último es el que añade el proxy más cercano; el primero lo controla
    // el cliente y es falsificable.
    const last = parts[parts.length - 1];
    if (last) return normalizeIp(last);
  }

  return "sin-ip";
}

/**
 * Normaliza para que la misma máquina no obtenga varias cuotas por
 * variaciones de formato, y para no guardar la IP en claro como clave.
 *
 * IPv6 se recorta al prefijo /64: un proveedor asigna ese bloque entero a un
 * mismo cliente, así que sin recortar bastaría con cambiar de dirección dentro
 * del propio rango para renovar la cuota.
 */
function normalizeIp(raw: string): string {
  let ip = raw.toLowerCase();

  // Formato IPv6 entre corchetes con puerto: [::1]:1234
  const bracket = ip.match(/^\[(.+)\]:\d+$/);
  if (bracket) ip = bracket[1];

  // IPv4 con puerto: 1.2.3.4:5678
  const v4WithPort = ip.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
  if (v4WithPort) ip = v4WithPort[1];

  // IPv4 mapeada en IPv6: ::ffff:1.2.3.4
  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) ip = mapped[1];

  if (ip.includes(":")) {
    const groups = ip.split(":");
    return groups.slice(0, 4).join(":") + "::/64";
  }

  return ip;
}
