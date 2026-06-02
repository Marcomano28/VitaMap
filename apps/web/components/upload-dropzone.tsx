"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type FileStatus =
  | { state: "queued"; name: string }
  | { state: "uploading"; name: string }
  | { state: "ok"; name: string; id: string }
  | { state: "error"; name: string; message: string };

interface Props {
  /** Categoría por defecto del inbox. */
  defaultCategory?: "lab" | "document" | "image";
}

export function UploadDropzone({ defaultCategory = "lab" }: Props) {
  const router = useRouter();
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
            const txt = await res.text().catch(() => "");
            throw new Error(txt || `HTTP ${res.status}`);
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
    [defaultCategory, router],
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
        <p className="font-medium">Arrastra aquí PDFs o imágenes</p>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          o haz click para seleccionar archivos (máx. 10 MB)
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
            <li key={idx} className="flex items-center justify-between rounded border border-[var(--color-border)] px-3 py-2">
              <span className="truncate flex-1">{it.name}</span>
              <span
                className={
                  it.state === "ok"
                    ? "text-green-700 dark:text-green-400"
                    : it.state === "error"
                      ? "text-red-700 dark:text-red-400"
                      : "text-[var(--color-muted)]"
                }
              >
                {it.state === "queued" && "En cola"}
                {it.state === "uploading" && "Procesando…"}
                {it.state === "ok" && "Listo para revisar"}
                {it.state === "error" && `Error: ${it.message}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
