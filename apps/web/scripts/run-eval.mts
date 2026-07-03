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
const listKb = argv.includes("--list"); // vuelca la KB publicada (ruta + título)

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
      if (meta.titleSlug) {
        if (relN.includes(meta.titleSlug)) return true;
        // Al publicar, el slug del título se trunca (~72 chars) y a veces se
        // edita el título ("por qué"->"cómo"). Casar por un prefijo distintivo.
        const prefix = meta.titleSlug.slice(0, 40);
        if (prefix.length >= 16 && relN.includes(prefix)) return true;
      }
      if (relN.includes(norm(meta.tarjetaId))) return true;
    }
    return relN.includes(norm(expectedBase));
  }

  // Pipeline del filtro (marker-scope), el mismo que el chat con KB_MARKER_SCOPE
  // encendido. Se importa vía .default por la interoperabilidad CJS de apps/web.
  const scope = ((await import("../lib/marker-scope.ts")) as unknown as {
    default: {
      deriveScope: (q: string, prior?: string[]) => { markers: Set<string>; lens: Set<string>; healthAreas: Set<string> };
      filterByMarkers: <T extends { path: string; title: string; marker?: unknown }>(d: readonly T[], a: ReadonlySet<string>) => T[];
      applyLensPreference: <T extends { tradicion?: string; seccion?: string }>(d: readonly T[], l: ReadonlySet<string>) => T[];
      applyHealthAreaPreference: <T extends { areaDeSalud?: readonly string[] }>(d: readonly T[], a: ReadonlySet<string>) => T[];
    };
  }).default;

  // Facetas de un hit (marker/tradición/sección/área) desde su fichero publicado,
  // necesarias para el filtro. Cacheado por ruta.
  interface Chunk { path: string; title: string; marker?: string[]; tradicion?: string; seccion?: string; areaDeSalud?: string[] }
  const facetCache = new Map<string, Chunk>();
  const strArr = (v: unknown): string[] | undefined =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : typeof v === "string" ? [v] : undefined;
  function chunkFor(hit: { title?: string; displayPath?: string; path?: string }): Chunk {
    const rel = hitPath(hit);
    let ch = facetCache.get(rel);
    if (!ch) {
      let data: Record<string, unknown> = {};
      try { data = matter(fs.readFileSync(path.join(kbDir, rel), "utf8")).data as Record<string, unknown>; } catch {}
      ch = {
        path: rel,
        title: hit.title ?? (typeof data.title === "string" ? data.title : ""),
        marker: strArr(data.marker),
        tradicion: typeof data.tradicion === "string" ? data.tradicion : undefined,
        seccion: typeof data.seccion === "string" ? data.seccion : undefined,
        areaDeSalud: strArr(data.area_de_salud),
      };
      facetCache.set(rel, ch);
    }
    return ch;
  }

  const store = await createStore({
    dbPath: indexPath,
    config: { collections: { kb: { path: kbDir, pattern: "**/*.md" } } },
  });

  interface Stat { total: number; r1: number; r3: number; mustNot: number }
  const mkStat = (): Stat => ({ total: 0, r1: 0, r3: 0, mustNot: 0 });
  const rawByTheme = new Map<string, Stat>();
  const scopedByTheme = new Map<string, Stat>();
  const changed: string[] = [];
  let rawOff = 0, scopedOff = 0; // intrusiones de otro tema en top-3

  type Hit = { title?: string; displayPath?: string; path?: string };
  const locate = (ranked: Array<Hit | Chunk>, keys: string[]): number =>
    ranked.findIndex((h) => keys.some((k) => matches(h, k)));
  function tally(m: Map<string, Stat>, theme: string, expected: string[], fe: number, mn: boolean): void {
    const s = m.get(theme) ?? mkStat();
    s.total += 1;
    if (expected.length > 0 && fe >= 0) { if (fe === 0) s.r1 += 1; if (fe < 3) s.r3 += 1; }
    if (mn) s.mustNot += 1;
    m.set(theme, s);
  }
  const passed = (expected: string[], fe: number, mn: boolean) =>
    expected.length === 0 ? !mn : fe >= 0 && fe < 3 && !mn;

  try {
    for (const c of cases) {
      const q = c.query.replace(/\s+/g, " ").trim();
      const hits: Hit[] = await store.search({
        queries: [{ type: "lex", query: q }, { type: "vec", query: q }],
        rerank: false,
        limit: 20,
        candidateLimit: 30,
      });
      const expected = c.expected ?? [];
      const forbidden = c.must_not_prioritize ?? [];

      // CRUDO: orden de QMD tal cual (lo que hace producción hoy).
      const raw = hits.slice(0, K);
      const rFe = locate(raw, expected);
      const rFf = locate(raw, forbidden);
      const rMn = rFf >= 0 && rFf < 3 && (rFe < 0 || rFf < rFe);

      // FILTRADO: pipeline marker-scope (filtro fuerte por marcador + lente + área).
      const sc = scope.deriveScope(q, []);
      const chunks = hits.map(chunkFor);
      const filtered = scope
        .applyHealthAreaPreference(
          scope.applyLensPreference(scope.filterByMarkers(chunks, sc.markers), sc.lens),
          sc.healthAreas,
        )
        .slice(0, K);
      const sFe = locate(filtered, expected);
      const sFf = locate(filtered, forbidden);
      const sMn = sFf >= 0 && sFf < 3 && (sFe < 0 || sFf < sFe);

      tally(rawByTheme, c.theme!, expected, rFe, rMn);
      tally(scopedByTheme, c.theme!, expected, sFe, sMn);

      // Intrusiones de otro tema en el top-3 (lo que el filtro debe limpiar).
      if (sc.markers.size > 0) {
        const offCount = (list: Chunk[]) =>
          list.slice(0, 3).filter((ch) => {
            const mk = ch.marker ?? [];
            if (mk.length === 0 || mk.includes("general")) return false;
            return !mk.some((x) => sc.markers.has(x));
          }).length;
        rawOff += offCount(raw.map(chunkFor));
        scopedOff += offCount(filtered);
      }

      const rawOk = passed(expected, rFe, rMn);
      const scopedOk = passed(expected, sFe, sMn);
      if (rawOk !== scopedOk) {
        changed.push(
          `  ${scopedOk ? "✅ mejora" : "⚠ empeora"} [${c.theme}] "${c.query}"  (marcadores del filtro: ${[...sc.markers].join(", ") || "—"})`,
        );
      }
    }
  } finally {
    await store.close();
  }

  console.log(`\nComparativa CRUDO vs FILTRADO (marker-scope), recall@3 por tema:`);
  console.log(`  tema                         casos  R@3 crudo  R@3 filtrado   must-not (crudo/filtrado)`);
  let T = 0, rR3 = 0, sR3 = 0, rMN = 0, sMN = 0;
  for (const theme of [...rawByTheme.keys()].sort()) {
    const r = rawByTheme.get(theme)!;
    const s = scopedByTheme.get(theme)!;
    T += r.total; rR3 += r.r3; sR3 += s.r3; rMN += r.mustNot; sMN += s.mustNot;
    const p = (n: number, tot: number) => `${Math.round((100 * n) / tot)}%`.padStart(4);
    console.log(`  ${theme.padEnd(28)} ${String(r.total).padStart(4)}     ${p(r.r3, r.total)}       ${p(s.r3, s.total)}            ${r.mustNot} / ${s.mustNot}`);
  }
  const g = (n: number) => `${Math.round((100 * n) / T)}%`.padStart(4);
  console.log(`  ${"TOTAL".padEnd(28)} ${String(T).padStart(4)}     ${g(rR3)}       ${g(sR3)}            ${rMN} / ${sMN}`);

  console.log(`\nIntrusiones de otro tema en el top-3 (fugas):  crudo ${rawOff}  →  filtrado ${scopedOff}`);
  if (changed.length) {
    console.log(`\nCasos donde el filtro cambia el resultado:`);
    for (const n of changed) console.log(n);
  } else {
    console.log(`\n(El filtro no volteó ningún caso pasa/falla; mira el R@3 y las fugas para su efecto.)`);
  }
  console.log(`\nCRUDO = búsqueda tal cual (producción hoy). FILTRADO = con KB_MARKER_SCOPE encendido.`);
  console.log(`Regla: encender el filtro solo si el R@3 filtrado IGUALA o SUPERA al crudo y baja las fugas.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

// Modo --list: volcar la KB publicada (ruta + título) para realinear el banco.
if (listKb) {
  const files = walkMd(kbDir);
  console.log(`\nKB publicada en ${kbDir} — ${files.length} documentos (ruta | título):\n`);
  const rows = files
    .map((f) => {
      let title = "";
      try {
        title = String((matter(fs.readFileSync(f, "utf8")).data as Record<string, unknown>).title ?? "");
      } catch {}
      return { rel: path.relative(kbDir, f), title };
    })
    .sort((a, b) => a.rel.localeCompare(b.rel));
  for (const r of rows) console.log(`  ${r.rel}\n      → ${r.title}`);
  process.exit(0);
}

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
