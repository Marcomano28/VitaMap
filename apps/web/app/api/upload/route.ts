import { NextResponse } from "next/server";
import { z } from "zod";
import { createInboxItem, InboxCategory } from "@/lib/inbox";
import { enqueueInboxExtraction } from "@/lib/inbox-queue";
import { logAuditEventSafe } from "@/lib/audit";
import { requireUserIdFromRequest, UnauthorizedError } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cota dura para evitar abuso. Coherente con bodySizeLimit en next.config.ts.
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const QueryParams = z.object({
  category: InboxCategory.default("lab"),
});

/**
 * POST multipart/form-data
 *   fields:
 *     file:     File (PDF o imagen)
 *     category: opcional, override del query param
 *
 * Flujo:
 *   1. validar tamaño y mime
 *   2. createInboxItem → cifra y guarda original, meta=pending
 *   3. enqueueInboxExtraction → OCR + extracción en worker ligero
 *   4. audit log "document.upload"
 *   5. devolver rápido para que el cliente muestre el estado del inbox
 */
export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireUserIdFromRequest(req);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw err;
  }
  const url = new URL(req.url);
  const params = QueryParams.parse({
    category: url.searchParams.get("category") ?? undefined,
  });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_multipart" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "empty_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large", max: MAX_BYTES }, { status: 413 });
  }

  const overrideCategory = formData.get("category");
  const category = (typeof overrideCategory === "string"
    ? InboxCategory.safeParse(overrideCategory)
    : { success: true as const, data: params.category });
  if (!category.success) {
    return NextResponse.json({ error: "invalid_category" }, { status: 400 });
  }

  const buffer = new Uint8Array(await file.arrayBuffer());

  let meta;
  try {
    meta = await createInboxItem({
      userId: userId,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      buffer,
      category: category.data,
    });
  } catch (err) {
    return NextResponse.json({ error: "store_failed", detail: String(err) }, { status: 500 });
  }

  await logAuditEventSafe({
    actor: userId,
    action: "document.upload",
    subjectId: userId,
    payloadSum: `id=${meta.id} cat=${meta.category} size=${meta.size} sha=${meta.sha256.slice(0, 12)}`,
  });

  try {
    meta = await enqueueInboxExtraction({ userId, id: meta.id });
  } catch (err) {
    return NextResponse.json(
      { error: "queue_failed", id: meta.id, detail: String(err) },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: meta.id, meta }, { status: 202 });
}
