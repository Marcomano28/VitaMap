/**
 * Formulario de contacto del visitante (ADR-020).
 *
 * El visitante escribe al operador sin ver su dirección y deja la suya para
 * recibir respuesta. Aquí vive el contrato del cuerpo, separado de la ruta
 * para poder probarlo sin Next.
 *
 * Decisiones:
 *   · `website` es un honeypot: campo oculto que un humano no rellena y un
 *     bot sí. Si trae algo, se responde 202 igual (para no dar pistas) pero no
 *     se envía nada.
 *   · El mensaje se acota a 2.000 caracteres: cabe una presentación, no cabe
 *     un ataque de relleno al buzón. Se recorta espacio en blanco, no se
 *     interpreta ni se transforma.
 *   · No se pide nombre: el correo basta para responder y es un dato menos.
 */

import { z } from "zod";

export const CONTACT_MESSAGE_MIN = 20;
export const CONTACT_MESSAGE_MAX = 2_000;

export const ContactBody = z.object({
  email: z.string().trim().email().max(254),
  message: z
    .string()
    .transform((v) => v.replace(/\r\n/g, "\n").trim())
    .pipe(z.string().min(CONTACT_MESSAGE_MIN).max(CONTACT_MESSAGE_MAX)),
  locale: z.enum(["es", "de"]).default("es"),
  /** Honeypot. Debe llegar vacío. */
  website: z.string().max(200).optional().default(""),
});
export type ContactBody = z.infer<typeof ContactBody>;

/** Verdadero si el cuerpo parece de un bot (honeypot relleno). */
export function looksAutomated(body: ContactBody): boolean {
  return body.website.trim().length > 0;
}
