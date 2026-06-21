# Cobertura del corpus · ángulos débiles por tema

Versión viva · última actualización: 2026-06-18
Estado: documento de seguimiento editorial (se actualiza con cada lote que se prepara para el RAG)

> Propósito: rastrear, tema a tema, **qué ángulos están cubiertos y cuáles
> faltan** en el corpus que subimos al RAG. No mide calidad de cada tarjeta
> (eso es revisión editorial), sino **completitud de intenciones**. Complementa
> a `docs/ARQUITECTURA-CORPUS-TEMATICO-Y-RECUPERACION.md` (que define el marco)
> y NO sustituye a `docs/ANALISIS-BRECHAS-FASE0.md` (brechas de código/seguridad).

## Cómo leerlo

Marcos de referencia (de la arquitectura §3):

- **Analitos de laboratorio (figura):** A·interpretación · B·alimentación-factores
  · C·curiosidad · D·lectura-conjunta · E·seguimiento. Solo **A es esencial**;
  B/C/D/E son oportunistas (una tarjeta solo existe si responde una intención
  real con fuente adecuada).
- **Especies/sustancias (M1–M4):** identidad · uso-documentado · evidencia ·
  seguridad. **Identidad y seguridad** son la puerta; uso/evidencia son
  condicionales.
- **Prácticas complementarias:** identidad/marco · evidencia · seguridad.
- **Tradición (T1–T3):** opcional, solo si hay relación históricamente
  defendible.

Clasificación de huecos:

- 🔴 **Hueco real**: falta un ángulo esencial (p. ej. un analito sin A) o un
  marcador central queda demasiado fino.
- 🟡 **Enriquecimiento opcional**: ángulo ausente que aportaría, pero no bloquea.
- ⚪ **Hueco intencionado**: ausencia razonada (sin intención distinta o sin
  fuente sin convertirlo en consejo). No se debe "rellenar por cuota".

---

## 1. Huecos prioritarios (🔴 revisar pronto)

| Tema | Qué falta | Por qué importa |
|---|---|---|
| **glucosa-en-ayunas** | Solo A + C. Falta **B (alimentación)**, **D (glucosa↔HbA1c)** y **E (seguimiento)** | Marcador metabólico central; hoy queda fino frente a su importancia |

**Cerrados:**
- ~~**vitamina-k** sin interpretación (A)~~ → resuelto 2026-06-18. Se creó
  `vitamina-k-interpretacion-ods.md` con encuadre honesto: el test directo existe
  pero rara vez se usa; el estado funcional se valora vía TP/INR. Dossier ahora
  con A/B/C/D.

## 2. Enriquecimiento opcional (🟡)

| Tema | Ángulos ausentes | Nota |
|---|---|---|
| **albúmina** | B, C, D/E | Recién creada (solo A). C/B nutricional defendible |
| **proteínas-totales** | B, C | Solo A |
| **tp-inr** | C, B | Solo A (su D vive en el dossier de vitamina K) |
| **bilirrubina** | B, D/E | A+C; D/E ya cubiertos a nivel panel hepático |
| **cistatina-c** | C, B/E | Solo A; su D vive en el panel renal y en filtrado-glomerular-egfr/ |
| **urea-bun** | B, D/E | A+C; D/E ya cubiertos a nivel panel renal |
| **albuminuria** | B, D/E | A+C; D/E ya cubiertos a nivel panel renal |
| **tsh** | C, E | A+B+tradición; su D vive en "tiroxina libre" |
| **trigliceridos** | D (panel lipídico), E | Falta una lectura conjunta del panel lipídico (LDL/HDL/TG) |
| **plaquetas** | D, E | A+B+C |
| **t3-tiroides** | B (no aplica), E | A+C+D; B sin intención dietética clara → ⚪ |
| **cúrcuma** | uso-documentado (M2) | M1/M3/M4 presentes |
| **ayurveda** | (dossier fino: solo evidencia+tradición) | Revisar si necesita más capas |

## 3. Huecos intencionados (⚪ no rellenar sin intención nueva)

- **Sin B (alimentación)** para bilirrubina, albúmina, proteínas totales, TP/INR:
  no hay intención dietética sin convertirlo en consejo.
- **Sin capa de tradición** en enzimas hepáticas y la mayoría de analitos donde
  no hay relación clásica defendible.
- **Carpetas de metodología** (`ayuno`, `interferencias-analiticas`,
  `micronutrientes`): una sola tarjeta por diseño (son transversales).
- **C opcional** ausente en varios analitos: solo se crea si hay un dato
  memorable real.

---

## 4. Mapa de cobertura por dossier (escaneo 2026-06-18)

Secciones presentes hoy. `(n)` = nº de tarjetas.

