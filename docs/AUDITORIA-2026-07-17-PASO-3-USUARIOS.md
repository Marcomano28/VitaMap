# Auditoría completa · Paso a la etapa de 3 usuarios

Fecha: 2026-07-17
Alcance: bloqueantes go-live · biblioteca base RAG · prompts (incl. Hermes) ·
tarjetas de curiosidades · estética visual diurna.
Fuentes internas cruzadas: `CHECKLIST-GO-LIVE-PILOTO-REAL.md`,
`AUDITORIA-2026-07-02.md`, `ROADMAP.md`,
`HOJA-DE-RUTA-MULTILINGUE-NIVELES-Y-CURIOSIDAD.md`,
`COBERTURA-CORPUS-ANGULOS-DEBILES.md`, `lib/llm.ts`, `app/api/chat/route.ts`,
`corpus-preparation/PROMPT-HERMES-AYURVEDA-FUENTES-SKILL.md`,
`corpus-preparation/PROMPT-PAUSA-CURIOSA.md`, `app/globals.css`.

---

## 1. ¿Qué falta para pasar a 3 usuarios?

El paso a tres usuarios con datos reales está gobernado por el checklist go-live
y sus seis puertas. Hoy **ninguna puerta está cerrada**. El trabajo técnico
pendiente es manejable; el cuello de botella real es legal (Frente C) y la
autorización escrita (Puerta 4).

### Bloqueantes técnicos 🔴 (Frente A/B, impiden dato real)

Abiertos y sin evidencia todavía:

- **MFA (TOTP/passkey) + recuperación** (A#3): no implementado.
- **Allowlist MIME + magic bytes en `/api/upload`** (A#4): rechazo de fichero no
  permitido sin test.
- **Backup consistente de SQLite en caliente** (`.backup`/`VACUUM INTO`, A#2) +
  **prueba de restauración real** desde B2 (hoy hay 58 snapshots y `restic check`
  OK, pero nunca se restauró de verdad).
- **Verificación de email + recuperación desde producción (Brevo)** sin enumerar
  cuentas. Nota pendiente: el log de ERROR registra el email consultado (fuga P1)
  y el primer correo cayó en spam (dominio nuevo, calentar + marcar "no spam").
- **Anclaje externo del hash de auditoría** (fuera del VPS).
- **Borrado extremo a extremo** que cubra originales + derivados + índices +
  inbox + temporales de OCR, con simulacro sin residuos.
- **Cifrado de disco (LUKS)**: `sda1` es ext4 plano. Es decisión documentada
  (ADR-015, difiere LUKS a Fase 2 como riesgo aceptado), **pero la DSFA debe
  aceptar explícitamente ese riesgo residual** antes de dato real. No es tarea
  técnica nueva, es validación legal.

### Recomendados 🟡 antes de abrir

- Test de rutas protegidas sin sesión (401/redirect).
- Semáforo global de generaciones LLM (concurrencia 1–2 + cola) probado bajo carga.
- CI mínima (GitHub Actions: install→typecheck→lint→tests→`npm audit`).
- `web` corre como root en el Dockerfile (audit #5 confirmado; el entrypoint baja
  a `node` vía `setpriv`, pero conviene fijar `USER` explícito).
- SSH sin endurecer: fijar `PermitRootLogin prohibit-password` y
  `PasswordAuthentication no`. UFW ya correcto (22/80/443).
- Sin swap (0 B): si se vuelve a LLM local (~4 GB) añadir swap.
- Sustituir credenciales GitHub CLI en `root` por deploy key de solo lectura.

### Ya cerrado ✅ (no repetir)

`next` parcheado a 15.5.20 en producción; los cuatro flags amarillos
(`ASSESSMENTS_ENABLED`, `ASSISTANT_EDU_GUIDE`, `KB_MARKER_SCOPE`,
`RETRIEVAL_DEBUG`) en `false`; `billing_subscription` limpio (solo fila LIVE);
solo cuenta admin sintética en la BD; `audit_chain: ok`; backups íntegros;
firewall activo.

### LLM externo (Mistral) — condición dura para dato real

`LLM_PROVIDER=external` con **Mistral AI (FR/UE), `mistral-small-latest`**. El
chat envía memoria personal (potencial Art. 9) en hasta 5 pasadas por turno.
Válido en fase sintética por ADR-014. Para dato real hacen falta (borradores en
`BORRADOR-TRANSFERENCIA-LLM-MISTRAL.md`): (a) DPA Art. 28 con Mistral; (b)
opt-out de entrenamiento por escrito; (c) addendum a ADR-014; (d) cláusula de
consentimiento; (e) párrafo de privacidad; (f) línea en Registro Art. 30 + DSFA.

### Bloqueante mayor: Frente C (legal)

**Todas** las casillas legales siguen abiertas: operador y forma jurídica, alta
fiscal, informe MDR revisado por especialista, DSFA/DPIA terminada, necesidad de
DPO, Registro Art. 30, contratos Art. 28 (Hetzner/Backblaze/Stripe/Mistral/DNS),
Impressum + privacidad + condiciones publicados, botón de cancelación §312k,
desistimiento §355, procedimiento de brechas 72 h, nota de alfabetización IA
(Art. 4 Reglamento IA).

### Veredicto etapa 3 usuarios

- **Camino más corto:** cerrar el paquete de 7 bloqueantes técnicos (MFA, MIME,
  backup+restore, email prod, anclaje hash, borrado E2E, aceptación DSFA de
  ADR-015) → desplegar y verificar Puertas 1–2 → cerrar Frente C con firma
  profesional (Puerta 3) → 48 h sin errores + autorización escrita (Puerta 4).
- **Estimación realista:** el trabajo técnico es de días; **Frente C es el que
  marca el calendario** y depende de asesoría externa.
- Recordar: los tres primeros pagan 6 €/mes por invitación (18 €/mes cubren VPS
  16,65 €/mes). El precio no se recalcula automáticamente.

---

## 2. Tarjetas que faltan para completar la biblioteca base RAG

Estado hoy: **85 dossiers · 344 tarjetas** aprobadas (escaneo 2026-07-02). Los
ocho paneles de evaluación (`glucemia, tiroides, perfil-lipidico, hierro-anemia,
perfil-hepatico, inflamacion-cardiovascular, hormonal, ayurveda`) tienen
cobertura. La biblioteca base **no tiene huecos rojos de laboratorio** salvo uno.

### Único hueco rojo real 🔴

- **`bergamota` (grupo "perfil lipídico natural")**: agrupa ajo, bergamota,
  levadura roja de arroz y psyllium con solo tarjetas de evidencia (×3) y **una**
  de seguridad (levadura roja). Falta **identidad (M1) de las cuatro** y
  **seguridad (M4) de tres**. Delicado porque la levadura roja (monacolina K ≈
  lovastatina) es la de mayor riesgo de interacción. Decisión: crear
  identidad+seguridad por sustancia, o re-encuadrar como "comparativa de
  evidencia de grupo funcional" con disclaimer. **Este es el que conviene cerrar
  antes de abrir el piloto.**

### Enriquecimiento opcional 🟡 (no bloquea)

- **Lectura conjunta (D) del panel lipídico** LDL/HDL/TG — hoy no existe la D que
  los lea juntos (cada uno tiene A/B/C).
- Faltantes puntuales de capa: `linaza` sin seguridad (M4); `semillas-canamo` sin
  evidencia (M3); `cúrcuma` sin uso-documentado (M2); `ayurveda` dossier fino
  (solo evidencia+tradición).
- Ángulos B/C/D/E sueltos en albúmina, proteínas totales, tp-inr, cistatina-c,
  plaquetas, tsh (C/E), trigliceridos (E)… todos opcionales.

### El hueco estructural NO es de contenido, es multilingüe 🔴

Según la hoja de ruta multilingüe (2026-07-13), la biblioteca "base" está
esencialmente **en español**:

- Corpus aprobado: ~354 cuerpos ES, **0 cuerpos DE**.
- Pausa curiosa: 8 tarjetas ES, **desactivada en DE**.
- Parser multinivel: reconoce encabezados españoles, **no alemanes**.

La UI arranca en alemán por defecto (`locale: z.enum(LOCALES).default("de")`),
pero el corpus editorial es español. **Para tres usuarios alemanes, "completar la
biblioteca base" significa demostrar el contrato multilingüe con el mínimo ya
probado**, no traducir 354 tarjetas:

1. LDL·A en ES/DE (tres profundidades).
2. Glucosa·A en ES/DE (tres profundidades).
3. Glucosa+HbA1c·D en ES/DE.
4. Las 8 curiosidades piloto en ES/DE.
5. Suite espejo de regresión (conceptual, personal, evolución, seguridad, cambio
   de profundidad) en DE.

Sin este recorrido, el corpus es "bilingüe" solo de fachada.

---

## 3. Alineación de los prompts con arquitectura y documentación

### Prompt del chat (`SOCRATIC_SYSTEM_PROMPT`, lib/llm.ts) — bien alineado

17 reglas inviolables coherentes con la arquitectura: segunda persona, cita
obligatoria `<source>`, no diagnóstico, figura-fondo tradición/evidencia,
conservación literal de unidades (regla 16, alineada con ADR-017), no confundir
intervalo de referencia con objetivo personal (15), no inferir ausencia de
enfermedad por estar en rango (17), reencuadre de "qué comer" hacia educación
(13). La regla educativa (`EDU_GUIDE_RULE`, #18) está tras flag y desactivada,
correcto para pre-dato-real. El guardrail clasificador está bien calibrado
(safe/rewrite/block) y separa explícitamente educación general de interpretación
personal.

### Desalineación 🟡: garantía de idioma

La arquitectura multilingüe (§8 de la hoja de ruta) exige que **el servidor
resuelva `answer_language` y verifique el idioma del texto visible** con una
reescritura única y, si falla, mensaje fijo localizado. Hoy el prompt solo
**instruye** al LLM ("Responde en español…" / "Antworte auf Deutsch…") en
`app/api/chat/route.ts`. Eso es exactamente lo que el documento dice que **no es
una garantía**. La comprobación de idioma de salida y la reescritura sustentada
siguen abiertas (M1/M2 sin cerrar). Con Mistral externo el riesgo de salida en
idioma incorrecto es real. Recomendación: implementar el detector de idioma de
salida + reescritura antes de admitir usuarios alemanes.

### Desalineación 🟡: separación de los 7 conceptos de idioma

El código usa `locale: "es" | "de"` de forma binaria (53 construcciones
`locale === "de"` repartidas). La arquitectura pide separar `ui_locale`,
`answer_language`, `content_locale`, `source_language`, `source_jurisdiction`,
`evidence_context`, `document_language`. `languageContext()` ya distingue
`answerLocale`/`contentLocale`, pero la separación completa (sobre todo
`evidence_context` fuera de `locale=de`) no está hecha. No bloquea a 3 usuarios,
sí bloquea un tercer idioma.

### Prompt de Hermes (`PROMPT-HERMES-AYURVEDA-FUENTES-SKILL.md`) — parcialmente desactualizado 🟡

Lo que está bien: la regla figura-fondo para facets (hub / relacion-interna /
puente-editorial), la puerta T1, la disciplina de fuentes, la prohibición de
inventar markers, `limitations` obligatorias. Esto sí refleja la dirección
metodológica vigente.

Lo que **NO refleja los últimos cambios** (hoja de ruta 2026-07-13):

- **Idiomas / localización:** el prompt genera frontmatter con `facets_version:
  1` y `tarjeta_id`, pero **no incluye** `content_locale`, `canonical_card_id`,
  `localization_kind`, `localization_status` ni `editorial_schema_version`, que
  ahora son obligatorios para toda tarjeta nueva (§5 de la hoja de ruta). Una
  tarjeta que salga de Hermes hoy entra sin identidad de idioma y quedaría como
  legacy que hay que re-migrar.
- **Esquema editorial v2:** no usa los anchors invisibles `<!-- vitamap:block
  ... -->` (summary/analogy/literal/relations/limitations/deep_dive/sources). Usa
  encabezados de texto, justo lo que el parser v2 quiere abandonar.
- **Conceptos:** la disciplina figura-fondo está bien, pero conviene añadir la
  regla de que un `puente-editorial` use `canonical_card_id` compartido con la
  tarjeta del biomarcador moderno para agrupar rendiciones.

**Acción recomendada:** actualizar el skill de Hermes para emitir el frontmatter
v2 completo (locale + canonical + estados + esquema) y los anchors de bloque, de
modo que lo que produzca sea directamente publicable bajo el nuevo contrato y no
material legacy.

---

## 4. Tarjetas de curiosidades: temas a añadir y ¿prompt-skill para Hermes?

### Estado actual

8 curiosidades activas (ES), catálogo cerrado en `lib/curiosity.ts`:
LDL/HDL transportadores, fenómeno del alba (glucosa), HbA1c promedio 3 meses,
ritmo circadiano del cortisol, vitamina D como hormona, hematocrito↔hidratación,
creatinina no mide directamente el riñón, plaquetas recuento falsamente bajo.
Reserva no publicable: 3 estables (piel, microbiota, hueso vivo) + 4 frontera
(células senescentes, CRISPR ×2, pangenoma). El prompt `PROMPT-PAUSA-CURIOSA.md`
(v0.2) ya está bien alineado: superficie determinista, no memoria personal, no
recomendaciones, cifras con contexto, una sola idea, `content_locale` obligatorio.

### Temas propuestos para despertar interés (todos con fuente institucional posible)

Conectan con markers que ya están en el corpus, así que la relación por
`canonical_card_id` es limpia:

- **Ritmo circadiano ampliado**: por qué TSH y hierro sérico varían según la hora
  de extracción (ancla la regla preanalítica sin dar consejo).
- **El hígado y su capacidad de regeneración** (enzimas ALT/AST ya en corpus).
- **Por qué el ayuno cambia el aspecto de una analítica** (glucosa/triglicéridos;
  conecta con dossier `ayuno`).
- **Vitamina B12 y sus reservas hepáticas de años** (por qué el déficit tarda).
- **El "efecto bata blanca" y otros artefactos de medición** (variabilidad
  biológica; puente a interferencias-analiticas).
- **Magnesio: por qué el valor en sangre no refleja el total del cuerpo**
  (mismo patrón "no mide lo que crees" que creatinina, que ya funciona bien).
- **Microbioma y producción de vitamina K** (conecta vitamina-k + microbiota de
  la reserva).
- **Frontera (con fecha de revisión):** relojes epigenéticos de edad biológica;
  omega-3 y membrana eritrocitaria como registro de semanas (dossier omega-3 ya
  existe).

Criterio de selección: el patrón que mejor engancha en las 8 activas es
"**tu intuición sobre esta medición es incorrecta**" (creatinina, plaquetas,
hematocrito). Priorizar temas con esa forma sobre datos-curiosos sueltos.

### ¿Hace falta un prompt-skill de Hermes para curiosidades? — Sí, recomendado

Hoy solo existe un skill de Hermes para **Ayurveda**
(`PROMPT-HERMES-AYURVEDA-FUENTES-SKILL.md` + `hermes-skills/ayurveda-*`). Para
curiosidades solo hay un **brief de investigación** (`PROMPT-PAUSA-CURIOSA.md`),
que es una guía para redactar a mano, no un skill ejecutable por Hermes.

Conviene crear **`PROMPT-HERMES-CURIOSIDADES-SKILL.md`** análogo al de Ayurveda:
contrato (tema → buscar fuentes institucionales → decidir alcance
marker/system/body-general/research-frontier → redactar borrador → guardar en
`source-material/borradores/pausa-curiosa-general/` → enviar por email). Debe
heredar de `PROMPT-PAUSA-CURIOSA.md` las reglas de seguridad y **emitir ya el
frontmatter v2** (`content_locale`, `canonical_card_id`, `localization_status:
draft`, `curiosity_scope`, `review_after` para frontera, `taxonomy_status:
proposed` cuando el tema no esté en taxonomía). Así Hermes produce borradores
consistentes sin que tú redactes cada uno, y el administrador solo revisa y
publica. **Nota:** las curiosidades son superficie determinista, por lo que el
skill nunca debe traducir al vuelo; una versión DE es una rendición aparte
(`localization_kind: translation`, `machine-draft` → revisión → `reviewed`).

---

## 5. Estética visual: suavizar los temas diurnos hacia "cuaderno de notas"

### Diagnóstico

Los dos temas diurnos actuales (`app/globals.css`) son luminosos por diseño:

- **Cálido + día** ("manuscrito botánico"): fondo `#f7f2e6`/`#f4eadb` con
  `background-blend-mode: luminosity` sobre `botanical-paper.jpg` y `sepia(0.18)`.
  La luminosidad del blend eleva el brillo.
- **Frío + día**: cuatro gradientes radiales muy claros
  (`#eef5f9`→`#e4eef4`→`#dbe8ef`) — atmósfera casi blanca.

Tu lectura es correcta: para una atmósfera suave (reflexiva, no clínica) el
blanco-luz compite con el contenido.

### Propuesta (concreta, en `docs/visuales/PROPUESTA-CUADERNO-NOTAS.css`)

Dirección "cuaderno de notas": bajar el valor (lightness) del fondo unos
6–10 puntos, reducir saturación de acentos, cambiar el papel de luminoso a
**textura sutil de fibra** (shader ligero por CSS/canvas, sin imagen pesada), y
dar a las piezas superpuestas (`.vitamap-lienzo`, tarjetas de cita) un
**box-shadow suave** que las levante del papel. Dos variantes:

- **Cálido**: papel crema apagado (crudo/marfil tostado, no crema brillante).
- **Frío**: papel gris-azulado tenue (papel reciclado frío), sin el blanco actual.

El archivo CSS entregado incluye:

1. Variables de color diurnas re-tonalizadas (menos lightness, acentos
   desaturados).
2. Un fondo de papel por gradientes + `background` de ruido generado
   (data-URI SVG `feTurbulence` como shader ligero, sin JS ni imagen externa;
   opción de canvas si se quiere animar la fibra).
3. `box-shadow` de elevación para piezas que se superponen, con doble sombra
   (contacto corta + ambiente larga) y un borde interior tenue.

Es un punto de partida para pegar y ajustar valores en vivo; no toca los temas
nocturnos.
