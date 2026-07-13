import path from "node:path";
import { auditCorpusLocales } from "../lib/corpus-locale-audit";

const args = process.argv.slice(2);
if (args.includes("--apply")) {
  throw new Error("This command is report-only and never applies a backfill.");
}
const json = args.includes("--json");
const roots = args.filter((arg) => !arg.startsWith("--"));
const selectedRoots = roots.length > 0
  ? roots
  : [path.resolve(process.cwd(), "../../corpus-preparation/approved-current-structure")];

const report = await auditCorpusLocales(selectedRoots);

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("Auditoría de locales del corpus (solo lectura)");
  console.log(`Tarjetas: ${report.cards} de ${report.markdownFiles} archivos Markdown`);
  console.log(
    `Locale explícito: es=${report.explicitByLocale.es}, de=${report.explicitByLocale.de}, en=${report.explicitByLocale.en}`,
  );
  console.log(`Legacy asumido como es para el informe: ${report.legacyAssumedBase}`);
  console.log(`Candidatas a revisión/backfill: ${report.backfillCandidates}`);
  console.log(`Sin tarjeta_id: ${report.missingTarjetaId.length}`);
  console.log(`Locales inválidos: ${report.invalidContentLocale.length}`);
  console.log(`Contratos parciales: ${report.partialContracts.length}`);
  console.log(`Rendiciones duplicadas: ${report.duplicateRenditions.length}`);
  console.log(`Idiomas de fuente: ${JSON.stringify(report.sourceLanguages)}`);
}
