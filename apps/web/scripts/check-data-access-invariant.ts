/**
 * Control automático del invariante 7 (ADR-018 / propuesta §5.3):
 * ninguna ruta de datos direcciona `data/users/<id>` sin pasar por el
 * choke point `resolveDataSubject` (vía requireDataSubject*).
 *
 * Comprobaciones sobre app/**:
 *   1. Prohibido usar requireSubscribedUserId / requireSubscribedUserIdFromRequest
 *      directamente (deben usar requireDataSubject / requireDataSubjectFromRequest).
 *   2. Prohibido construir rutas "users/<id>" a mano fuera del allowlist.
 *
 * Allowlist explícito (decisiones deliberadas, ver ADR-018):
 *   - app/api/export/route.ts: exportación RGPD SOLO de datos propios;
 *     nunca debe ser direccionable a otro sujeto, por eso queda fuera
 *     del choke point (usa requireUserIdFromRequest).
 *
 * Ejecutar: npm run check:data-access  (falla con exit 1 si hay violaciones)
 */

import fs from "node:fs";
import path from "node:path";

const APP_DIR = path.join(process.cwd(), "app");

const ALLOWLIST = new Set<string>([
  path.join("app", "api", "export", "route.ts"),
]);

const FORBIDDEN: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /requireSubscribedUserId(FromRequest)?\s*\(/,
    reason:
      "usa requireDataSubject/requireDataSubjectFromRequest (lib/data-access) en rutas de datos",
  },
  {
    pattern: /join\([^)]*["'`]users["'`]/,
    reason:
      "no construyas rutas data/users/<id> a mano; usa userMemoryDir/qmd con el subject resuelto",
  },
];

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) yield full;
  }
}

const violations: string[] = [];
for (const file of walk(APP_DIR)) {
  const rel = path.relative(process.cwd(), file);
  if (ALLOWLIST.has(rel)) continue;
  const source = fs.readFileSync(file, "utf8");
  const lines = source.split("\n");
  lines.forEach((line, i) => {
    if (line.includes("import")) return; // los imports no direccionan datos
    for (const { pattern, reason } of FORBIDDEN) {
      if (pattern.test(line)) {
        violations.push(`${rel}:${i + 1} — ${reason}\n    ${line.trim()}`);
      }
    }
  });
}

if (violations.length > 0) {
  console.error("Invariante 7 VIOLADO — rutas de datos fuera del choke point:\n");
  for (const v of violations) console.error("  " + v);
  process.exit(1);
}
console.log("Invariante 7 OK: todas las rutas de datos pasan por el choke point.");
