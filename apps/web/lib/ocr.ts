/**
 * Pipeline OCR de PDFs e imágenes.
 *
 * Estrategia para PDFs:
 *   1) Intentar extracción de texto nativa con pdfjs-dist (rápido, sin OCR).
 *   2) Si el texto resultante es escaso o de mala calidad (heurística),
 *      degradar a OCR: pdftoppm convierte el PDF a PNGs y tesseract los
 *      transcribe.
 *
 * Para imágenes, OCR directo con tesseract.
 *
 * Backend OCR default: `tesseract` shell-out (apt: tesseract-ocr +
 * tesseract-ocr-spa + tesseract-ocr-eng). Documentado en ADR-008. Para
 * Fase 2+ se puede sustituir por un sidecar docTR HTTP sin tocar el
 * resto del código.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const exec = promisify(execFile);

const OCR_LANGS = process.env.OCR_LANGS ?? "spa+eng";
const TEXT_MIN_CHARS = 80;
const NON_ASCII_RATIO_THRESHOLD = 0.4;

// =====================================================================
// API pública
// =====================================================================

export interface OcrResult {
  text: string;
  source: "pdf-native" | "pdf-ocr" | "image-ocr";
  pages: number;
}

export async function ocrPdf(buffer: Uint8Array): Promise<OcrResult> {
  // Un fallo del extractor nativo no debe impedir el fallback OCR.
  try {
    const native = await extractPdfTextNative(buffer);
    if (isGoodText(native.text)) return { ...native, source: "pdf-native" };
  } catch {
    // pdftoppm puede procesar PDFs que pdftotext no consigue interpretar.
  }

  const ocr = await ocrPdfWithTesseract(buffer);
  return { ...ocr, source: "pdf-ocr" };
}

export async function ocrImage(buffer: Uint8Array, ext: string): Promise<OcrResult> {
  const tmp = await mkTmpDir();
  try {
    const input = path.join(tmp, `image${ext.startsWith(".") ? ext : "." + ext}`);
    await fs.writeFile(input, buffer);
    const output = path.join(tmp, "out");
    await exec("tesseract", [input, output, "-l", OCR_LANGS]);
    const text = await fs.readFile(output + ".txt", "utf8");
    return { text, source: "image-ocr", pages: 1 };
  } finally {
    await cleanup(tmp);
  }
}

// =====================================================================
// Internals
// =====================================================================

async function extractPdfTextNative(buffer: Uint8Array): Promise<{ text: string; pages: number }> {
  // En Node pdfjs usa un worker simulado. Registrar el módulo incluido evita
  // que intente resolver pdf.worker.mjs junto al bundle standalone de Next.
  const pdfjsWorker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  (
    globalThis as typeof globalThis & {
      pdfjsWorker?: typeof pdfjsWorker;
    }
  ).pdfjsWorker = pdfjsWorker;

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: buffer, isEvalSupported: false }).promise;
  try {
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const tc = await page.getTextContent();
      const items = tc.items as Array<{ str?: string }>;
      text += items.map((it) => it.str ?? "").join(" ") + "\n\n";
    }
    return { text: text.trim(), pages: doc.numPages };
  } finally {
    await doc.destroy();
  }
}

async function ocrPdfWithTesseract(buffer: Uint8Array): Promise<{ text: string; pages: number }> {
  const tmp = await mkTmpDir();
  try {
    const pdfPath = path.join(tmp, "input.pdf");
    await fs.writeFile(pdfPath, buffer);
    const baseName = path.join(tmp, "page");
    // 300 dpi suele dar buen balance calidad/velocidad para analíticas.
    await exec("pdftoppm", ["-r", "300", "-png", pdfPath, baseName]);
    const files = (await fs.readdir(tmp))
      .filter((f) => f.startsWith("page-") && f.endsWith(".png"))
      .sort();
    let text = "";
    for (const f of files) {
      const input = path.join(tmp, f);
      const output = path.join(tmp, f.replace(/\.png$/, ""));
      await exec("tesseract", [input, output, "-l", OCR_LANGS]);
      text += (await fs.readFile(output + ".txt", "utf8")) + "\n\n";
    }
    return { text: text.trim(), pages: files.length };
  } finally {
    await cleanup(tmp);
  }
}

function isGoodText(text: string): boolean {
  const t = text.trim();
  if (t.length < TEXT_MIN_CHARS) return false;
  const nonAscii = (t.match(/[^\x20-\x7E\n\r\táéíóúñÁÉÍÓÚÑüÜ]/g) ?? []).length;
  return nonAscii / t.length < NON_ASCII_RATIO_THRESHOLD;
}

async function mkTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "vitamap-ocr-"));
}

async function cleanup(p: string) {
  await fs.rm(p, { recursive: true, force: true });
}
