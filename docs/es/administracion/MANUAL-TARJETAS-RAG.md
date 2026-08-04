# Manual de creación de tarjetas RAG

Versión 1.0 · 2026-08-02
Estado: documento operativo · **mantener actualizado cuando cambie el formato**

> Manual consolidado del proceso completo: desde elegir una fuente hasta
> comprobar que el asistente la recupera y la cita bien. Reúne lo disperso
> entre `corpus-preparation/README.md`, los briefs de investigación y el
> comportamiento real de `/admin/corpus`.
>
> Deutsche Fassung: `docs/de/HANDBUCH-RAG-KARTEN.md`.

---

## 1. Qué es una tarjeta y por qué el formato importa

Una **tarjeta** es un documento markdown corto con frontmatter YAML que
responde a **una sola pregunta recuperable**. No es un artículo ni un resumen
general: es la unidad que el sistema recupera y cita cuando alguien pregunta
algo relacionado.

El formato no es burocracia. El asistente solo puede afirmar lo que una tarjeta
respalda, y el guardarraíl bloquea afirmaciones sin fuente. Una tarjeta mal
hecha no produce un texto mediocre: produce una respuesta bloqueada, o peor,
una cita que no dice lo que el asistente afirma.

**Regla de oro:** los matices viven al final de la tarjeta y son la parte más
valiosa. Por eso `limitations` no se trunca nunca al construir el prompt
(ADR-017). Si escribes una tarjeta sin límites explícitos, estás escribiendo
propaganda, no evidencia.

---

## 2. Dónde vive cada cosa

```
corpus-preparation/
├── source-material/              originales y notas sin revisar
├── approved-current-structure/   ← ÚNICA carpeta desde la que se carga
│   └── <tema>/                   dossier temático (una carpeta por tema)
├── previously-uploaded/          histórico; NO es ejemplo normativo
├── corpus-taxonomy.json          vocabulario controlado
├── PROMPT-INVESTIGACION-RAG*.md  briefs por tipo de contenido
└── BRIEF-TARJETA-*.md            módulos detallados D y E
```

Mover un archivo aquí **no cambia nada** en `data/kb` ni en el índice: la
separación es editorial. La publicación real ocurre en §7.

---

## 3. Tipos de tarjeta

**Biomédicas** (analíticas y marcadores):

| Tipo | Qué hace | ¿Obligatoria? |
|---|---|---|
| A | Explica un marcador individual | Sí, es la base |
| B | Factores cotidianos documentados (alimentación, hábitos) | Recomendable |
| C | Una idea científica memorable (curiosidad) | Recomendable |
| D | Relación entre marcadores o lectura de un panel | Opcional |
| E | Cómo pensar los cambios en el tiempo | Opcional |

**D y E solo se preparan si una fuente adecuada aporta una intención real y
distinta de la A.** No se rellenan por simetría.

**Especies medicinales y prácticas** (plantas, hongos, algas, acupuntura,
prácticas complementarias):

| Capa | Qué hace |
|---|---|
| Identidad | Qué es exactamente (especie, parte usada, formas de producto) |
| Uso documentado | Uso histórico o regulatorio, con fuente precisa |
| Evidencia | Qué dice la investigación moderna |
| Seguridad | Precauciones, interacciones, contraindicaciones |

La capa de uso tradicional **solo se añade cuando existe una fuente histórica,
regulatoria o académica suficientemente precisa**. Si no la hay, se omite: es
preferible un dossier incompleto a uno que inventa tradición.

El brief correspondiente a cada tipo está en `corpus-preparation/PROMPT-*.md`.
Léelo antes de escribir: define el estilo, el alcance y los límites de cada
tipo.

---

## 4. Flujo completo

**1 · Elegir la fuente.** Primaria y con URL estable (DOI, MedlinePlus, HMPC,
NCCIH, WHO, revisiones sistemáticas). Registrar la URL y, si existe, el DOI.

**2 · Delimitar la pregunta.** Una tarjeta = una unidad recuperable. Si al
escribir aparecen dos preguntas, son dos tarjetas.

**3 · Redactar la síntesis** siguiendo el brief del tipo. 250–500 palabras, con
los matices al final.

**4 · Verificar contra la fuente**, afirmación por afirmación: cada dato, fecha,
referencia y limitación. Este paso no se delega ni se salta.

**5 · Escribir el frontmatter** (§5) con vocabulario controlado (§6).

**6 · Guardar en el dossier**, solo tras revisión conjunta:
`approved-current-structure/<tema>/<nombre-descriptivo>.md`. Lo no aprobado se
queda fuera.

**7 · Cargar, revisar y publicar** desde `/admin/corpus` (§7).

**8 · Probar la recuperación** con una consulta real (§8).

---

## 5. Frontmatter

Ejemplo real, de una tarjeta publicada:

