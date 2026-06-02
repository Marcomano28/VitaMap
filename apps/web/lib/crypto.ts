/**
 * Cifrado de archivos con `age-encryption` (puro JS, sin binarios).
 *
 * Clave por usuario derivada de MASTER_KEY + userId, de modo que el
 * borrado de un usuario también invalida sus archivos (cumple el
 * principio de minimización + right-to-erasure por defecto).
 */

import * as age from "age-encryption";
import { createHmac } from "node:crypto";
import { getEnv } from "./env";

/**
 * Deriva una passphrase determinística por usuario.
 *   passphrase = HMAC-SHA256(MASTER_KEY, "user:"+userId)
 * La passphrase nunca sale del servidor.
 */
function passphraseFor(userId: string): string {
  const env = getEnv();
  return createHmac("sha256", env.MASTER_KEY)
    .update("user:" + userId)
    .digest("hex");
}

export async function encryptForUser(
  userId: string,
  plaintext: Uint8Array,
): Promise<Uint8Array> {
  const encrypter = new age.Encrypter();
  encrypter.setPassphrase(passphraseFor(userId));
  return encrypter.encrypt(plaintext);
}

export async function decryptForUser(
  userId: string,
  ciphertext: Uint8Array,
): Promise<Uint8Array> {
  const decrypter = new age.Decrypter();
  decrypter.addPassphrase(passphraseFor(userId));
  return decrypter.decrypt(ciphertext);
}
