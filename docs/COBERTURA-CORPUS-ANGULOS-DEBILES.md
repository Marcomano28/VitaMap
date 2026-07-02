# Cobertura del corpus · ángulos débiles por tema

Versión viva · última actualización: 2026-07-02
Estado: documento de seguimiento editorial (se actualiza con cada lote que se prepara para el RAG)

> Propósito: rastrear, tema a tema, **qué ángulos están cubiertos y cuáles
> faltan** en el corpus que subimos al RAG. No mide calidad de cada tarjeta
> (eso es revisión editorial), sino **completitud de intenciones**. Complementa
> a `docs/ARQUITECTURA-CORPUS-TEMATICO-Y-RECUPERACION.md` (que define el marco)
> y NO sustituye a `docs/ANALISIS-BRECHAS-FASE0.md` (brechas de código/seguridad).

> **Auditoría 2026-07-02.** Escaneo completo de
> `corpus-preparation/approved-current-structure/` (comandos en §7). El corpus
> tiene hoy **85 dossiers y 344 tarjetas**. El escaneo anterior (§4, 2026-06-18)
> quedó corto: se han incorporado tres paneles nuevos
> (**marcadores-cardiovasculares**, **metabolismo-oseo**, **omega-3**), dos
> analitos sueltos (**fosforo**, **vsg**) y diez dossiers de
> sustancias/alimentos (**alcachofa, ashwagandha, berberina, bergamota,
> cannabis, cardo-mariano, moringa, rhodiola, linaza, semillas-canamo**).
> Todo ello está ahora reflejado abajo. Los hallazgos que **cambian el estado
> de un hueco** se marcan con la etiqueta **[AUDIT 07-02]**.

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

Nota de método: los ángulos se derivan del campo `seccion:` del frontmatter
(`interpretacion`=A, `alimentacion-factores`=B, `curiosidad`=C,
`lectura-conjunta`=D, `seguimiento`=E; `identidad`/`uso-documentado`/`evidencia`/
`seguridad`/`tradicion` para sustancias y prácticas).

Clasificación de huecos:

- 🔴 **Hueco real**: falta un ángulo esencial (p. ej. un analito sin A, o una
  sustancia sin la puerta identidad/seguridad) o un marcador central queda
  demasiado fino.
- 🟡 **Enriquecimiento opcional**: ángulo ausente que aportaría, pero no bloquea.
- ⚪ **Hueco intencionado**: ausencia razonada (sin intención distinta o sin
  fuente sin convertirlo en consejo). No se debe "rellenar por cuota".

---

## 1. Huecos prioritarios (🔴 revisar pronto)

**[AUDIT 07-02] Nuevo hueco rojo — `bergamota` (grupo "perfil lipídico natural"):**
el dossier agrupa cuatro sustancias con función hipolipemiante
(**ajo**, **bergamota**, **levadura roja de arroz**, **psyllium**) pero solo
tiene tarjetas de `evidencia` (×3) y **una** de `seguridad` (levadura roja).
Falta la **puerta de identidad (M1)** para las cuatro sustancias y la
**seguridad (M4)** para tres de ellas. La levadura roja de arroz
(monacolina K ≈ lovastatina) es precisamente la de mayor riesgo de interacción,
así que la asimetría es delicada. Decidir: o se crean identidad+seguridad por
sustancia, o se re-encuadra explícitamente como "comparativa de evidencia de
un grupo funcional" con un disclaimer de que no es un dossier de especie.

**Cerrados:**
- ~~**glucosa-en-ayunas** solo A+C~~ → resuelto 2026-06-21. Dossier con A/B/C/D/E.
- ~~**vitamina-k** sin interpretación (A)~~ → resuelto 2026-06-18. Dossier con A/B/C/D.
- ~~**ashwagandha** ausente (puente adaptógeno)~~ → **[AUDIT 07-02] resuelto**.
  Existe dossier propio `ashwagandha/` (M1/M2/M3/M4 completo). Cierra el hueco
  "¿qué planta para el estrés?" que §4 (nota del eje hormonal) daba por abierto.

