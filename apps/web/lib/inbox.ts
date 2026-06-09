/**
 * Buzón de documentos pendientes.
 *
 * Etapas:
 *   pending   — subido, cifrado en disco, esperando OCR + extracción.
 *   extracting — worker procesando OCR + extracción.
 *   extracted — OCR + extracción completados, esperando revisión humana.
 *   failed    — algo falló en el pipeline (ver `error`).
 *   committed — promocionado a la memoria (en este punto se borra del inbox).
 *
 * Estructura en disco:
 *   data/users/<userId>/inbox/<itemId>/
 *     meta.json
 *     original.<ext>.age      (cifrado con clave derivada del userId)
 *     raw-text.txt            (opcional, tras extracción)
 *     extracted.json          (opcional, tras extracción)
 */

import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { z } from "zod";
import { decryptForUser, encryptForUser } from "./crypto";
import { extractLabResult, LabResultExtraction } from "./extraction";
import { ocrImage, ocrPdf } from "./ocr";
import { getEnv } from "./env";

// =====================================================================
// Schemas
// =====================================================================

export const InboxCategory = z.enum(["lab", "document", "image"]);
export type InboxCategory = z.infer<typeof InboxCategory>;

export const InboxStatus = z.enum(["pending", "extracting", "extracted", "failed"]);
export type InboxStatus = z.infer<typeof InboxStatus>;

export const InboxMeta = z.object({
  id: z.string(),
  status: InboxStatus,
  category: InboxCategory,
  originalName: z.string(),
  storedExt: z.string(),
  size: z.number().int().nonnegative(),
  sha256: z.string(),
  mimeType: z.string(),
  uploadedAt: z.string(),
  processingStartedAt: z.string().optional(),
  extractedAt: z.string().optional(),
  error: z.string().optional(),
});
export type InboxMeta = z.infer<typeof InboxMeta>;

export interface InboxItem {
  meta: InboxMeta;
  extracted?: LabResultExtraction;
  rawText?: string;
}

// =====================================================================
// Rutas
// =====================================================================

function inboxRoot(userId: string): string {
  return path.join(getEnv().DATA_ROOT, "users", userId, "inbox");
}

function itemDir(userId: string, id: string): string {
  return path.join(inboxRoot(userId), id);
}

function metaPath(userId: string, id: string): string {
  return path.join(itemDir(userId, id), "meta.json");
}

// =====================================================================
// Lectura
// =====================================================================

