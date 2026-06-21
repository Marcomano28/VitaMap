# Auditoria de cobertura de analiticas en `approved-current-structure`

Fecha de revision: 2026-06-20

## Alcance

Revision cruzada entre:

- `corpus-preparation/corpus-taxonomy.json`
- `corpus-preparation/approved-current-structure/**/*.md`

El objetivo es detectar huecos utiles para completar la informacion relacionada
con analiticas. No todo hueco implica que haya que crear una tarjeta: las
tarjetas D y E son opcionales segun el README, y solo conviene prepararlas
cuando una fuente adecuada anade una intencion recuperable distinta de la tarjeta
A.

## Resultado corto

La cobertura general es amplia. Frente a los marcadores definidos en
`query_groups`, el unico marcador sin presencia directa en frontmatter aprobado
es:

- `bnp`

Ademas hay varios marcadores con cobertura solo indirecta o parcial. Estos son
los candidatos mas claros para completar el bloque de analiticas.

## Prioridad alta

### `bnp`

Estado actual:

- No aparece como `marker` en tarjetas aprobadas.
- Si aparece en la taxonomia dentro de `marcadores-cardiovasculares-avanzados`.
- Hay cobertura de `nt-probnp`, y varias tarjetas relacionan NT-proBNP con BNP,
  pero no existe una tarjeta A propia para BNP.

Tarjeta sugerida:

- A: `bnp-interpretacion-medlineplus` o fuente institucional equivalente.

Motivo de recuperacion:

- "Que significa BNP alto"
- "Diferencia entre BNP y NT-proBNP"
- "Mi analitica trae BNP, no NT-proBNP"

### `calcio`

Estado actual:

- Aparece en lecturas conjuntas de metabolismo oseo.
- No hay tarjeta A propia de interpretacion del calcio.

Tarjetas sugeridas:

- A: interpretacion general de calcio en sangre.
- B o C solo si la fuente permite separar claramente calcio dietario, albumina,
  vitamina D, PTH y contexto renal.

Motivo de recuperacion:

- "Calcio alto en analitica"
- "Calcio bajo y vitamina D"
- "Calcio corregido por albumina"

### `potasio`

Estado actual:

- Existe en `marker_aliases`, pero no aparece en los `query_groups` principales
  ni en tarjetas aprobadas como `marker`.
- Es un marcador habitual de analitica y relevante para perfil renal,
  electrolitos, medicacion y seguridad.

Tarjetas sugeridas:

- A: interpretacion general de potasio.
- C: hemolisis/pseudohiperpotasemia si se encuentra una fuente adecuada.
- D: lectura conjunta con creatinina/eGFR y medicacion solo si la fuente lo
  soporta sin convertirlo en consejo clinico.

Motivo de recuperacion:

- "Potasio alto"
- "Potasio bajo"
- "Puede salir alto por la muestra"

### `transferrina`

Estado actual:

- Aparece en lectura conjunta del panel de hierro.
- No hay tarjeta A propia para transferrina.

Tarjeta sugerida:

- A: transferrina como marcador del transporte de hierro y/o componente del
  panel de hierro.

Motivo de recuperacion:

- "Transferrina alta"
- "Transferrina baja"
- "Diferencia entre transferrina, TIBC y saturacion"

## Prioridad media

### `colesterol-no-hdl`

Estado actual:

- Aparece en lectura conjunta del perfil lipidico.
- No hay tarjeta A propia.

Tarjeta sugerida:

- A: interpretacion de colesterol no-HDL como calculo derivado.

Motivo de recuperacion:

- "Que es colesterol no HDL"
- "Por que no HDL sale alto si LDL no tanto"

### Acidos grasos individuales: `epa`, `dha`, `ala`, `acido-arachidonico`,
`ratio-omega-6-omega-3`

Estado actual:

- Cubiertos en lectura conjunta del perfil de acidos grasos/omega.
- No hay tarjetas A individuales.

Decision editorial:

- Si el producto muestra estos valores como analitos separados, conviene crear
  tarjetas A breves para cada uno o una A de "perfil de acidos grasos" que los
  cubra explicitamente.
- Si solo se usan como contexto del indice omega-3, la cobertura actual puede
  ser suficiente.

Motivo de recuperacion:

- "EPA bajo"
- "DHA bajo"
- "Ratio omega 6 omega 3 alto"
- "Acido araquidonico en analitica"

### `c-peptido`

Estado actual:

- Tiene A y D.
- No tiene B/C/E.

Tarjeta sugerida:

- E solo si se quiere cubrir seguimiento de secrecion endogena/insulina propia
  con lenguaje prudente.

### `prolactina`, `dhea-s`, `shbg`, `testosterona-total`, `estradiol`,
`lh`, `fsh`

Estado actual:

- Hay cobertura hormonal relevante, pero desigual por marcador.
- Algunas tarjetas cubren el eje en lectura conjunta y seguimiento temporal,
  pero no todos los marcadores tienen B/C/E.

Decision editorial:

- No parece imprescindible completar todos con B/C/E.
- Si se priorizan preguntas frecuentes, la siguiente tanda util seria:
  prolactina seguimiento temporal, DHEA-S seguimiento/edad, SHBG lectura
  conjunta con testosterona libre/total y albumina.

## Prioridad baja o cobertura suficiente

Estos grupos ya tienen buena cobertura para RAG de analiticas:

- Perfil hepatico: ALT, AST, GGT, fosfatasa alcalina, bilirrubina, albumina,
  proteinas totales y TP/INR.
- Perfil renal: creatinina, eGFR, albuminuria, cistatina C, urea/BUN y acido
  urico, salvo el hueco de potasio si se decide incluir electrolitos.
- Glucemia/insulina: glucosa, HbA1c, insulina, HOMA-IR y peptido C.
- Inflamacion: PCR, hsCRP, VSG y ferritina.
- Hematologia basica: eritrocitos, hemoglobina, hematocrito, leucocitos y
  plaquetas.
- Vitaminas y micronutrientes principales: A, B6, B12, C, D, E, K, folato,
  magnesio y omega-3.

## Lista de trabajo recomendada

1. Crear tarjeta A para `bnp`.
2. Crear tarjeta A para `calcio`.
3. Crear tarjeta A para `potasio`.
4. Crear tarjeta A para `transferrina`.
5. Decidir si `colesterol-no-hdl` merece tarjeta A propia o basta con el perfil
   lipidico.
6. Decidir si los acidos grasos individuales necesitan tarjetas A propias segun
   como aparezcan en las analiticas reales de usuarios.
7. Revisar si `potasio` debe entrar en `query_groups.perfil-renal` o en un nuevo
   grupo de electrolitos junto con sodio/cloro si se amplian aliases.

## Nota tecnica

El cruce usado para esta auditoria mira la presencia de cada marcador en el
frontmatter `marker` de los `.md` aprobados. Por tanto:

- Si un marcador se menciona en el cuerpo de otra tarjeta pero no en
  `marker`, se considera cobertura indirecta.
- Si un marcador no esta en `query_groups` pero si en `marker_aliases`, puede ser
  un candidato futuro, no necesariamente una ausencia critica.
