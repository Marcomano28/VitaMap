# Auditoría de cobertura — metabolismo óseo

Grupo: metabolismo óseo / eje vitamina D – calcio – PTH – remodelado óseo  
Estado en taxonomía: pendiente de completar; `beta-crosslaps` y `osteocalcina` aún deben añadirse a `corpus-preparation/corpus-taxonomy.json`.  
Decisión editorial: conservar esta auditoría como material de trabajo fuera del corpus aprobado; las tarjetas quedan condicionadas a validación de taxonomía.

## Tarjetas generadas

1. `pth-interpretacion-medlineplus.md`  
   - Tarjeta: A · Interpretación  
   - Hueco cubierto: interpretación individual de PTH.  
   - Motivo de recuperación: “¿qué significa la PTH?”, “¿por qué se mira con calcio?”, “parathormon / Nebenschilddrüsenhormon”.  
   - Fuente principal: MedlinePlus, PTH Test, actualización 2023-12-04.  
   - Derechos: permitido / dominio público NLM para medical test information.

2. `beta-crosslaps-interpretacion-termedia.md`  
   - Tarjeta: A · Interpretación  
   - Hueco cubierto: interpretación individual de β-CTX / beta-crosslaps como marcador de resorción ósea.  
   - Motivo de recuperación: “¿qué mide beta-crosslaps?”, “CTX alto”, “resorción ósea”.  
   - Fuente principal: Postępska & Sikora, 2024, Pediatria Polska.  
   - Derechos: licencia CC BY-NC-SA 4.0; requiere conservar atribución y condiciones de licencia.

3. `osteocalcina-interpretacion-termedia.md`  
   - Tarjeta: A · Interpretación  
   - Hueco cubierto: interpretación individual de osteocalcina como marcador de formación/remodelado.  
   - Motivo de recuperación: “¿qué mide la osteocalcina?”, “osteocalcin”, “marcador de formación ósea”.  
   - Fuente principal: Postępska & Sikora, 2024, Pediatria Polska.  
   - Derechos: licencia CC BY-NC-SA 4.0.

4. `vitamina-d-calcio-fosfato-pth-eje-metabolismo-oseo-lectura-conjunta-medlineplus-ods.md`  
   - Tarjeta: D · Lectura conjunta  
   - Hueco cubierto: eje vitamina D – calcio – PTH, con calcio como contexto interpretativo de PTH.  
   - Motivo de recuperación: “¿por qué mirar vitamina D, calcio y PTH juntos?”.  
   - Fuentes principales: NIH ODS Vitamin D Fact Sheet, MedlinePlus PTH Test, MedlinePlus Calcium Blood Test.  
   - Derechos: ODS/MedlinePlus, uso permitido para contenido institucional del gobierno de EE. UU. y medical test information.

5. `marcadores-remodelado-oseo-ctx-osteocalcina-lectura-conjunta-termedia.md`  
   - Tarjeta: D · Lectura conjunta  
   - Hueco cubierto: lectura conjunta de un marcador de resorción y otro de formación/remodelado.  
   - Motivo de recuperación: “¿cómo leer beta-crosslaps y osteocalcina juntos?”.  
   - Fuente principal: Postępska & Sikora, 2024, Pediatria Polska.  
   - Derechos: CC BY-NC-SA 4.0.

6. `marcadores-remodelado-oseo-seguimiento-temporal-termedia.md`  
   - Tarjeta: E · Seguimiento temporal  
   - Hueco cubierto: comparabilidad temporal de marcadores de remodelado óseo.  
   - Motivo de recuperación: “¿se puede comparar mi CTX/osteocalcina con analíticas anteriores?”.  
   - Fuente principal: Postępska & Sikora, 2024, Pediatria Polska.  
   - Derechos: CC BY-NC-SA 4.0.

## Propuesta provisional de entrada de taxonomía

```json
{
  "metabolismo-oseo": {
    "dominio": "laboratorio",
    "tipo": ["panel", "analito", "vitamina", "mineral"],
    "marker": [
      "vitamina-d",
      "calcio",
      "pth",
      "fosfato",
      "beta-crosslaps",
      "osteocalcina"
    ],
    "categoria": ["metabolismo-oseo"],
    "muestra": ["suero", "plasma"],
    "sistema": ["osteoarticular", "endocrino-metabolico", "renal-urinario"],
    "area_de_salud": ["salud-osea", "longevidad"],
    "alias": [
      "25-oh vitamina d",
      "25(oh)d",
      "parathormona",
      "parathyroid hormone",
      "pth intacta",
      "beta-ctx",
      "ctx-i",
      "beta-crosslaps",
      "osteocalcin",
      "oc"
    ],
    "relacionado_con": [
      { "id": "vitamina-d", "relacion": "lectura_conjunta" },
      { "id": "calcio", "relacion": "lectura_conjunta" },
      { "id": "pth", "relacion": "lectura_conjunta" },
      { "id": "beta-crosslaps", "relacion": "remodelado_oseo" },
      { "id": "osteocalcina", "relacion": "remodelado_oseo" }
    ]
  }
}
```

## Huecos no cubiertos

- No se generó una tarjeta A de calcio porque el usuario indicó que faltaban PTH y marcadores de remodelado; el calcio aparece como parte de la lectura conjunta.
- No se generó tarjeta B de alimentación o dosis: el objetivo era cerrar el eje analítico, no crear pautas.
- No se incluyeron rangos de referencia numéricos para PTH, β-CTX u osteocalcina porque las fuentes principales remiten a dependencia de método, edad, sexo, contexto y laboratorio.
- No se usó una fuente alemana equivalente para β-CTX/osteocalcina; las fuentes disponibles con mejor detalle y derechos claros fueron en inglés.
