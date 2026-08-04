/**
 * Sirve imágenes cifradas del directorio documents/ del usuario,
 * descifradas en memoria.
 *
 * Pasos:
 *   1. Autenticar (sesión BetterAuth).
 *   2. Validar el nombre solicitado (sin barras, sin "..", extensión .age).
 *   3. Resolver ruta absoluta y comprobar que cae dentro de
 *      data/users/<userId>/documents/.
 *   4. Leer el .age, descifrar con la clave del usuario.
 *   5. Adivinar Content-Type por la extensión inmediatamente bajo .age.
 *   6. Devolver bytes con Cache-Control privado.
 *
 * Importante: la imagen se descifra EN MEMORIA, no se escribe descifrada.
 */

import path from "node:path";
import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { UnauthorizedError } from "@/lib/session";
import { SubscriptionRequiredError } from "@/lib/subscription-access";
import { requireDataSubjectFromRequest } from "@/lib/data-access-guards";
import { decryptForUser } from "@/lib/crypto";
import { getEnv } from "@/lib/env";
import { logAuditEventSafe } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

interface RouteContext {
  params: Promise<{ name: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  // -- Auth -------------------------------------------------------------
  let userId: string;
  try {
    ({ subject: userId } = await requireDataSubjectFromRequest(req, "read"));
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof SubscriptionRequiredError) {
      return NextResponse.json(
        { error: "subscription_required", billingUrl: "/settings/billing" },
        { status: 402 },
      );
    }
    throw err;
  }

  // -- Validación del nombre -------------------------------------------
  const { name: nameRaw } = await context.params;
  const name = decodeURIComponent(nameRaw);
  if (name.includes("/") || name.includes("\\") || name.includes("..")) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  if (!name.endsWith(".age")) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  const innerExt = path.extname(name.slice(0, -4)).toLowerCase();
  const mime = MIME_BY_EXT[innerExt];
  if (!mime) {
    return NextResponse.json({ error: "unsupported_mime" }, { status: 400 });
  }

  // -- Ruta y prefijo --------------------------------------------------
  const userDocs = path.join(getEnv().DATA_ROOT, "users", userId, "documents");
  const abs = path.resolve(userDocs, name);
  if (!abs.startsWith(userDocs + path.sep)) {
    return NextResponse.json({ error: "path_traversal_denied" }, { status: 400 });
  }

  // -- Lectura + descifrado --------------------------------------------
  let plain: Uint8Array;
  try {
    const encrypted = new Uint8Array(await fs.readFile(abs));
    plain = await decryptForUser(userId, encrypted);
  } catch {
    return NextResponse.json({ error: "not_found_or_decrypt_failed" }, { status: 404 });
  }

  await logAuditEventSafe({
    actor: userId,
    action: "memory.read",
    subjectId: userId,
    payloadSum: `image=${name}`,
  });

  const body = plain.buffer.slice(
    plain.byteOffset,
    plain.byteOffset + plain.byteLength,
  ) as ArrayBuffer;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `inline; filename="${path.basename(name, ".age")}"`,
    },
  });
}
