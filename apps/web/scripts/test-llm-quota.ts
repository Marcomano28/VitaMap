/**
 * Suite de la cuota diaria de LLM (lib/llm-quota.ts).
 *
 * Invariantes que se comprueban:
 *   1. Dentro de límites, se permite y los contadores bajan de uno en uno.
 *   2. Al alcanzar el límite del actor, se deniega con `actor_daily`.
 *   3. Un actor agotado NO impide que otro distinto siga consultando.
 *   4. Al alcanzar el tope global, se deniega a todos con `global_daily`.
 *   5. El tope global manda sobre el del actor (se comprueba antes).
 *   6. Un rechazo no consume cuota.
 *   7. El interruptor de emergencia deniega sin tocar contadores.
 *   8. El reembolso devuelve la unidad al actor y al global.
 *   9. Los contadores son por día: cambiar de día reinicia la cuota.
 *  10. La cuota persiste entre "reinicios" (misma BD, módulo recargado).
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vitamap-quota-"));
const dbPath = path.join(tmpDir, "auth.sqlite");

process.env.AUTH_DB_PATH = dbPath;
process.env.DATA_ROOT = tmpDir;
process.env.KB_INDEX_PATH = path.join(tmpDir, "kb.sqlite");
process.env.MASTER_KEY = "0".repeat(64);
process.env.BETTER_AUTH_SECRET = "x".repeat(40);
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.LLM_BASE_URL = "http://localhost:8080/v1";
process.env.LLM_MODEL = "test-model";
process.env.LLM_API_KEY = "test";
process.env.QMD_EMBED_MODEL = "test";

process.env.LLM_DAILY_GLOBAL_MAX = "10";
process.env.LLM_DAILY_ANON_MAX = "3";
process.env.LLM_DAILY_USER_MAX = "5";

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  const q = await import("../lib/llm-quota");

  const DAY_A = new Date("2026-08-13T10:00:00Z");
  const DAY_B = new Date("2026-08-14T10:00:00Z");

  console.log("\n1. Dentro de límites se permite y descuenta");
  {
    const first = q.consumeLlmQuota("ana", "user", DAY_A);
    check("primera consulta permitida", first.allowed);
    check(
      "restante del actor = 4",
      first.actorRemaining === 4,
      `obtenido ${first.actorRemaining}`,
    );
    check(
      "restante global = 9",
      first.globalRemaining === 9,
      `obtenido ${first.globalRemaining}`,
    );
    check("sin motivo de rechazo", first.reason === null);
    check("resetsInSec positivo", first.resetsInSec > 0);
  }

  console.log("\n2. Límite del actor");
  {
    // 'ana' ya gastó 1 de 5. Cuatro más la agotan.
    for (let i = 0; i < 4; i += 1) q.consumeLlmQuota("ana", "user", DAY_A);
    const denied = q.consumeLlmQuota("ana", "user", DAY_A);
    check("sexta consulta denegada", !denied.allowed);
    check("motivo actor_daily", denied.reason === "actor_daily", String(denied.reason));
    check("restante del actor = 0", denied.actorRemaining === 0);
  }

  console.log("\n3. Un actor agotado no bloquea a otro");
  {
    const other = q.consumeLlmQuota("bruno", "user", DAY_A);
    check("otro usuario sigue permitido", other.allowed);
  }

  console.log("\n6. Un rechazo no consume cuota");
  {
    const before = q.quotaStatus(DAY_A).global.used;
    q.consumeLlmQuota("ana", "user", DAY_A); // denegada
    q.consumeLlmQuota("ana", "user", DAY_A); // denegada
    const after = q.quotaStatus(DAY_A).global.used;
    check("el global no se movió", before === after, `${before} -> ${after}`);
  }

  console.log("\n4/5. Tope global y su prioridad sobre el del actor");
  {
    // Gastado hasta ahora: ana 5 + bruno 1 = 6 de 10.
    const anon1 = q.consumeLlmQuota("1.2.3.4", "anon", DAY_A);
    check("anónimo permitido", anon1.allowed);
    check(
      "el anónimo tiene su propio límite (2 restantes de 3)",
      anon1.actorRemaining === 2,
      `obtenido ${anon1.actorRemaining}`,
    );

    // Llevamos 7. Tres más agotan el global.
    q.consumeLlmQuota("carla", "user", DAY_A);
    q.consumeLlmQuota("carla", "user", DAY_A);
    q.consumeLlmQuota("carla", "user", DAY_A);

    const status = q.quotaStatus(DAY_A);
    check("global agotado", status.global.remaining === 0, `${status.global.used}/10`);

    // 'diego' no ha consultado nunca: su cuota individual está intacta,
    // pero el tope global manda.
    const blocked = q.consumeLlmQuota("diego", "user", DAY_A);
    check("usuario nuevo denegado", !blocked.allowed);
    check(
      "motivo global_daily, no actor_daily",
      blocked.reason === "global_daily",
      String(blocked.reason),
    );
  }

  console.log("\n9. La cuota es por día");
  {
    const nextDay = q.consumeLlmQuota("ana", "user", DAY_B);
    check("día siguiente: permitido de nuevo", nextDay.allowed);
    check(
      "contador del actor reiniciado",
      nextDay.actorRemaining === 4,
      `obtenido ${nextDay.actorRemaining}`,
    );
    check(
      "contador global reiniciado",
      nextDay.globalRemaining === 9,
      `obtenido ${nextDay.globalRemaining}`,
    );
  }

  console.log("\n8. Reembolso");
  {
    const before = q.quotaStatus(DAY_B).global.used;
    q.refundLlmQuota("ana", "user", DAY_B);
    const after = q.quotaStatus(DAY_B).global.used;
    check("el global baja en 1", after === before - 1, `${before} -> ${after}`);
    const again = q.consumeLlmQuota("ana", "user", DAY_B);
    check(
      "la unidad devuelta se puede volver a usar",
      again.allowed && again.actorRemaining === 4,
      `restante ${again.actorRemaining}`,
    );
  }

  console.log("\n7. Interruptor de emergencia");
  {
    process.env.LLM_DISABLED = "true";
    const off = q.consumeLlmQuota("ana", "user", DAY_B);
    check("denegado con el interruptor activo", !off.allowed);
    check("motivo kill_switch", off.reason === "kill_switch", String(off.reason));

    process.env.LLM_DISABLED = "false";
    const on = q.consumeLlmQuota("ana", "user", DAY_B);
    check("permitido al desactivarlo", on.allowed);

    // Solo "true" exacto apaga: cualquier otro valor deja el servicio activo.
    process.env.LLM_DISABLED = "TRUE";
    check("solo 'true' en minúsculas apaga", q.consumeLlmQuota("ana", "user", DAY_B).allowed);
    delete process.env.LLM_DISABLED;
  }

  console.log("\n10. Persistencia entre reinicios");
  {
    const usedBefore = q.quotaStatus(DAY_B).global.used;
    // Simula reiniciar el proceso: nuevo módulo, misma base de datos.
    const fresh = await import(`../lib/llm-quota?reload=${Date.now()}`);
    const usedAfter = fresh.quotaStatus(DAY_B).global.used;
    check(
      "el contador sobrevive a la recarga del módulo",
      usedBefore === usedAfter,
      `${usedBefore} -> ${usedAfter}`,
    );
  }

  console.log("\n11. Limpieza de contadores antiguos");
  {
    const removed = q.pruneQuotaUsage(0, new Date("2026-09-30T00:00:00Z"));
    check("se eliminaron filas antiguas", removed > 0, `eliminadas ${removed}`);
    check(
      "tras limpiar, el día vuelve a estar a cero",
      q.quotaStatus(DAY_B).global.used === 0,
    );
  }

  console.log(`\n${passed} correctas, ${failed} fallidas`);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  process.exit(1);
});
