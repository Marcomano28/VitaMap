/**
 * Banco de evaluación de recuperación (Tramo 1 · "medir antes de afinar").
 *
 * Lee los casos de `eval/*.yml` (pregunta + tarjetas esperadas) y comprueba que
 * la recuperación de la KB devuelve la tarjeta correcta. Es la regla de medir
 * que hace seguro encender cualquier mejora (acotación por marcador, grafo,
 * reranker): ninguna se despliega sin que este banco muestre que mejora.
 *
 * NOTA de implementación: crea el store QMD DIRECTAMENTE (como check-kb.mts) en
 * lugar de importar lib/qmd.ts. Motivo: apps/web es CommonJS, y al cargar un .ts
 * bajo tsx el import de @tobilu/qmd (solo-ESM) se resuelve como require y falla.
 * Un fichero .mts sí resuelve @tobilu/qmd como ESM.
 *
 * Al publicar, la app renombra cada tarjeta a `slug(titulo)-<hash>.md`, así que
 * el nombre de archivo NO se conserva en /data/kb. Por eso las tarjetas se
 * reconocen por su TÍTULO de frontmatter (que sí se conserva), con red de
 * seguridad por subcadena del slug/tarjeta_id en la ruta.
 *
 * Uso (en el VPS, contenedor admin):
 *   docker compose --env-file .env --profile tools run --rm \
 *     --entrypoint node admin --import tsx scripts/run-eval.mts --run
 *   ... --validate   # solo comprueba que las tarjetas citadas existen (sin KB)
 *   ... --k 5        # top-k (por defecto 5)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import matter from "gray-matter";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");
const evalDir = path.join(repoRoot, "eval");
const corpusRoot = path.join(repoRoot, "corpus-preparation", "approved-current-structure");
const dataRoot = process.env.DATA_ROOT?.trim() || path.join(repoRoot, "data");
const kbDir = path.join(dataRoot, "kb");
const indexPath = process.env.KB_INDEX_PATH?.trim() || path.join(dataRoot, "kb-index.sqlite");

interface EvalCase {
  query: string;
  locale?: "es" | "de";
  expected?: string[];
  must_not_prioritize?: string[];
  note?: string;
  theme?: string;
}

const argv = process.argv.slice(2);
const kFlag = argv.indexOf("--k");
const K = kFlag >= 0 ? Number(argv[kFlag + 1]) : 5;
const forceValidate = argv.includes("--validate");
const forceRun = argv.includes("--run");

// ---------------------------------------------------------------------------
// Utilidades
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

function baseId(p: string): string {
  return path.basename(p).replace(/\.md$/, "");
}

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string): string {
  return norm(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Ruta relativa de un hit QMD dentro de la colección kb (sin qmd://, sin kb/). */