### Laboratorio — analitos
| Dossier | A | B | C | D | E | Trad. | Notas |
|---|:--:|:--:|:--:|:--:|:--:|:--:|---|
| colesterol-ldl (8) | ✅ | ✅ | ✅ | — | — | ✅ | falta D/E del panel lipídico |
| colesterol-hdl (5) | ✅ | ✅ | ✅ | — | — | ✅ (mtc) | |
| trigliceridos (4) | ✅ | ✅ | ✅ | — | — | — | 🟡 D/E |
| glucosa-en-ayunas (2) | ✅ | — | ✅ | — | — | — | 🔴 B/D/E |
| hba1c (6) | ✅ | ✅ | ✅ | — | — | ✅ | |
| insulina (8) | ✅ | ✅ | ✅ | ✅ | ✅ | — | completo |
| creatinina (10) | ✅ | ✅ | ✅ | — | ✅? | ✅ | dossier rico |
| filtrado-glomerular-egfr (4) | ✅ | — | ✅ | ✅ | ✅ | — | + lectura-conjunta eGFR↔albuminuria (KDIGO) |
| cistatina-c (1) | ✅ | — | — | — | — | — | 🟡 marcador alternativo de eGFR |
| urea-bun (2) | ✅ | — | ✅ | — | — | — | A+C |
| albuminuria (2) | ✅ | — | ✅ | — | — | — | A+C; marker UACR consolidado en `albuminuria` |
| hierro (10) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | + ferritina/TIBC/saturación/ayurveda (fusionado desde ferritina/) |
| hemoglobina-hematocrito (5) | ✅ | ✅ | ✅ | — | ✅ | ✅ | |
| eritrocitos (4) | ✅ | — | — | ✅ | — | — | |
| leucocitos (5) | ✅ | ✅ | ✅ | ✅ | — | ✅ | |
| plaquetas (3) | ✅ | ✅ | ✅ | — | — | — | 🟡 D/E |
| proteina-c-reactiva (7) | ✅ | ✅ | ✅ | ✅ | ✅ | — | completo |
| tsh (3) | ✅ | ✅ | — | — | — | ✅ | 🟡 C/E |
| tiroxina libre / t4 (5) | ✅ | ✅ | ✅ | ✅ | ✅ | — | completo |
| t3-tiroides (4) | ✅ | — | ✅ | ✅ | — | — | T3 + anticuerpos |
| vitamina-a (6) | ✅ | ✅ | ✅ | ✅ | — | ✅ | |
| vitamina-b12 (4) | ✅ | ✅ | ✅ | ✅ | — | — | |
| vitamina-b6 (4) | ✅ | ✅ | ✅ | ✅ | — | — | |
| vitamina-c (3) | ✅ | ✅ | ✅ | — | — | — | |
| vitamina-d (6) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | completo |
| vitamina-e (4) | ✅ | ✅ | ✅ | ✅ | — | — | |
| vitamina-k (4) | ✅ | ✅ | ✅ | ✅ | — | — | A añadida 2026-06-18 |
| acido-folico (3) | ✅ | ✅ | ✅ | — | — | — | |
| acido-urico (3) | ✅ | ✅ | ✅ | — | — | — | |
| magnesio (4) | ✅ | ✅ | ✅ | ✅ | — | — | |
| bilirrubina (2) | ✅ | — | ✅ | — | — | — | D/E en panel |
| albumina (1) | ✅ | — | — | — | — | — | 🟡 |
| proteinas-totales (1) | ✅ | — | — | — | — | — | 🟡 |
| tp-inr (1) | ✅ | — | — | — | — | — | 🟡 |

### Laboratorio — panel hepático (nivel grupo)
| Dossier | A (por marcador) | B | C | D | E | Notas |
|---|:--:|:--:|:--:|:--:|:--:|---|
| fosfatasa-alcalina-alt-ast-ggt (9) | ✅ | ✅ | ✅ | ✅ | ✅ | D/E cubren el panel completo (incl. bilirrubina/albúmina/proteínas/TP-INR) |

### Laboratorio — panel renal (nivel grupo)
| Dossier | A (por marcador) | B | C | D | E | Notas |
|---|:--:|:--:|:--:|:--:|:--:|---|
| renal (1) | ✅ (vía marcadores) | — | — | ✅ | — | Panel "función vs daño" (eGFR/creatinina/cistatina/urea ↔ albuminuria). E de eGFR vive en filtrado-glomerular-egfr/ |

