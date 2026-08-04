/**
 * Validación de identificadores de usuario/sujeto de datos.
 *
 * Módulo sin dependencias (ni Next, ni BD) para que el choke point de
 * autorización (lib/data-access.ts) y su suite de seguridad puedan
 * ejecutarse aislados. `lib/session.ts` lo re-exporta por compatibilidad.
 */

/**
 * Defensa en profundidad: rechaza ids con caracteres que podrían
 * permitir path traversal. BetterAuth genera UUIDs así que pasa
 * trivialmente, pero validamos por si algún día cambia el esquema.
 */
export function safeUserId(id: string): string {
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(id)) {
    throw new Error("userId con formato inválido");
  }
  return id;
}