## 2. Enriquecimiento opcional (🟡)

| Tema | Ángulos ausentes | Nota |
|---|---|---|
| **albúmina** | B, C, D/E | Solo A. C/B nutricional defendible |
| **proteínas-totales** | B, C | Solo A |
| **tp-inr** | C, B | Solo A (su D vive en el dossier de vitamina K) |
| **bilirrubina** | B, D/E | A+C; D/E ya cubiertos a nivel panel hepático |
| **cistatina-c** | C, B/E | Solo A; su D vive en el panel renal y en filtrado-glomerular-egfr/ |
| **urea-bun** | B, D/E | A+C; D/E ya cubiertos a nivel panel renal |
| **albuminuria** | B, D/E | A+C; D/E ya cubiertos a nivel panel renal |
| **fosforo** | C, D/E individual | **[AUDIT 07-02]** A+B; D/E ya cubiertos en panel metabolismo-oseo |
| **vsg** | B (no aplica), D, E | **[AUDIT 07-02]** A+C; no hay panel de inflamación donde alojar su D con PCR |
| **tsh** | C, E | A+B+tradición; su D vive en "tiroxina libre" |
| **trigliceridos** | D (panel lipídico), E | Falta lectura conjunta del panel lipídico (LDL/HDL/TG) |
| **electrolitos (panel)** | C, E | A+B por marcador y D de panel ya cubiertos |
| **plaquetas** | D, E | A+B+C |
| **estradiol** | B (no aplica), D/E individual | **[AUDIT 07-02]** ahora A+C (antes solo A); su D vive en eje-gonadal |
| **testosterona** | B (no aplica), E | **[AUDIT 07-02]** ahora A+C+D (antes A+D) |
| **t3-tiroides** | B (no aplica), E | A+C+D; B sin intención dietética clara → ⚪ |
| **apolipoproteina-b** | B | **[AUDIT 07-02]** A+C+D+E; caso "discordancia ApoB vs LDL" ya vive en la D apob-lpa |
| **nt-probnp** | B (no aplica) | **[AUDIT 07-02]** A+C+E+D-panel; no es marcador dietético → ⚪ |
| **linaza** | seguridad (M4) | **[AUDIT 07-02]** alimento con B+C+evidencia; sin tarjeta de seguridad/interacciones |
| **semillas-canamo** | evidencia (M3) | **[AUDIT 07-02]** alimento con M1+B+M4+M2; sin capa de evidencia clínica |
| **cúrcuma** | uso-documentado (M2) | M1/M3/M4 presentes |
| **ayurveda** | (dossier fino: solo evidencia+tradición) | Revisar si necesita más capas |

## 3. Huecos intencionados (⚪ no rellenar sin intención nueva)

- **Sin B (alimentación)** para bilirrubina, albúmina, proteínas totales, TP/INR,
  bicarbonato: no hay intención dietética sin convertirlo en consejo.
- **Sin B en marcadores no dietéticos**: NT-proBNP, T3, hormonas sexuales
  (estradiol, testosterona, DHEA-S, SHBG, prolactina) → ⚪.
- **Sin capa de tradición** en enzimas hepáticas y la mayoría de analitos donde
  no hay relación clásica defendible.
- **Carpetas de metodología** (`ayuno`, `interferencias-analiticas`,
  `micronutrientes`): una sola tarjeta por diseño (son transversales).
- **C opcional** ausente en varios analitos: solo se crea si hay un dato
  memorable real.
- **Biotina sin A**: no hay marcador rutinario; la interferencia con
  inmunoensayos vive en `interferencias-analiticas/`.

---

## 4. Mapa de cobertura por dossier (reescaneo completo 2026-07-02)

Secciones presentes hoy. `(n)` = nº de tarjetas. **85 dossiers, 344 tarjetas.**

