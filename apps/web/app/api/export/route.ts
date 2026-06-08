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
import { NextRequest, NextResponse } from "next/server";
import { requireUserIdFromRequest, UnauthorizedError } from "@/lib/session";
import { getEnv } from "@/lib/env";
import { logAuditEventSafe } from "@/lib/audit";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  localize,
  type Locale,
} from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function exportReadme(locale: Locale): string {
  const template = localize(locale, {
    es: `VitaMap — exportación de memoria
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

Fecha de exportación: __EXPORT_DATE__
`,
    de: `VitaMap — Export des persönlichen Speichers
==========================================

Dieses Archiv enthält:

  memory/        Deine Beobachtungen, Laborbefunde, Fragebögen und
                 Bilder als Markdown-Dateien (.md) mit YAML-Frontmatter.
                 Es handelt sich um lesbaren Text, der mit jedem
                 Texteditor geöffnet werden kann.

  documents/     Die verschlüsselten ORIGINAL-PDFs und -Bilder im
                 age-Format (https://age-encryption.org). Jede Datei
                 trägt die Endung .age. Der Schlüssel ist aus
                 Sicherheitsgründen nicht im Export enthalten. Wenn du
                 außerhalb von VitaMap auf die Originale zugreifen
                 möchtest, fordere beim Serverbetreiber den für dein
                 Konto abgeleiteten Schlüssel an.

  README.txt     Diese Datei.

Zur Übernahme in eine andere VitaMap-Instanz kopierst du memory/ und
documents/ nach data/users/<deine_id>/ und startest anschließend die
Neuindexierung.

Exportdatum: __EXPORT_DATE__
`,
  });
  return template.replace("__EXPORT_DATE__", new Date().toISOString());
}

export async function GET(req: NextRequest) {
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
  const rawLocale = req.cookies.get(LOCALE_COOKIE)?.value;
  const locale = rawLocale && isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  const userRoot = path.join(getEnv().DATA_ROOT, "users", userId);
  const memoryDir = path.join(userRoot, "memory");
  const documentsDir = path.join(userRoot, "documents");

  // -- Crear archive ----------------------------------------------------
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("warning", (e) => console.warn("[export] warning", e));
  archive.on("error", (e) => console.error("[export] error", e));

  if (fs.existsSync(memoryDir)) archive.directory(memoryDir, "memory");
  if (fs.existsSync(documentsDir)) archive.directory(documentsDir, "documents");
  archive.append(exportReadme(locale), { name: "README.txt" });
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
