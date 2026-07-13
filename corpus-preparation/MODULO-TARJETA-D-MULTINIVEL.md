# Módulo editorial · Tarjeta D multinivel

Versión 0.1 · 2026-07-13
Estado: contrato para borradores piloto; complementa el brief principal y el módulo de lectura conjunta

## 1. Cuándo se aplica

Este módulo se aplica cuando se solicita expresamente una tarjeta D de lectura
conjunta preparada para los niveles de lenguaje de VitaMap.

Debe leerse junto con:

- `PROMPT-INVESTIGACION-RAG.md`;
- `BRIEF-TARJETA-D-lectura-conjunta.md`;
- `corpus-taxonomy.json`.

No convierte una tarjeta D en interpretación personal. La unidad continúa
siendo un panel, un eje o una relación general respaldada por fuentes.

## 2. Estructura obligatoria

Usa exactamente estos encabezados H2, una sola vez y en este orden:

```markdown
# [Relación o panel]

## En una frase
[Qué añade leer estos marcadores juntos.]

## Una imagen para empezar
[Una metáfora relacional breve con su anclaje literal.]

## Qué significa realmente
[Qué observa cada componente y en qué se diferencian.]

## Cómo se relaciona
[Qué información complementaria aporta la lectura conjunta.]

## Límites de la explicación
[Qué no permite concluir el conjunto y dónde falla la metáfora.]

## Si quieres profundizar
[Discordancias, método, ventanas temporales, interferencias y matices.]

## Fuentes
[Citas y URLs oficiales.]
```

Los cuatro bloques obligatorios para el parser son `En una frase`, `Qué
significa realmente`, `Límites de la explicación` y `Fuentes`. En los pilotos
se preparan los siete.

## 3. Composición por profundidad

| Profundidad | Bloques |
|---|---|
| `discover` | En una frase + imagen con anclaje + límites + fuentes |
| `understand` | En una frase + significado literal + relación + límites + fuentes |
| `deep` | Significado literal + relación + profundizar + límites + fuentes |

No se acumulan todos los bloques. Esto evita que una respuesta detallada repita
primero la metáfora y después la misma relación en lenguaje técnico.

## 4. Reglas específicas para lectura conjunta

- Explica qué aporta cada marcador antes de describir un patrón.
- Diferencia “se lee junto con” de “causa”, “predice” o “confirma”.
- Una discordancia puede necesitar comprobación; no debe presentarse como error
  automático de una prueba.
- No apliques un patrón general a los valores de la persona dentro de la
  tarjeta compartida.
- No inventes ratios, puntuaciones, umbrales combinados ni objetivos.
- Si mencionas puntos de corte, atribúyelos y conserva población, unidad y
  finalidad.
- No conviertas pertenencia al mismo panel en una red causal.

## 5. Metáforas

La metáfora debe explicar la **relación**, no sustituir dos tarjetas A. Ejemplos
posibles:

- fotografía puntual frente a exposición prolongada;
- dos relojes que observan escalas temporales distintas;
- instrumentos diferentes de un mismo panel.

La imagen debe declarar su límite. Una “película de tres meses” no significa
que HbA1c reconstruya cada día ni que todos los días pesen igual. Una fotografía
puntual tampoco explica por sí sola por qué el valor es diferente.

## 6. Relación con retrieval

La tarjeta D solo se recompone si ocupa el primer lugar tras el retrieval y el
router de intención. Una tarjeta A estructurada situada después no debe
recomponerse además: mezclar una A completa con una D produce explicaciones
duplicadas y borra la intención principal.

## 7. Migración

Al migrar una D existente:

- conserva `tarjeta_id`;
- conserva los markers y la procedencia;
- revisa `relacionado_con[].direccion`;
- elimina contenidos laterales que pertenezcan a otra intención;
- prepara el archivo fuera de `approved-current-structure`;
- publícalo como sustitución explícita desde `/admin/corpus`;
- prueba recuperación, profundidad y ausencia de datos personales.

## 8. Checklist

- [ ] Cada marcador tiene un papel diferencial explícito.
- [ ] La metáfora explica la relación y contiene su límite.
- [ ] Una discordancia no se interpreta como diagnóstico.
- [ ] No aparecen valores personales en preguntas generales.
- [ ] `deep` no repite `discover`.
- [ ] Límites y fuentes aparecen en los tres niveles.
- [ ] La tarjeta pasa parser editorial y taxonomía.