### Laboratorio — hormonas suprarrenales y sexuales
| Dossier | A | B | C | D | E | Trad. | Notas |
|---|:--:|:--:|:--:|:--:|:--:|:--:|---|
| cortisol (5) | ✅ | — | ✅ | ✅ | ✅ | ✅ (ashwagandha) | D=cortisol↔ACTH; sembrado en ruta estado-animo-estres; puente adaptógeno |
| dhea-s (2) | ✅ | — | ✅ | — | — | — | A+C; enlazado a cortisol (suprarrenal) y testosterona/estradiol |
| testosterona (2) | ✅ | — | — | ✅ | — | — | A + D(testosterona↔SHBG↔estradiol); libre/biodisp. como alias |
| estradiol (1) | ✅ | — | — | — | — | — | 🟡 solo A |
| shbg (1) | ✅ | — | — | — | — | — | 🟡 solo A; clave para fracción libre |
| prolactina (1) | ✅ | — | — | — | — | — | 🟡 solo A |
| progesterona (4) | ✅ | — | — | ✅ | ✅ | — | A + D(progesterona↔estradiol ciclo) + D(progesterona↔LH/FSH ovulación) + E; ángulo ciclo/ovulación |
| lh-fsh (1) | — | — | — | ✅ | — | — | Gonadotropinas leídas juntas; sin A individual (intencionado) |
| eje-gonadal (2) | ✅ (vía marcadores) | — | — | ✅ | ✅ | — | Panel completo (T/E2/**progesterona**/SHBG/LH/FSH/PRL) + seguimiento |

🔴/⚪ **Pendientes del eje hormonal:**
- Ruta `salud-hormonal` creada (libido/menopausia/fertilidad → estas hormonas), con progesterona sembrada.
- Huecos conscientes (lote separado): **17-OH-progesterona** (eje suprarrenal/HSC), **AMH** y **hCG** (reserva ovárica / embarazo).
- Puente adaptógeno: hoy solo `cortisol-ashwagandha`. Falta dossier propio de **ashwagandha** en sustancias-naturales/ (como reishi) para cerrar "¿qué planta para el estrés?".

### Sustancias naturales (M1–M4)
| Dossier | Identidad | Uso-doc | Evidencia | Seguridad |
|---|:--:|:--:|:--:|:--:|
| amalaki (4) | ✅ | ✅ | ✅ | ✅ |
| chaga (4) | ✅ | ✅ | ✅ | ✅ |
| jengibre (4) | ✅ | ✅ | ✅ | ✅ |
| reishi (5) | ✅ | ✅ | ✅ | ✅ |
| curcuma (3) | ✅ | 🟡 | ✅ | ✅ |

### Tradiciones / prácticas complementarias
| Dossier | Identidad/marco | Evidencia | Seguridad | Tradición |
|---|:--:|:--:|:--:|:--:|
| acupuntura-conceptos (4) | — | ✅ | ✅ | ✅ |
| ayurveda (2) | — | ✅ | — | ✅ |
| constelaciones-familiares (4) | ✅ | ✅ | ✅ | — |
| flores-de-bach (4) | ✅ | ✅ | ✅ | — |
| kinesiologia-aplicada (4) | ✅ | ✅ | ✅ | — |
| terapia-craneosacral (5) | ✅ | ✅ | ✅ | — |

### Metodología / preanalítica (transversales, 1 tarjeta por diseño)
`ayuno`, `interferencias-analiticas`, `micronutrientes` — ⚪ intencionado.

---

## 5. Ejes transversales (no son "huecos de ángulo" pero afectan al RAG)

- **Idioma de fuente:** la inmensa mayoría son EN/US (MedlinePlus, NIDDK, CDC).
  Para público alemán conviene buscar equivalentes DE/EU (ver arquitectura §5.1).
  Es un eje de **calidad de fuente**, separado de la cobertura de ángulos.
- **Borradores bloqueados por derechos** (no publicables, en
  `source-material/borradores/`):
  - **ApoB** y **Lp(a)** (`metadata-only`): falta fuente DE/EU de paciente.
    Lp(a) tiene candidata (Deutsche Herzstiftung); ApoB no. Caso de uso fuerte
    pendiente: "discordancia ApoB vs LDL".
- **Solape a vigilar (panel renal):** existen dos lecturas-conjuntas renales que
  se mantienen a propósito por aportar ángulos distintos: la de
  `filtrado-glomerular-egfr/` (KDIGO, eGFR↔albuminuria con rejilla de estadios,
  `licensed`) y la de `renal/` (MedlinePlus, panel completo función-vs-daño,
  `permitted`). Si en el futuro convergen, fusionarlas con cuidado por el distinto
  `rights_status`.

---

## 6. Cómo mantener este informe

Al preparar un lote nuevo:

1. Ejecutar el escaneo de secciones por carpeta (ver §4) y actualizar la tabla.
2. Para cada tema nuevo o tocado, clasificar los ángulos ausentes en 🔴 / 🟡 / ⚪.
3. Subir a §1 lo que sea 🔴; el resto a §2 o §3.
4. Anotar en §5 cualquier bloqueo de derechos o de idioma de fuente.

La meta no es pintar todas las casillas: es que **ningún analito quede sin su A**,
que los paneles tengan su D/E, y que las ausencias sean **decisiones conscientes**,
no olvidos.
</content>
