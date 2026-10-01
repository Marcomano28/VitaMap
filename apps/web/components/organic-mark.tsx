import type { CSSProperties } from "react";

/** Purely decorative, deterministic: never encodes measurements or health status. */
export function OrganicMark() {
  return (
    <div className="organic-mark" aria-hidden="true">
      {Array.from({ length: 17 }, (_, i) => (
        <span key={i} style={{ "--ring": i } as CSSProperties} />
      ))}
    </div>
  );
}