async function readMeta(userId: string, id: string): Promise<InboxMeta | null> {
  try {
    const raw = await fs.readFile(metaPath(userId, id), "utf8");
    return InboxMeta.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function writeMeta(userId: string, meta: InboxMeta): Promise<void> {
  await fs.mkdir(itemDir(userId, meta.id), { recursive: true });
  await fs.writeFile(metaPath(userId, meta.id), JSON.stringify(meta, null, 2), "utf8");
}

export async function listInbox(userId: string): Promise<InboxMeta[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(inboxRoot(userId));
  } catch {
    return [];
  }
  const metas: InboxMeta[] = [];
  for (const id of entries) {
    const m = await readMeta(userId, id);
    if (m) metas.push(m);
  }
  return metas.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export async function getInboxItem(userId: string, id: string): Promise<InboxItem | null> {
  const meta = await readMeta(userId, id);
  if (!meta) return null;
  const item: InboxItem = { meta };
  try {
    const raw = await fs.readFile(path.join(itemDir(userId, id), "raw-text.txt"), "utf8");
    item.rawText = raw;
  } catch {
    /* no raw yet */
  }
  try {
    const ex = await fs.readFile(path.join(itemDir(userId, id), "extracted.json"), "utf8");
    item.extracted = LabResultExtraction.parse(JSON.parse(ex));
  } catch {
    /* not extracted yet */
  }
  return item;
}

export async function getEncryptedOriginal(userId: string, id: string): Promise<Uint8Array> {
  const meta = await readMeta(userId, id);
  if (!meta) throw new Error("inbox item not found");
  const file = path.join(itemDir(userId, id), `original${meta.storedExt}.age`);
  return new Uint8Array(await fs.readFile(file));
}

// =====================================================================
// Escritura — creación
// =====================================================================

export interface CreateInboxInput {
  userId: string;
  originalName: string;
  mimeType: string;
  buffer: Uint8Array;
  category: InboxCategory;
}

export async function createInboxItem(input: CreateInboxInput): Promise<InboxMeta> {
  const id = crypto.randomUUID();
  const ext = path.extname(input.originalName).toLowerCase() || ".bin";
  const sha256 = crypto.createHash("sha256").update(input.buffer).digest("hex");

  const meta: InboxMeta = {
    id,
    status: "pending",
    category: input.category,
    originalName: input.originalName,
    storedExt: ext,
    size: input.buffer.byteLength,
    sha256,
    mimeType: input.mimeType,
    uploadedAt: new Date().toISOString(),
  };

  await writeMeta(input.userId, meta);

  // Cifrar y guardar el original.
  const encrypted = await encryptForUser(input.userId, input.buffer);
  await fs.writeFile(path.join(itemDir(input.userId, id), `original${ext}.age`), encrypted);

  return meta;
}

// =====================================================================
// Pipeline de extracción
// =====================================================================

const PDF_MIME = new Set(["application/pdf"]);
const IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

export async function runExtraction(userId: string, id: string): Promise<InboxMeta> {
  const meta = await readMeta(userId, id);
  if (!meta) throw new Error("inbox item not found");

  const started: InboxMeta = {
    ...meta,
    status: "extracting",
    processingStartedAt: new Date().toISOString(),
    extractedAt: undefined,
    error: undefined,
  };
  await writeMeta(userId, started);
  await fs.rm(path.join(itemDir(userId, id), "raw-text.txt"), { force: true });
  await fs.rm(path.join(itemDir(userId, id), "extracted.json"), { force: true });

  try {
    // 1. Desencriptar a memoria.
    const encrypted = await getEncryptedOriginal(userId, id);
    const plain = await decryptForUser(userId, encrypted);

    // 2. OCR según mime.
    let ocrText = "";
    if (PDF_MIME.has(meta.mimeType) || meta.storedExt === ".pdf") {
      const out = await ocrPdf(plain);
      ocrText = out.text;
    } else if (IMAGE_MIME.has(meta.mimeType) || /\.(png|jpe?g|webp)$/i.test(meta.storedExt)) {
      const out = await ocrImage(plain, meta.storedExt);
      ocrText = out.text;
    } else {
      throw new Error(`mimeType no soportado para OCR: ${meta.mimeType}`);
    }

    await fs.writeFile(path.join(itemDir(userId, id), "raw-text.txt"), ocrText, "utf8");

    // 3. Extracción estructurada solo si categoría=lab.
    if (meta.category === "lab" && ocrText.trim().length > 0) {
      const extracted = await extractLabResult(ocrText);
      await fs.writeFile(
        path.join(itemDir(userId, id), "extracted.json"),
        JSON.stringify(extracted, null, 2),
        "utf8",
      );
    }

    const updated: InboxMeta = {
      ...started,
      status: "extracted",
      extractedAt: new Date().toISOString(),
      error: undefined,
    };
    await writeMeta(userId, updated);
    return updated;
  } catch (err) {
    const failed: InboxMeta = {
      ...started,
      status: "failed",
      error: String(err).slice(0, 500),
    };
    await writeMeta(userId, failed);
    return failed;
  }
}

export async function markInboxExtractionPending(
  userId: string,
  id: string,
): Promise<InboxMeta> {
  const meta = await readMeta(userId, id);
  if (!meta) throw new Error("inbox item not found");
  if (meta.status === "extracted") return meta;
  const updated: InboxMeta = {
    ...meta,
    status: "pending",
    processingStartedAt: undefined,
    extractedAt: undefined,
    error: undefined,
  };
  await writeMeta(userId, updated);
  return updated;
}

// =====================================================================
// Borrado
// =====================================================================

export async function deleteInboxItem(userId: string, id: string): Promise<void> {
  await fs.rm(itemDir(userId, id), { recursive: true, force: true });
}

/**
 * Copia el archivo cifrado a documents/ sin tocar el inbox. El llamador
 * elimina el inbox solo cuando la escritura e indexación han terminado.
 */
export async function copyInboxOriginalToDocuments(
  userId: string,
  id: string,
): Promise<string> {
  const meta = await readMeta(userId, id);
  if (!meta) throw new Error("inbox item not found");
  const src = path.join(itemDir(userId, id), `original${meta.storedExt}.age`);
  const dstDir = path.join(getEnv().DATA_ROOT, "users", userId, "documents");
  await fs.mkdir(dstDir, { recursive: true });
  const dst = path.join(dstDir, `${id}${meta.storedExt}.age`);
  await fs.copyFile(src, dst);
  return dst;
}
