import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ocrPdf } from "../lib/ocr";

async function main() {
  const fixture = path.resolve(
    __dirname,
    "../../../test-data/analitica-sintetica-01.pdf",
  );
  const pdf = new Uint8Array(fs.readFileSync(fixture));
  const result = await ocrPdf(pdf);

  assert.equal(result.source, "pdf-native");
  assert.equal(result.pages, 1);
  assert.match(result.text, /Glucosa\s+en\s+ayunas\s+112/);
  assert.match(result.text, /Vitamina\s+D\s+18/);
  console.log("OCR: todas las pruebas pasaron.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
