/**
 * Siembra el sujeto de datos de la demostración pública (ADR-020).
 *
 * Crea `data/users/<DEMO_SUBJECT_ID>/memory/labs/` con analíticas **sintéticas**
 * y construye su índice QMD, de modo que un visitante pueda ver la evolución
 * temporal y preguntar sobre ella sin que exista ninguna cuenta detrás.
 *
 * Dos decisiones que conviene entender antes de tocar esto:
 *
 * 1. **No se copian documentos originales.** La clave de cifrado se deriva del
 *    id del sujeto (`HMAC-SHA256(MASTER_KEY, "user:" + id)`, ver lib/crypto.ts),
 *    así que un `.age` movido a otro id queda indescifrable — la misma
 *    propiedad que hace que borrar un usuario invalide sus archivos. Y una
 *    demostración de solo lectura no necesita ofrecer descargas: la gráfica y
 *    el chat se alimentan de la memoria, que es markdown en claro.
 *
 * 2. **Es idempotente.** Volver a ejecutarlo reemplaza la memoria de
 *    demostración y reconstruye el índice. Pensado para poder regenerar la
 *    muestra cuando cambie el formato, en vez de depender de una copia manual
 *    que nadie recuerda cómo se hizo.
 *
 * Uso:
 *   node scripts/seed-demo-subject.mjs                     # desde test-data/
 *   node scripts/seed-demo-subject.mjs --from-user <id>    # clona la memoria
 *                                                          # de un usuario ya
 *                                                          # cargado
 *   node scripts/seed-demo-subject.mjs --check             # solo informa
 *
 * Requiere DATA_ROOT (y QMD_EMBED_MODEL para el indexado).
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// @tobilu/qmd se carga dinámicamente dentro de reindex(): es una dependencia
// nativa pesada, y ni `--check` ni la validación de datos sintéticos la
// necesitan. Importarla arriba haría que el script muriera por una razón que
// no tiene nada que ver con lo que se le ha pedido.

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, "..", "..", "..");

/**
 * Id fijo del sujeto de demostración. Debe cumplir el patrón de `safeUserId`
 * ([a-zA-Z0-9_-]{8,64}) y NO debe pertenecer a ninguna cuenta: es una carpeta
 * más, sin propietario, en la línea de los "cubículos" de ADR-018.
 */
const DEMO_SUBJECT_ID = "demo-public";

const SAFE_ID = /^[a-zA-Z0-9_-]{8,64}$/;

function resolveDataRoot() {
  const configured = process.env.DATA_ROOT;
  if (!configured) throw new Error("DATA_ROOT no está definido");
  return path.isAbsolute(configured)
    ? configured
    : path.resolve(workspaceRoot, configured);
}

