import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { listCuriosityCatalog, selectCuriosityCard } from "../lib/curiosity";

function card(input: {
  id: string;
  marker: string;
  section?: string;
  type?: string;
  rights?: string;
}) {
  return `---
title: "Curiosidad ${input.id}"
source_url: "https://example.test/${input.id}"
source_type: ${input.type ?? "science-curiosity-summary"}
rights_status: ${input.rights ?? "permitted"}
tarjeta_id: ${input.id}
seccion: ${input.section ?? "curiosidad"}
marker:
  - ${input.marker}
limitations:
  - "Solo educación general."
---
# Curiosidad ${input.id}

Una explicación suficientemente larga y revisada para la prueba.
`;
}

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "vitamap-curiosity-"));
  const outside = await fs.mkdtemp(path.join(os.tmpdir(), "vitamap-curiosity-outside-"));
  try {
    await fs.mkdir(path.join(root, "institutional-education"), { recursive: true });
    await fs.writeFile(
      path.join(root, "institutional-education", "ldl.md"),
      card({ id: "curiosity-ldl", marker: "colesterol-ldl" }),
      "utf8",
    );
    await fs.writeFile(
      path.join(root, "institutional-education", "glucose.md"),
      card({ id: "curiosity-glucose", marker: "glucosa-en-ayunas" }),
      "utf8",
    );
    await fs.writeFile(
      path.join(root, "institutional-education", "wrong-section.md"),
      card({ id: "wrong-section", marker: "colesterol-ldl", section: "interpretacion" }),
      "utf8",
    );
    await fs.writeFile(
      path.join(root, "institutional-education", "wrong-rights.md"),
      card({ id: "wrong-rights", marker: "colesterol-ldl", rights: "unknown" }),
      "utf8",
    );
    await fs.writeFile(path.join(outside, "secret.md"), card({ id: "secret", marker: "tsh" }), "utf8");
    await fs.symlink(
      path.join(outside, "secret.md"),
      path.join(root, "institutional-education", "link.md"),
    );

    const allowedIds = ["curiosity-glucose", "curiosity-ldl"];
    const catalog = await listCuriosityCatalog(root, allowedIds);
    assert.deepEqual(
      catalog.map((item) => item.id).sort(),
      ["curiosity-glucose", "curiosity-ldl"],
    );

    const related = await selectCuriosityCard(root, {
      topics: ["colesterol-ldl"],
      allowedIds,
      randomIndex: () => 0,
    });
    assert.equal(related?.id, "curiosity-ldl");
    assert.equal(related?.related, true);

    const general = await selectCuriosityCard(root, {
      topics: ["sin-tarjeta"],
      allowedIds,
      randomIndex: () => 0,
    });
    assert.ok(general);
    assert.equal(general.related, false);

    const remaining = await selectCuriosityCard(root, {
      seenIds: ["curiosity-glucose"],
      allowedIds,
      randomIndex: () => 0,
    });
    assert.equal(remaining?.id, "curiosity-ldl");
    assert.equal(
      await selectCuriosityCard(root, {
        seenIds: ["curiosity-glucose", "curiosity-ldl"],
        allowedIds,
      }),
      null,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
    await fs.rm(outside, { recursive: true, force: true });
  }
}

main()
  .then(() => console.log("Curiosidades: catálogo, aislamiento y selección verificados."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
