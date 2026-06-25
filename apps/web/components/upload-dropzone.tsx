"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { localize, type Locale } from "@/lib/i18n";

type FileStatus =
  | { state: "queued"; name: string }
  | { state: "uploading"; name: string }
  | { state: "ok"; name: string; id: string }
  | { state: "error"; name: string; message: string };

interface Props {
  /** Categoría por defecto del inbox. */
  defaultCategory?: "lab" | "document" | "image";
  locale: Locale;
}

const TEXT = {
  es: {
    drop: "Arrastra aquí PDFs o imágenes",
    select: "o haz clic para seleccionar archivos (máx. 10 MB)",
    queued: "En cola",
    uploading: "Subiendo...",
    ready: "En cola para OCR",
    error: "Error",
    uploadFailed: "No se pudo subir el archivo",
  },
  de: {
    drop: "PDFs oder Bilder hierher ziehen",
    select: "oder klicken, um Dateien auszuwählen (max. 10 MB)",
    queued: "In Warteschlange",
    uploading: "Wird hochgeladen...",
    ready: "Für OCR eingeplant",
    error: "Fehler",
    uploadFailed: "Die Datei konnte nicht hochgeladen werden",
  },
} as const;

const API_ERROR_KEYS: Record<string, keyof typeof TEXT.es> = {
  unauthorized: "uploadFailed",
  subscription_required: "uploadFailed",
  invalid_multipart: "uploadFailed",
  missing_file: "uploadFailed",
  empty_file: "uploadFailed",
  file_too_large: "uploadFailed",
  invalid_category: "uploadFailed",
  store_failed: "uploadFailed",
  queue_failed: "uploadFailed",
};

export function UploadDropzone({ defaultCategory = "lab", locale }: Props) {
  const router = useRouter();
  const t = localize(locale, TEXT);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState<FileStatus[]>([]);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      setItems((prev) => [...prev, ...arr.map((f) => ({ state: "queued" as const, name: f.name }))]);

      for (const file of arr) {
        setItems((prev) =>
          prev.map((it) =>
            it.name === file.name && it.state === "queued"
              ? { state: "uploading", name: it.name }
              : it,
          ),
        );
        const fd = new FormData();
        fd.append("file", file);
        fd.append("category", defaultCategory);
        try {
          const res = await fetch(
            `/api/upload?category=${defaultCategory}`,
            { method: "POST", body: fd, credentials: "same-origin" },
          );
          if (!res.ok) {
            if (res.status === 402) {
              window.location.href = "/settings/billing?required=1";
              return;
            }
            const payload = (await res.json().catch(() => null)) as
              | { error?: string }
              | null;
            const key = payload?.error ? API_ERROR_KEYS[payload.error] : undefined;
            throw new Error(key ? t[key] : `${t.uploadFailed} (HTTP ${res.status})`);
          }
          const json = (await res.json()) as { id: string };
          setItems((prev) =>
            prev.map((it) =>
              it.name === file.name && it.state === "uploading"
                ? { state: "ok", name: it.name, id: json.id }
                : it,
            ),
          );
        } catch (err) {
          setItems((prev) =>
            prev.map((it) =>
              it.name === file.name && it.state === "uploading"
                ? { state: "error", name: it.name, message: String(err).slice(0, 200) }
                : it,
            ),
          );
        }
      }

      router.refresh();
    },
    [defaultCategory, router, t],
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length > 0) upload(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-md border-2 border-dashed p-8 text-center transition ${
          dragging
            ? "border-[var(--color-accent)] bg-[var(--color-card)]"
            : "border-[var(--color-border)] hover:border-[var(--color-accent)]"
        }`}
      >
        <p className="font-medium">{t.drop}</p>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {t.select}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <ul className="space-y-1 text-sm">
          {items.map((it, idx) => (
            <li key={idx} className="flex flex-col gap-1 rounded border border-[var(--color-border)] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="min-w-0 flex-1 truncate">{it.name}</span>
              <span
                className={
                  it.state === "ok"
                    ? "text-green-700 dark:text-green-400"
                    : it.state === "error"
                      ? "text-red-700 dark:text-red-400"
                      : "text-[var(--color-muted)]"
                }
              >
                {it.state === "queued" && t.queued}
                {it.state === "uploading" && t.uploading}
                {it.state === "ok" && t.ready}
                {it.state === "error" && `${t.error}: ${it.message}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