### Laboratorio — analitos
| Dossier | A | B | C | D | E | Trad. | Notas |
|---|:--:|:--:|:--:|:--:|:--:|:--:|---|
| colesterol-ldl (8) | ✅ | ✅ | ✅ | — | — | ✅ | falta D/E del panel lipídico |
| colesterol-hdl (5) | ✅ | ✅ | ✅ | — | — | ✅ (mtc) | |
| trigliceridos (4) | ✅ | ✅ | ✅ | — | — | — | 🟡 D/E |
| glucosa-en-ayunas (5) | ✅ | ✅ | ✅ | ✅ | ✅ | — | completo |
| hba1c (6) | ✅ | ✅ | ✅ | — | — | ✅ | |
| insulina (8) | ✅ | ✅ | ✅ | ✅ | ✅ | — | completo |
| creatinina (10) | ✅ | ✅ | ✅ | — | ✅? | ✅ | dossier rico |
| filtrado-glomerular-egfr (4) | ✅ | — | ✅ | ✅ | ✅ | — | + eGFR↔albuminuria (KDIGO) |
| cistatina-c (1) | ✅ | — | — | — | — | — | 🟡 marcador alternativo de eGFR |
| urea-bun (2) | ✅ | — | ✅ | — | — | — | A+C |
| albuminuria (2) | ✅ | — | ✅ | — | — | — | A+C; UACR consolidado |
| hierro (10) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | + ferritina/TIBC/saturación/ayurveda |
| hemoglobina-hematocrito (5) | ✅ | ✅ | ✅ | — | ✅ | ✅ (mtc) | |
| eritrocitos (4) | ✅ | — | — | ✅ | — | — | |
| leucocitos (5) | ✅ | ✅ | ✅ | ✅ | — | ✅ (mtc) | |
| plaquetas (3) | ✅ | ✅ | ✅ | — | — | — | 🟡 D/E |
| proteina-c-reactiva (7) | ✅ | ✅ | ✅ | ✅ | ✅ | — | completo |
| **vsg (2)** | ✅ | — | ✅ | — | — | — | **[AUDIT 07-02] nuevo**; A+C, inflamación inespecífica |
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
| calcio (3) | ✅ | ✅ | — | ✅ | — | — | eje amplio en metabolismo-oseo |
| **fosforo (2)** | ✅ | ✅ | — | — | — | — | **[AUDIT 07-02] nuevo**; A+B; D/E en metabolismo-oseo |
| potasio (4) | ✅ | ✅ | — | ✅ | ✅ | — | D acotada a potasio bajo↔magnesio |
| sodio (2) | ✅ | ✅ | — | — | — | — | A+B |
| cloruro (2) | ✅ | ✅ | — | — | — | — | A+B (sal, común con sodio) |
| bicarbonato (1) | ✅ | — | — | — | — | — | A; sin B → ⚪ (ácido-base) |
| zinc (5) | ✅ | ✅ | ✅ | — | ✅ | — | 2ª C; D zinc↔cobre vive en cobre/ |
| selenio (5) | ✅ | ✅ | ✅ | ✅ | ✅ | — | D=selenio↔tiroides |
| cobre (6) | ✅ | ✅ | ✅ | ✅ | ✅ | — | D×2 (cobre↔hierro; cobre↔zinc AREDS) |
| yodo (5) | ✅ | ✅ | ✅ | ✅ | ✅ | — | yodo urinario; D=yodo↔tiroides |
| biotina (2) | ⚪ | ✅ | ✅ | — | — | — | Sin A a propósito |
| bilirrubina (2) | ✅ | — | ✅ | — | — | — | D/E en panel hepático |
| albumina (1) | ✅ | — | — | — | — | — | 🟡 |
| proteinas-totales (1) | ✅ | — | — | — | — | — | 🟡 |
| tp-inr (1) | ✅ | — | — | — | — | — | 🟡 (D en vitamina-k) |

