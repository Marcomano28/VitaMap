/**
 * Exportación de la memoria del usuario como ZIP.
 *
 * Implementa el derecho a la portabilidad (Art. 20 RGPD): el usuario
 * puede llevarse TODO lo suyo en un fichero comprimido inspeccionable
 * con cualquier herramienta.
 *
 * Contenido del ZIP:
 *   memory/        → todos los .md de la memoria (texto plano, legible)
 *   documents/     → PDFs e imágenes ORIGINALES cifrados con age
 *   README.txt     → resumen de qué hay dentro y cómo descifrarlo
 *
 * No incluimos el índice QMD (es derivado y se recalcula al reindexar).
 * No incluimos el audit log (es de la plataforma, no del usuario).
 */

import path from "node:path";
import fs from "node:fs";
import { Readable } from "node:stream";
import archiver from "archiver";
import { NextResponse } from "next/server";
import { requireUserIdFromRequest, UnauthorizedError } from "@/lib/session";
import { getEnv } from "@/lib/env";
import { logAuditEventSafe } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const README = `VitaMap — exportación de memoria
================================

Este archivo contiene:

  memory/        Tus observaciones, analíticas, cuestionarios e
                 imágenes registradas como ficheros markdown
                 (.md) con frontmatter YAML. Texto plano:
                 inspeccionable con cualquier editor.

  documents/     PDFs e imágenes ORIGINALES cifrados con age
                 (https://age-encryption.org). Cada fichero tiene
                 extensión .age. NO se incluye la clave de
                 descifrado en el export por seguridad: si quieres
                 acceder a los originales fuera de VitaMap, pide
                 al operador del servidor que te entregue la clave
                 derivada para tu cuenta.

  README.txt     Este fichero.

Para re-importar tu memoria en otra instancia de VitaMap, copia el
contenido de memory/ y documents/ a data/users/<tu_id>/ y ejecuta el
script de reindexado.

Fecha de exportación: ${new Date().toISOString()}
`;

export async function GET(req: Request) {
  // -- Auth -------------------------------------------------------------
  let userId: string;
  try {
    userId = await requireUserIdFromRequest(req);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw err;
  }

  const userRoot = path.join(getEnv().DATA_ROOT, "users", userId);
  const memoryDir = path.join(userRoot, "memory");
  const documentsDir = path.join(userRoot, "documents");

  // -- Crear archive ----------------------------------------------------
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("warning", (e) => console.warn("[export] warning", e));
  archive.on("error", (e) => console.error("[export] error", e));

  if (fs.existsSync(memoryDir)) archive.directory(memoryDir, "memory");
  if (fs.existsSync(documentsDir)) archive.directory(documentsDir, "documents");
  archive.append(README, { name: "README.txt" });
  archive.finalize();

  await logAuditEventSafe({
    actor: userId,
    action: "memory.read",
    subjectId: userId,
    payloadSum: "export=zip",
  });

  // Convertir Node Readable a Web ReadableStream para Next.js.
  const webStream = Readable.toWeb(archive) as unknown as ReadableStream;
  const filename = `vitamap-export-${new Date().toISOString().slice(0, 10)}.zip`;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