function demoPaths(dataRoot) {
  const base = path.join(dataRoot, "users", DEMO_SUBJECT_ID);
  return {
    base,
    memory: path.join(base, "memory"),
    labs: path.join(base, "memory", "labs"),
    index: path.join(base, "index.sqlite"),
  };
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Comprueba que un markdown de laboratorio es sintético antes de publicarlo.
 * Barrera deliberada: este script escribe en una carpeta que verá cualquiera,
 * y un descuido aquí publicaría datos de salud reales.
 */
async function assertSynthetic(file) {
  const raw = await fs.readFile(file, "utf8");
  const labMatch = raw.match(/^lab_name:\s*(.+)$/m);
  const lab = (labMatch?.[1] ?? "").trim().toLowerCase();

  const synthetic = [
    "ficticio",
    "fictici",
    "beispiel",
    "example",
    "ejemplo",
    "synthetic",
    "sintetic",
    "demo",
  ];

  if (!synthetic.some((marker) => lab.includes(marker))) {
    throw new Error(
      `"${path.basename(file)}" tiene lab_name="${labMatch?.[1] ?? "(ninguno)"}", ` +
        `que no parece sintético.\n` +
        `Este script solo publica datos ficticios. Si de verdad lo es, añade una ` +
        `palabra reconocible al lab_name (Ficticio / Beispiel / Ejemplo / Demo).`,
    );
  }
}

async function collectSources(dataRoot, fromUser) {
  if (fromUser) {
    if (!SAFE_ID.test(fromUser)) {
      throw new Error(`--from-user "${fromUser}" no es un id válido`);
    }
    if (fromUser === DEMO_SUBJECT_ID) {
      throw new Error("--from-user no puede ser el propio sujeto de demostración");
    }
    const labs = path.join(dataRoot, "users", fromUser, "memory", "labs");
    if (!(await exists(labs))) {
      throw new Error(`No existe ${labs}`);
    }
    const files = (await fs.readdir(labs))
      .filter((f) => f.endsWith(".md"))
      .map((f) => path.join(labs, f));
    return { origin: `usuario ${fromUser}`, files };
  }

  // Origen por defecto: los .txt de test-data/ no sirven (son texto plano de
  // los PDF, no markdown con frontmatter), así que exigimos --from-user hasta
  // que exista un generador de memoria a partir de expected.json.
  throw new Error(
    "Sin --from-user no hay origen. Los ficheros de test-data/ son PDF y texto\n" +
      "plano, no memoria con frontmatter: hay que haberlos subido una vez por la\n" +
      "aplicación para que exista la memoria derivada.\n\n" +
      "Uso: node scripts/seed-demo-subject.mjs --from-user <id-del-usuario>",
  );
}

async function reindex(paths) {
  const { createStore } = await import("@tobilu/qmd");
  const store = await createStore({
    dbPath: paths.index,
    config: {
      collections: {
        memory: { path: paths.memory, pattern: "**/*.md" },
      },
    },
  });
  try {
    await store.update({ collections: ["memory"] });
    await store.embed({ force: false });
  } finally {
    await store.close();
  }
}

async function report(dataRoot) {
  const paths = demoPaths(dataRoot);
  if (!(await exists(paths.labs))) {
    console.log(`[demo] sin sembrar — no existe ${paths.labs}`);
    return;
  }
  const files = (await fs.readdir(paths.labs)).filter((f) => f.endsWith(".md"));
  console.log(`[demo] sujeto: ${DEMO_SUBJECT_ID}`);
  console.log(`[demo] memoria: ${files.length} ficheros`);
  for (const f of files) console.log(`         · ${f}`);
  console.log(
    `[demo] índice: ${(await exists(paths.index)) ? "presente" : "AUSENTE"}`,
  );
  const docs = path.join(paths.base, "documents");
  console.log(
    `[demo] documentos: ${(await exists(docs)) ? "PRESENTES (no deberían)" : "ninguno (correcto)"}`,
  );
}

async function main() {
  const args = process.argv.slice(2);
  const dataRoot = resolveDataRoot();

  if (args.includes("--check")) {
    await report(dataRoot);
    return;
  }

  const fromUserIdx = args.indexOf("--from-user");
  const fromUser = fromUserIdx >= 0 ? args[fromUserIdx + 1] : null;

  const { origin, files } = await collectSources(dataRoot, fromUser);
  if (files.length === 0) {
    throw new Error(`No se encontraron ficheros .md en ${origin}`);
  }

  console.log(`[demo] origen: ${origin} (${files.length} ficheros)`);

  // Barrera de seguridad ANTES de escribir nada.
  for (const f of files) await assertSynthetic(f);
  console.log("[demo] todos los ficheros pasan la comprobación de sintéticos");

  const paths = demoPaths(dataRoot);

  // Idempotencia: se rehace la memoria y el índice desde cero.
  await fs.rm(paths.base, { recursive: true, force: true });
  await fs.mkdir(paths.labs, { recursive: true });

  for (const f of files) {
    await fs.copyFile(f, path.join(paths.labs, path.basename(f)));
  }
  console.log(`[demo] memoria copiada a ${paths.labs}`);

  console.log("[demo] construyendo índice QMD (puede tardar)...");
  await reindex(paths);
  console.log("[demo] índice listo");

  await report(dataRoot);
  console.log(
    "\n[demo] Recuerda: este sujeto NO tiene propietario ni grants. La vista de\n" +
      "       demostración debe ser de solo lectura por construcción.",
  );
}

main().catch((err) => {
  console.error(`\n[demo] ERROR: ${err.message}\n`);
  process.exit(1);
});