### Laboratorio — panel hepático (nivel grupo)
| Dossier | A (por marcador) | B | C | D | E | Notas |
|---|:--:|:--:|:--:|:--:|:--:|---|
| fosfatasa-alcalina-alt-ast-ggt (9) | ✅ | ✅ | ✅ | ✅ | ✅ | D/E cubren el panel (incl. bilirrubina/albúmina/proteínas/TP-INR) |

### Laboratorio — panel renal (nivel grupo)
| Dossier | A (por marcador) | B | C | D | E | Notas |
|---|:--:|:--:|:--:|:--:|:--:|---|
| renal (1) | ✅ (vía marcadores) | — | — | ✅ | — | Panel "función vs daño" (eGFR/creatinina/cistatina/urea ↔ albuminuria) |

### Laboratorio — panel de electrolitos (nivel grupo)
| Dossier | A (por marcador) | B | C | D | E | Notas |
|---|:--:|:--:|:--:|:--:|:--:|---|
| electrolitos (1) | ✅ (vía marcadores) | — | — | ✅ | — | Na/K/Cl/HCO₃ leídos juntos (equilibrio ácido-base, hiato aniónico) |

### Laboratorio — panel metabolismo óseo (nivel grupo) · **[AUDIT 07-02] nuevo**
| Dossier | A (por marcador) | B | C | D | E | Notas |
|---|:--:|:--:|:--:|:--:|:--:|---|
| metabolismo-oseo (6) | ✅ (PTH, osteocalcina, β-CrossLaps) | — | — | ✅ | ✅ | Remodelado óseo (CTX/osteocalcina) + eje vit-D/calcio/fosfato/PTH. Da hogar a la D/E de calcio y fósforo |

### Laboratorio — panel cardiovascular avanzado (nivel grupo) · **[AUDIT 07-02] nuevo**
| Dossier | A (por marcador) | B | C | D | E | Notas |
|---|:--:|:--:|:--:|:--:|:--:|---|
| marcadores-cardiovasculares (17) | ✅ (ApoB, Lp(a), homocisteína, NT-proBNP) | ✅ (Lp(a), homocisteína) | ✅ | ✅ | ✅ | 4 marcadores avanzados con A/C/E cada uno + D de panel. **Publica ApoB y Lp(a)**, antes bloqueados por derechos (ver §5) |

### Laboratorio — perfil de ácidos grasos (nivel grupo) · **[AUDIT 07-02] nuevo**
| Dossier | A | B | C | D | E | Notas |
|---|:--:|:--:|:--:|:--:|:--:|---|
| omega-3 (8) | ✅ (índice omega-3) | ✅ (ALA/EPA/DHA, suplementos) | ✅ | ✅ | ✅ | Índice omega-3 en membrana eritrocitaria + ratio omega-6/omega-3. Dossier casi completo |

### Laboratorio — hormonas suprarrenales y sexuales
| Dossier | A | B | C | D | E | Trad. | Notas |
|---|:--:|:--:|:--:|:--:|:--:|:--:|---|
| cortisol (5) | ✅ | — | ✅ | ✅ | ✅ | ✅ (ashwagandha) | D=cortisol↔ACTH; puente adaptógeno |
| dhea-s (2) | ✅ | — | ✅ | — | — | — | A+C; enlazado a cortisol y testosterona/estradiol |
| testosterona (4) | ✅ | — | ✅ | ✅ | — | — | **[AUDIT 07-02]** ahora A+C+D (antes A+D) |
| estradiol (2) | ✅ | — | ✅ | — | — | — | **[AUDIT 07-02]** ahora A+C (antes solo A) |
| shbg (1) | ✅ | — | — | — | — | — | 🟡 solo A; clave para fracción libre |
| prolactina (1) | ✅ | — | — | — | — | — | 🟡 solo A |
| progesterona (4) | ✅ | — | — | ✅ | ✅ | — | A + D(estradiol/ciclo) + D(LH/FSH ovulación) + E |
| lh-fsh (1) | — | — | — | ✅ | — | — | Gonadotropinas juntas; sin A individual (intencionado) |
| eje-gonadal (2) | ✅ (vía marcadores) | — | — | ✅ | ✅ | — | Panel completo (T/E2/progesterona/SHBG/LH/FSH/PRL) + seguimiento |

