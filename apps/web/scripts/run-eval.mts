/**
 * Banco de evaluación de recuperación (Tramo 1 · "medir antes de afinar").
 *
 * Lee los casos de `eval/*.yml` (pregunta + tarjetas esperadas) y comprueba que
 * la recuperación de la KB devuelve la tarjeta correcta. Es la regla de medir
 * que hace seguro encender cualquier mejora (acotación por marcador, grafo,
 * reranker): ninguna se despliega sin que este banco muestre que mejora.
 *
 * Dos modos:
 *   --validate  (por defecto si la KB está vacía): comprueba que cada tarjeta
 *               citada en el banco existe de verdad en el corpus. No necesita KB.
 *   (normal)    ejecuta la recuperación real y reporta recall@1/@3/@5 por tema,
 *               en español y alemán. Requiere la KB poblada (data/kb).
 *
 * Uso:
 *   cd apps/web
 *   npx tsx scripts/run-eval.mts            # ejecuta o valida según haya KB
 *   npx tsx scripts/run-eval.mts --validate # solo valida referencias
 *   npx tsx scripts/run-eval.mts --k 5      # top-k (por defecto 5)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");
const evalDir = path.join(repoRoot, "eval");
const corpusRoot = path.join(repoRoot, "corpus-preparation", "approved-current-structure");
// La KB real vive en el volumen DATA_ROOT (p. ej. /data/kb dentro del contenedor
// admin del VPS). En local, sin DATA_ROOT, cae a repoRoot/data/kb (suele estar
// vacío salvo la semilla). Esto evita medir contra una carpeta equivocada.
const kbDir = process.env.DATA_ROOT
  ? path.join(process.env.DATA_ROOT, "kb")
  : path.join(repoRoot, "data", "kb");

interface EvalCase {
  query: string;
  locale?: "es" | "de";
  expected?: string[];
  must_not_prioritize?: string[];
  note?: string;
  // añadidos al cargar:
  theme?: string;
}

const argv = process.argv.slice(2);
const kFlag = argv.indexOf("--k");
const K = kFlag >= 0 ? Number(argv[kFlag + 1]) : 5;
const forceValidate = argv.includes("--validate");
const forceRun = argv.includes("--run"); // fuerza la medición aunque el conteo de KB parezca bajo

// ---------------------------------------------------------------------------
// Carga de casos y del corpus real
// ---------------------------------------------------------------------------

function walkMd(root: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(root)) return out;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const abs = path.join(root, entry.name);
    if (entry.isDirectory()) out.push(...walkMd(abs));
    else if (entry.name.endsWith(".md")) out.push(abs);
  }
  return out;
}

function basename(p: string): string {
  return path.basename(p).replace(/\.md$/, "");
}

function loadCases(): EvalCase[] {
  if (!fs.existsSync(evalDir)) {
    throw new Error(`No existe el directorio de evaluación: ${evalDir}`);
  }
  const cases: EvalCase[] = [];
  for (const file of fs.readdirSync(evalDir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml")).sort()) {
    const theme = file.replace(/\.ya?ml$/, "");
    const raw = yaml.load(fs.readFileSync(path.join(evalDir, file), "utf8"));
    if (!Array.isArray(raw)) continue;
    for (const item of raw as EvalCase[]) {
      cases.push({ ...item, theme });
    }
  }
  return cases;
}

const realCards = new Set(walkMd(corpusRoot).map(basename));
const cases = loadCases();

// ---------------------------------------------------------------------------
// Validación de referencias (no necesita KB)
// ---------------------------------------------------------------------------

function validateReferences(): number {
  const dangling: string[] = [];
  let refs = 0;
  for (const c of cases) {
    for (const id of [...(c.expected ?? []), ...(c.must_not_prioritize ?? [])]) {
      refs += 1;
      if (!realCards.has(id)) dangling.push(`[${c.theme}] "${c.query.slice(0, 50)}" -> ${id}`);
    }
  }
  console.log(`\nValidación de referencias del banco:`);
  console.log(`  casos: ${cases.length} | referencias a tarjetas: ${refs} | tarjetas reales en el corpus: ${realCards.size}`);
  if (dangling.length === 0) {
    console.log(`  OK: todas las tarjetas citadas existen en el corpus.`);
  } else {
    console.log(`  ⚠ ${dangling.length} referencias apuntan a tarjetas inexistentes:`);
    for (const d of dangling) console.log(`     ${d}`);
  }
  return dangling.length;
}

// ---------------------------------------------------------------------------
// Ejecución real contra la KB
// ---------------------------------------------------------------------------

async function runAgainstKb(): Promise<void> {
  // Import perezoso: solo cargamos QMD (nativo, modelo de embeddings) si de
  // verdad vamos a ejecutar. Así --validate corre sin dependencias pesadas.
  const { queryKB } = await import("../lib/qmd.ts");

  const byTheme = new Map<string, { total: number; r1: number; r3: number; r5: number; mustNot: number }>();
  const fails: string[] = [];

  for (const c of cases) {
    const results = await queryKB(c.query, { limit: K, minScore: 0.2, locale: c.locale ?? "es" });
    const ranked = results.map((r) => basename(r.path));
    const expected = new Set(c.expected ?? []);
    const forbidden = new Set(c.must_not_prioritize ?? []);

    const firstExpectedPos = ranked.findIndex((b) => expected.has(b)); // 0-based, -1 si no está
    const firstForbiddenPos = ranked.findIndex((b) => forbidden.has(b));

    const stats = byTheme.get(c.theme!) ?? { total: 0, r1: 0, r3: 0, r5: 0, mustNot: 0 };
    stats.total += 1;
    if (expected.size > 0) {
      if (firstExpectedPos === 0) stats.r1 += 1;
      if (firstExpectedPos >= 0 && firstExpectedPos < 3) stats.r3 += 1;
      if (firstExpectedPos >= 0 && firstExpectedPos < 5) stats.r5 += 1;
    }
    // Violación must_not: una tarjeta prohibida aparece por encima de la esperada
    // (o en top-3 cuando no se recupera ninguna esperada).
    const mustNotViolated =
      firstForbiddenPos >= 0 &&
      firstForbiddenPos < 3 &&
      (firstExpectedPos < 0 || firstForbiddenPos < firstExpectedPos);
    if (mustNotViolated) stats.mustNot += 1;
    byTheme.set(c.theme!, stats);

    const ok = expected.size === 0 ? !mustNotViolated : firstExpectedPos >= 0 && firstExpectedPos < 3 && !mustNotViolated;
    if (!ok) {
      fails.push(
        `  ✗ [${c.theme}] (${c.locale ?? "es"}) "${c.query}"\n` +
          `      esperado: ${[...expected].join(", ") || "—"}\n` +
          `      recuperado: ${ranked.slice(0, K).join(", ") || "(nada)"}` +
          (mustNotViolated ? `\n      ⚠ prohibida priorizada: ${ranked[firstForbiddenPos]}` : ""),
      );
    }
  }

  console.log(`\nResultados de recuperación (top-${K}, recall por tema):`);
  console.log(`  tema                         casos  R@1   R@3   R@5   must-not✗`);
  let T = 0, R1 = 0, R3 = 0, R5 = 0, MN = 0;
  for (const [theme, s] of [...byTheme.entries()].sort()) {
    T += s.total; R1 += s.r1; R3 += s.r3; R5 += s.r5; MN += s.mustNot;
    const pct = (n: number) => `${Math.round((100 * n) / s.total)}%`.padStart(4);
    console.log(`  ${theme.padEnd(28)} ${String(s.total).padStart(4)}  ${pct(s.r1)}  ${pct(s.r3)}  ${pct(s.r5)}   ${s.mustNot}`);
  }
  const g = (n: number) => `${Math.round((100 * n) / T)}%`.padStart(4);
  console.log(`  ${"TOTAL".padEnd(28)} ${String(T).padStart(4)}  ${g(R1)}  ${g(R3)}  ${g(R5)}   ${MN}`);

  if (fails.length) {
    console.log(`\nCasos que fallan (esperada no en top-3, o tarjeta prohibida por encima):`);
    for (const f of fails) console.log(f);
  }
  console.log(`\n(Recall@3 = la tarjeta correcta aparece entre las 3 primeras. Sube minScore/afinaciones solo si estos números mejoran.)`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const kbDocCount = walkMd(kbDir).length;
const dangling = validateReferences();

if (forceValidate) {
  process.exit(dangling > 0 ? 1 : 0);
}

if (!forceRun && kbDocCount < 20) {
  console.log(
    `\nLa KB (${kbDir}) tiene ${kbDocCount} documentos: parece no poblada en este entorno.\n` +
      `(Si sabes que la KB está poblada, fuerza la medición con --run.)\n` +
      `Se hizo solo la validación de referencias. Para medir recall, publica el corpus a\n` +
      `data/kb (import) y vuelve a ejecutar este script donde viva la KB (p. ej. el VPS).`,
  );
  process.exit(dangling > 0 ? 1 : 0);
}

await runAgainstKb();