```yaml
---
title: 'Kinesiología aplicada: ¿es válido el test muscular como método diagnóstico?'
source_url: 'https://doi.org/10.1186/1746-1340-15-11'
doi: 10.1186/1746-1340-15-11
publication_date: '2007'
source_kind: clinical-evidence
source_type: complementary-practice-evidence-summary
rights_status: permitted
limitations:
  - >-
    Evalúa la validez del test muscular como método diagnóstico, no cada
    posible tratamiento.
  - >-
    Evidencia insuficiente significa que no se ha demostrado validez, no una
    prueba universal de que 'nunca' ocurra nada.
facets_version: 1
tarjeta_id: kinesiologia-aplicada-evidencia-test-muscular-haas
dominio: tradiciones-practicas
tipo: [intervencion]
marker: [kinesiologia-aplicada]
sistema: [osteoarticular, neurologico-cognitivo]
area_de_salud: [rendimiento-deportivo]
seccion: evidencia
alias: [kinesiologia aplicada]
source_language: en
---
```

Notas que ahorran errores:

- **`limitations` es lo más importante.** Llega íntegro al modelo, sin truncar.
  Escríbelo pensando en qué conclusión errónea quieres impedir.
- **`seccion` se deriva de `source_type`**, no se elige libremente: el mapeo
  está en `corpus-taxonomy.json` → `sections_by_source_type`.
- **`source_language`** es el idioma de la fuente, no el de la tarjeta.
- **`rights_status`** debe reflejar la realidad de la licencia. Si no está
  claro, no se publica.

---

## 6. Vocabulario controlado

Los campos con valores cerrados viven en `corpus-preparation/corpus-taxonomy.json`:
`dominio`, `tipo`, `marker`, `categoria`, `muestra`, `sistema`, `area_de_salud`,
`seccion`, `tradicion`, `alias`, `relacionado_con`, `source_language`,
`source_jurisdiction`.

**No inventes valores.** Si falta uno, se añade a la taxonomía de forma
deliberada y se regenera el vocabulario:

```bash
cd apps/web
npm run taxonomy:generate     # regenera lib/generated/marker-vocabulary.ts
npm run taxonomy:check        # falla si el vocabulario está desincronizado
```

`taxonomy:check` es un gate: si falla, el corpus y el código discrepan y hay que
resolverlo antes de seguir.

---

## 7. Carga y publicación

Interfaz: `https://<dominio>/admin/corpus`, con una cuenta cuyo correo esté en
`ADMIN_EMAILS`.

1. Subir el `.md`. El panel **importa el frontmatter** automáticamente.
2. Revisar y corregir los metadatos importados. Los campos escritos a mano en
   el formulario **tienen prioridad** sobre el frontmatter.
3. Guardar como **borrador**. La importación nunca publica ni indexa sola: el
   borrador va a `/data/kb-inbox`.
4. Revisar procedencia, derechos y utilidad real para recuperación.
5. **Publicar.** Solo entonces el documento pasa a `/data/kb` y entra en el
   índice compartido.

El paso 3 existe para que nada llegue al asistente sin una revisión humana
explícita. No lo conviertas en trámite.

---

## 8. Verificación después de publicar

**Probar que se recupera** (desde el VPS):

```bash
cd /opt/vitamap-next/infra
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/check-kb.mts \
  "tu consulta de prueba aquí"
```

Si no aparece, revisar `marker`, `alias` y `seccion` antes de tocar nada más:
casi siempre es un problema de metadatos, no del índice.

**Después, probar en el chat real** una pregunta que deba recuperarla, y
**leer la cita**: comprobar que el asistente afirma lo que la fuente dice, y
que los matices de `limitations` aparecen cuando corresponde.

**Otras comprobaciones útiles:**

```bash
cd apps/web
npm run kb:check                 # estado general del corpus
npm run corpus:locale-audit      # cobertura por idioma
npm run eval                     # suites de evaluación (eval/*.yml)
```

---

## 9. Errores frecuentes

| Error | Consecuencia | Cómo evitarlo |
|---|---|---|
| Tarjeta con dos preguntas | Recuperación imprecisa | Dividir en dos |
| `limitations` vacío o genérico | El asistente afirma de más | Escribir qué **no** permite concluir |
| Valor inventado en un campo cerrado | `taxonomy:check` falla | Consultar la taxonomía primero |
| Publicar sin revisar derechos | Problema legal | `rights_status` real, o no publicar |
| Fuente secundaria (blog, resumen) | Cita no defendible | Solo fuentes primarias con URL estable |
| Tradición sin fuente precisa | Se inventa historia | Omitir la capa |
| No probar la recuperación | Tarjeta invisible en la práctica | `check-kb.mts` siempre |

---

## 10. Documentos relacionados

| Documento | Para qué |
|---|---|
| `corpus-preparation/README.md` | Estado real de las carpetas y dossiers |
| `corpus-preparation/PROMPT-INVESTIGACION-RAG*.md` | Briefs por tipo de contenido |
| `corpus-preparation/BRIEF-TARJETA-D/E-*.md` | Módulos detallados D y E |
| `../arquitectura/ARQUITECTURA-CORPUS-TEMATICO-Y-RECUPERACION.md` | Estructura temática y evolución de la recuperación |
| `../arquitectura/COBERTURA-CORPUS-ANGULOS-DEBILES.md` | Qué falta por cubrir, tema a tema |
| `../arquitectura/PROPUESTA-CORPUS-LINT.md` | Gate de integridad propuesto para tarjetas |
| `MANUAL-VPS.md` | Comandos del servidor |