🔴/⚪ **Pendientes del eje hormonal:**
- Ruta `salud-hormonal` con progesterona sembrada.
- Huecos conscientes (lote separado): **17-OH-progesterona** (eje suprarrenal/HSC),
  **AMH** y **hCG** (reserva ovárica / embarazo).
- **[AUDIT 07-02]** El puente adaptógeno ya no es solo `cortisol-ashwagandha`:
  existe dossier propio `ashwagandha/`. Hueco cerrado.

### Sustancias naturales (M1–M4)
| Dossier | Identidad | Uso-doc | Evidencia | Seguridad | Notas |
|---|:--:|:--:|:--:|:--:|---|
| amalaki (4) | ✅ | ✅ | ✅ | ✅ | |
| chaga (4) | ✅ | ✅ | ✅ | ✅ | |
| jengibre (4) | ✅ | ✅ | ✅ | ✅ | |
| reishi (5) | ✅ | ✅ | ✅ | ✅ | |
| curcuma (3) | ✅ | 🟡 | ✅ | ✅ | falta M2 |
| **ashwagandha (4)** | ✅ | ✅ | ✅ | ✅ | **[AUDIT 07-02] nuevo**; adaptógeno |
| **rhodiola (4)** | ✅ | ✅ | ✅ | ✅ | **[AUDIT 07-02] nuevo**; adaptógeno |
| **berberina (7)** | ✅ | ✅ | ✅ | ✅ | **[AUDIT 07-02] nuevo**; dossier rico (glucemia/lípidos) |
| **alcachofa (5)** | ✅ | ✅ | ✅ | ✅ | **[AUDIT 07-02] nuevo** |
| **cardo-mariano (4)** | ✅ | ✅ | ✅ | ✅ | **[AUDIT 07-02] nuevo**; silimarina/hígado |
| **moringa (4)** | ✅ | ✅ | ✅ | ✅ | **[AUDIT 07-02] nuevo** |
| **cannabis (9)** | ✅ | ✅ | ✅ | ✅ | **[AUDIT 07-02] nuevo**; evidencia×5 (dolor, epilepsia, EM, náuseas) |
| **bergamota (4)** | ❌ | — | ✅ | 🟡 | **[AUDIT 07-02] 🔴 §1**; grupo hipolipemiante (ajo/bergamota/levadura roja/psyllium) sin identidad y con seguridad parcial |

### Alimentos (tipo=alimento) · **[AUDIT 07-02] nuevo bloque**
| Dossier | Identidad | Uso-doc | Evidencia | Seguridad | B (dieta) | Notas |
|---|:--:|:--:|:--:|:--:|:--:|---|
| **semillas-canamo (4)** | ✅ | ✅ | — | ✅ | ✅ | falta M3 (evidencia) |
| **linaza (4)** | — | — | ✅ | — | ✅ | 🟡 falta seguridad/interacciones; C×2 (lignanos, conversión omega-3) |

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

- **Idioma de fuente:** la inmensa mayoría son EN/US (MedlinePlus, NIDDK, CDC,
  NCCIH, ODS). Para público alemán conviene buscar equivalentes DE/EU (ver
  arquitectura §5.1). Es un eje de **calidad de fuente**, separado de la
  cobertura de ángulos.
- **Idioma del cuerpo:** no crear dos corpus independientes ES/DE. Dirección
  híbrida e incremental: cuerpo ES como base, variantes DE para top-N
  marcadores/fuentes DE-EU útiles, traducción del LLM como fallback. Ver
  arquitectura §5.2.