function hitPath(hit: { displayPath?: string; path?: string }): string {
  return (hit.displayPath ?? hit.path ?? "")
    .replace(/^qmd:\/\//, "")
    .replace(/^\/+/, "")
    .replace(/^kb\//, "");
}

function loadCases(): EvalCase[] {
  if (!fs.existsSync(evalDir)) throw new Error(`No existe el directorio de evaluación: ${evalDir}`);
  const cases: EvalCase[] = [];
  for (const file of fs.readdirSync(evalDir).filter((f) => /\.ya?ml$/.test(f)).sort()) {
    const theme = file.replace(/\.ya?ml$/, "");
    const raw = yaml.load(fs.readFileSync(path.join(evalDir, file), "utf8"));
    if (Array.isArray(raw)) for (const item of raw as EvalCase[]) cases.push({ ...item, theme });
  }
  return cases;
}

/** Índice de tarjetas reales por nombre de archivo -> {titulo, tarjeta_id, slug}. */
interface CardMeta { title: string; tarjetaId: string; titleSlug: string }
function buildCardIndex(): Map<string, CardMeta> {
  const idx = new Map<string, CardMeta>();
  for (const file of walkMd(corpusRoot)) {
    const data = matter(fs.readFileSync(file, "utf8")).data as Record<string, unknown>;
    const title = typeof data.title === "string" ? data.title : baseId(file);
    const tarjetaId = typeof data.tarjeta_id === "string" ? data.tarjeta_id : baseId(file);
    idx.set(baseId(file), { title, tarjetaId, titleSlug: slugify(title) });
  }
  return idx;
}

const cases = loadCases();
const realBasenames = new Set(walkMd(corpusRoot).map(baseId));

// ---------------------------------------------------------------------------
// Validación de referencias (no necesita KB)
// ---------------------------------------------------------------------------

function validateReferences(): number {
  const dangling: string[] = [];
  let refs = 0;
  for (const c of cases)
    for (const id of [...(c.expected ?? []), ...(c.must_not_prioritize ?? [])]) {
      refs += 1;
      if (!realBasenames.has(id)) dangling.push(`[${c.theme}] "${c.query.slice(0, 50)}" -> ${id}`);
    }
  console.log(`\nValidación de referencias del banco:`);
  console.log(`  casos: ${cases.length} | referencias a tarjetas: ${refs} | tarjetas reales en el corpus: ${realBasenames.size}`);
  if (dangling.length === 0) console.log(`  OK: todas las tarjetas citadas existen en el corpus.`);
  else {
    console.log(`  ⚠ ${dangling.length} referencias apuntan a tarjetas inexistentes:`);
    for (const d of dangling) console.log(`     ${d}`);
  }
  return dangling.length;
}

// ---------------------------------------------------------------------------
// Ejecución real contra la KB
// ---------------------------------------------------------------------------

async function runAgainstKb(): Promise<void> {
  const { createStore } = await import("@tobilu/qmd"); // ESM directo (no via lib/qmd.ts)
  const cardIndex = buildCardIndex();

  // ¿coincide un hit con la tarjeta esperada (por su nombre de archivo)?
  // Señal principal: título de frontmatter (se conserva al publicar).
  // Red de seguridad: la ruta publicada contiene slug(titulo), tarjeta_id o el
  // propio nombre de archivo.
  function matches(hit: { title?: string; displayPath?: string; path?: string }, expectedBase: string): boolean {
    const meta = cardIndex.get(expectedBase);
    const rel = hitPath(hit);
    const relN = norm(rel);
    const hitTitle = norm(hit.title ?? "");
    if (meta) {
      if (hitTitle && hitTitle === norm(meta.title)) return true;
      if (meta.titleSlug && relN.includes(meta.titleSlug)) return true;
      if (relN.includes(norm(meta.tarjetaId))) return true;
    }
    return relN.includes(norm(expectedBase));
  }

  const store = await createStore({
    dbPath: indexPath,
    config: { collections: { kb: { path: kbDir, pattern: "**/*.md" } } },
  });

  const byTheme = new Map<string, { total: number; r1: number; r3: number; r5: number; mustNot: number }>();
  const fails: string[] = [];

  try {
    for (const c of cases) {
      const q = c.query.replace(/\s+/g, " ").trim();
      const hits = await store.search({
        queries: [
          { type: "lex", query: q },
          { type: "vec", query: q },
        ],
        rerank: false,
        limit: K,
        candidateLimit: Math.max(10, K * 2),
      });

      const expected = c.expected ?? [];
      const forbidden = c.must_not_prioritize ?? [];
      const firstExpected = hits.findIndex((h) => expected.some((e) => matches(h, e)));
      const firstForbidden = hits.findIndex((h) => forbidden.some((e) => matches(h, e)));

      const s = byTheme.get(c.theme!) ?? { total: 0, r1: 0, r3: 0, r5: 0, mustNot: 0 };
      s.total += 1;
      if (expected.length > 0 && firstExpected >= 0) {
        if (firstExpected === 0) s.r1 += 1;
        if (firstExpected < 3) s.r3 += 1;
        if (firstExpected < 5) s.r5 += 1;
      }
      const mustNotViolated =
        firstForbidden >= 0 && firstForbidden < 3 && (firstExpected < 0 || firstForbidden < firstExpected);
      if (mustNotViolated) s.mustNot += 1;
      byTheme.set(c.theme!, s);

      const ok = expected.length === 0 ? !mustNotViolated : firstExpected >= 0 && firstExpected < 3 && !mustNotViolated;
      if (!ok) {
        const shown = hits.slice(0, K).map((h) => `${(h.title ?? "?").slice(0, 45)} [${hitPath(h)}]`);
        fails.push(
          `  ✗ [${c.theme}] (${c.locale ?? "es"}) "${c.query}"\n` +
            `      esperado: ${expected.join(", ") || "—"}\n` +
            `      recuperado:\n        ${shown.join("\n        ") || "(nada)"}` +
            (mustNotViolated ? `\n      ⚠ prohibida priorizada` : ""),
        );
      }
    }
  } finally {
    await store.close();
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
    console.log(`\nCasos que fallan (esperada no en top-3, o prohibida por encima):`);
    for (const f of fails) console.log(f);
  }
  console.log(`\n(Recall@3 = la tarjeta correcta aparece entre las 3 primeras. Sube minScore/afinaciones solo si estos números mejoran.)`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const kbDocCount = walkMd(kbDir).filter((f) => path.basename(f) !== "example-seed.md").length;
const dangling = validateReferences();

if (forceValidate) process.exit(dangling > 0 ? 1 : 0);

if (!forceRun && kbDocCount < 20) {
  console.log(
    `\nLa KB (${kbDir}) tiene ${kbDocCount} documentos reales: parece no poblada en este entorno.\n` +
      `(Si sabes que la KB está poblada, fuerza la medición con --run.)\n` +
      `Se hizo solo la validación de referencias. Para medir recall, ejecuta este script\n` +
      `donde viva la KB (contenedor admin del VPS, ver eval/RUN-ON-VPS.md).`,
  );
  process.exit(dangling > 0 ? 1 : 0);
}

await runAgainstKb();
