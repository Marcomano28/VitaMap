---
title: "Documento seed de ejemplo (placeholder)"
source_url: "https://example.org/placeholder"
evidence_level: unrated
category: example
indexed_at: 2026-06-01
notes: |
  Este documento existe solo para que QMD tenga al menos un chunk
  durante la Fase 0 inicial. Sustituir por documentos reales (guías
  NICE/ESC, abstracts PubMed curados) antes de admitir voluntarios.
---

# Ejemplo de documento seed

Este es un documento de relleno. La base de conocimiento real se irá
poblando con guías clínicas y abstracts seleccionados manualmente.

Cada documento debe declarar en el frontmatter al menos:

- `title`
- `source_url`
- `evidence_level` (uno de: cochrane-a, cochrane-b, grade-a, grade-b,
  grade-c, grade-d, guideline, tradition, unrated)
- `category`
- `indexed_at`

El campo `evidence_level` es leído por `lib/qmd.ts` y se propaga al LLM
en la etiqueta `<source level="...">`, donde el system prompt obliga al
modelo a citarlo en cada afirmación clínica.