- **[AUDIT 07-02] Bloqueo por derechos RESUELTO — ApoB y Lp(a):** ya no están
  en borradores `metadata-only`. Ambos se publican dentro de
  `marcadores-cardiovasculares/` con fuentes de paciente (MedlinePlus para Lp(a)
  y NT-proBNP/homocisteína; MDPI para ApoB). El caso de uso "discordancia
  ApoB vs LDL" se resuelve con la lectura conjunta `apob-lpa-lectura-conjunta`.
  Retirar la nota de borrador bloqueado que arrastraba versiones anteriores.
- **Distribución de derechos (escaneo 07-02):** 309 `permitted`, 29 `licensed`,
  4 `unknown`, 2 `metadata-only`. Los 2 `metadata-only` restantes son fuentes
  clásicas MTC (Neijing/Suwen en hemoglobina y leucocitos); los 4 `unknown`
  son fuentes clásicas de tradición (acupuntura Lingshu/WHO, HDL-MTC,
  TSH-ayurveda Susrutasamhita). Revisar si `unknown` debe resolverse a
  `permitted`/`licensed` antes del piloto real.
- **Solape a vigilar (panel renal):** dos lecturas-conjuntas renales conviven a
  propósito: `filtrado-glomerular-egfr/` (KDIGO, `licensed`) y `renal/`
  (MedlinePlus, `permitted`). Si convergen, fusionar con cuidado por el distinto
  `rights_status`.
- **Rutas de salud:** `salud-piel-cabello-unas` (→ ferritina, hierro, zinc,
  biotina, selenio), `embarazo-y-lactancia` (→ yodo, ácido fólico, ferritina,
  vitamina D, B12, calcio) y `salud-hormonal`. **[AUDIT 07-02]** conviene añadir
  una ruta o query_group **cardiovascular** que enlace el panel lipídico clásico
  (LDL/HDL/TG) con los marcadores avanzados (ApoB/Lp(a)/homocisteína) para que
  "¿mi riesgo cardiovascular?" tenga ancla.
- **Solape resuelto (zinc↔cobre):** consolidado en
  `cobre/cobre-zinc-lectura-conjunta` con `marker: [cobre, zinc]`. No recrear
  desde zinc.
- **[AUDIT 07-02] Solape a vigilar (omega-3 ↔ marcadores cardiovasculares):**
  el índice omega-3 (`omega-3/`) y el panel cardiovascular avanzado tocan riesgo
  cardiovascular por vías distintas. Vigilar que sus lecturas-conjuntas no se
  pisen y decidir si comparten query_group.

---

## 6. Cómo mantener este informe

Al preparar un lote nuevo:

1. Ejecutar el escaneo de secciones por carpeta (§7) y actualizar la tabla §4.
2. Para cada tema nuevo o tocado, clasificar los ángulos ausentes en 🔴 / 🟡 / ⚪.
3. Subir a §1 lo que sea 🔴; el resto a §2 o §3.
4. Anotar en §5 cualquier bloqueo de derechos o de idioma de fuente.

La meta no es pintar todas las casillas: es que **ningún analito quede sin su A**,
que **ninguna sustancia quede sin identidad+seguridad**, que los paneles tengan su
D/E, y que las ausencias sean **decisiones conscientes**, no olvidos.

> Integridad mecánica (facetas y `evidence`): la coherencia de cada tarjeta con la
> taxonomía debería volverse un gate automático, no editorial. Ver la propuesta
> [PROPUESTA-CORPUS-LINT.md](PROPUESTA-CORPUS-LINT.md) (`corpus:lint` hermano de
> `taxonomy:check`).

---

## 7. Comandos de auditoría y acceso a la información

El corpus preparado vive en el repo bajo
`corpus-preparation/approved-current-structure/` y **QMD no lo indexa por sí
solo**: la KB activa vive en `/data/kb` del VPS y se publica desde `/admin/corpus`
o con el seed administrativo. Por eso hay dos niveles de comando: (7.1) auditar el
material preparado en el repo y (7.2) inspeccionar/consultar la KB ya publicada en
el VPS. Referencia operativa: `docs/PILOTO-FASE1-GUIA-OPERATIVA.txt` §G.

### 7.1 Auditar el corpus preparado (local, en el repo)

Reproducen exactamente este informe. Ejecutar desde
`corpus-preparation/approved-current-structure/`:

```bash
# Conteo de tarjetas por dossier
for d in */; do n=$(find "$d" -name '*.md' | wc -l); printf "%-32s %s\n" "${d%/}" "$n"; done

# Total de tarjetas y dossiers
find . -name '*.md' | wc -l
ls -d */ | wc -l

# Ángulos (seccion) presentes por dossier — base de la tabla §4
for d in */; do
  secs=$(grep -rh '^seccion:' --include='*.md' "$d" | sed 's/seccion:[[:space:]]*//' | sort | tr '\n' ',' | sed 's/,$//')
  dom=$(grep -rh '^dominio:' --include='*.md' "$d" | head -1 | sed 's/dominio:[[:space:]]*//')
  printf "%-32s [%s] %s\n" "${d%/}" "$dom" "$secs"
done

# Distribución global de secciones / dominios / rights_status
grep -rh '^seccion:'      --include='*.md' . | sed 's/seccion:[[:space:]]*//'      | sort | uniq -c | sort -rn
grep -rh '^dominio:'      --include='*.md' . | sed 's/dominio:[[:space:]]*//'      | sort | uniq -c
grep -rh '^rights_status:' --include='*.md' . | sed 's/rights_status:[[:space:]]*//' | sort | uniq -c

# Localizar sustancias sin la puerta identidad+seguridad (posibles 🔴)
for d in */; do
  dom=$(grep -rh '^dominio:' --include='*.md' "$d" | head -1 | sed 's/dominio:[[:space:]]*//')
  [ "$dom" = "sustancias-naturales" ] || continue
  has_id=$(grep -rl '^seccion:[[:space:]]*identidad'  "$d"); has_sf=$(grep -rl '^seccion:[[:space:]]*seguridad' "$d")
  [ -z "$has_id" ] && echo "SIN IDENTIDAD: ${d%/}"; [ -z "$has_sf" ] && echo "SIN SEGURIDAD: ${d%/}"
done
```

### 7.2 Inspeccionar / consultar la KB publicada (en el VPS)

Requiere SSH al VPS y ejecutar desde `/opt/vitamap-next/infra`
(ver guía operativa §G · "Corpus y KB"):

```bash
ssh root@<IP del VPS>
cd /opt/vitamap-next/infra

# Comprobar que la KB tiene documentos reales y probar una búsqueda semántica
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/check-kb.mts \
  "vitamina D valores bajos"

# Reindexar la KB compartida tras publicar tarjetas nuevas
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/seed-kb.mts

# Forzar reembed completo (si cambió el modelo de embeddings o el frontmatter)
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/seed-kb.mts --force
```

Publicación de una tarjeta preparada (interfaz): abrir
`https://vitamap.marcomano.org/admin/corpus` (sesión iniciada + correo en
`ADMIN_EMAILS`), cargar el `.md`, revisar frontmatter/derechos, guardar como
borrador, aprobar/publicar y lanzar una consulta que deba recuperar esa tarjeta.

**Sugerencia de verificación por ángulo:** para confirmar que un ángulo recién
añadido se recupera, ejecutar `check-kb.mts` con una consulta representativa del
ángulo (p. ej. `"discordancia ApoB frente a LDL"` para la D del panel
cardiovascular, o `"ashwagandha estrés cortisol"` para el puente adaptógeno) y
comprobar que la tarjeta esperada aparece entre los primeros resultados.
