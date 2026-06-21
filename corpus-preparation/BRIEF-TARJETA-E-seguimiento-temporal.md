# Módulo de brief — Tarjeta E · Seguimiento temporal

> Este módulo amplía el brief principal (`PROMPT-INVESTIGACION-RAG.md`). La
> tarjeta E enseña a comprender cambios entre mediciones; no analiza por sí
> misma la serie concreta de una persona.

## 1. Función

Una cifra aislada responde qué ocurrió en una muestra. Varias cifras fechadas
pueden mostrar estabilidad, oscilación o cambio, pero solo si son suficientemente
comparables. La tarjeta E explica esa diferencia.

**Principio rector:**

> Una secuencia aporta contexto, no una conclusión automática. Antes de llamar
> tendencia a una diferencia hay que comprobar fechas, unidades, método,
> laboratorio y condiciones de medición. La persistencia puede ser informativa,
> pero no diagnostica ni explica por sí sola la causa.

## 2. Preguntas que pretende responder

- "¿Importa más este valor o cómo ha cambiado?"
- "¿Puedo comparar estas dos analíticas?"
- "¿Qué diferencia hay entre una oscilación y una tendencia?"
- "¿Cuántos resultados hacen falta para hablar de cambio?"
- "¿Un valor estable significa que todo está bien?"

No responde "¿estoy mejor o peor?" ni calcula una tendencia individual.

---

## 3. Cuándo crearla y cuándo no

Crea una tarjeta E solo cuando una fuente declarada permita explicar
variabilidad, comparabilidad o seguimiento seriado del marcador.

No la crees si:

- solo repite que conviene volver a medir sin explicar por qué;
- necesita inventar un porcentaje de cambio significativo;
- mezcla criterios de poblaciones, métodos o marcadores distintos;
- transforma una recomendación clínica de monitorización en una pauta
  personalizada;
- duplica una tarjeta A sin añadir una dimensión temporal real.

Una tarjeta E puede ser específica de un marcador o transversal cuando una
fuente de medicina de laboratorio explique principios aplicables a varias
pruebas. No debe producirse una por marcador para completar una cuota.

---

## 4. Frontmatter

> **Contrato mínimo de evidencia (v0).** Incluye el bloque `evidence` (con
> `certeza`) y el `relacionado_con[].direccion` de `PROMPT-INVESTIGACION-RAG.md`
> §3 bis. En una tarjeta E la `certeza` describe lo establecido que está el
> principio de comparabilidad o variación; usa `direccion` solo si afirmas una
> asociación. `relacionado_con[].id` es un **marcador canónico**.

```yaml
---
title: "Creatinina y eGFR: cómo interpretar cambios con el tiempo"
source_url: "https://fuente-oficial.example/documento"
source_language: de
source_jurisdiction:
  - DE
publication_date: "2025"
source_kind: institutional-education
source_type: lab-longitudinal-interpretation-summary
rights_status: permitted
facets_version: 1
tarjeta_id: filtrado-glomerular-egfr-filtrado-glomerular-egfr-seguimiento-temporal-kdigo
dominio: laboratorio
tipo:
  - analito
marker:
  - egfr
categoria:
  - perfil-renal
muestra:
  - suero
sistema:
  - renal-urinario
area_de_salud:
  - salud-renal
  - longevidad
seccion: seguimiento
alias:
  - egfr
  - filtrado glomerular
limitations:
  - "Síntesis educativa; no interpreta la evolución de una persona concreta."
  - "Dos resultados solo son comparables si se consideran unidades, método, laboratorio y contexto."
  - "Una diferencia numérica no equivale automáticamente a un cambio clínicamente significativo."
  - "La estabilidad tampoco descarta por sí sola un problema de salud."
  - "No ofrece diagnóstico, frecuencia de control ni tratamiento."
---
```

La URL y la fecha son marcadores de estructura: deben sustituirse por los datos
reales de la fuente. Se aplican todas las reglas de derechos y facetado del
brief principal y `corpus-preparation/corpus-taxonomy.json`.

---

## 5. Estructura

```markdown
# [Marcador o grupo]: cómo interpretar cambios con el tiempo

## Qué puede aportar una serie temporal
Explica qué información añade disponer de varias mediciones fechadas y qué no
puede verse en un punto aislado.

## Cuándo son comparables dos resultados
Describe las condiciones relevantes respaldadas por la fuente: unidad, método,
laboratorio, preparación, hora, ayuno, hidratación, medicación o situación
fisiológica.

## Cómo distinguir cambio, variación y persistencia
Diferencia oscilación esperable, cambio observado y patrón sostenido. No añadas
umbrales ni porcentajes que la fuente no publique.

## Qué no permite concluir una tendencia
Aclara que una dirección temporal no identifica la causa, no predice
necesariamente el futuro y no determina por sí sola una decisión clínica.

## Fuente principal
Cita completa y URL oficial.

## Fuentes complementarias
Solo cuando aporten una regla temporal concreta y distinta.
```

---

## 6. Reglas propias

1. **Fechas visibles.** Una explicación longitudinal debe tratar cada medición
   como un punto fechado, no como una lista sin orden.
2. **Comparabilidad antes que dirección.** Antes de decir "subió" o "bajó",
   comprueba unidad, método, laboratorio y condiciones relevantes.
3. **Sin significancia inventada.** Una diferencia aritmética no se convierte en
   cambio biológico o clínico significativo sin una fuente aplicable.
4. **Persistencia no es diagnóstico.** Repetición y tendencia pueden aumentar la
   relevancia de una observación, pero no nombran la causa.
5. **Estabilidad no es normalidad.** Un valor puede permanecer estable fuera del
   intervalo o ser estable y seguir necesitando contexto.
6. **Sin extrapolación.** No proyectes el siguiente valor ni una dirección futura
   a partir de pocos puntos.
7. **Sin pauta personalizada.** No indiques cuándo repetir una prueba salvo para
   describir literalmente una recomendación general de una fuente, atribuida y
   no adaptada al caso.
8. **Longitud orientativa: 250–500 palabras.**

---

## 7. Fronteras que deben permanecer separadas

- **Cambio aritmético:** diferencia numérica entre dos resultados.
- **Variabilidad analítica:** diferencia introducida por medición, método o
  laboratorio.
- **Variabilidad biológica:** oscilación real dentro de una misma persona.
- **Cambio persistente:** dirección repetida o mantenida en varias mediciones.
- **Significado clínico:** interpretación que requiere marcador, magnitud,
  contexto, síntomas, antecedentes y criterios aplicables.

La tarjeta debe evitar que estas categorías se presenten como sinónimos.

---

## 8. Recuperación (nota para VitaMap)

La tarjeta E debe priorizarse ante consultas que incluyan fechas o expresiones
como "antes", "ahora", "ha cambiado", "evolución", "tendencia", "estable",
"subiendo" o "bajando".

Recuperar la tarjeta E no basta para analizar datos personales. El sistema debe
obtener por separado las mediciones del mismo marcador, ordenarlas por fecha y
conservar unidad, intervalo, laboratorio y procedencia. Si faltan esos datos,
debe decir que no puede establecer una comparación fiable.

---

## 9. Nombre y clasificación

```text
[tema]-seguimiento-temporal-[fuente].md
```

- `source_kind`: normalmente `institutional-education` o `clinical-evidence`.
- `source_type`: `lab-longitudinal-interpretation-summary`.
- `seccion`: `seguimiento`.
- `marker`: lista con el marcador principal y, si la tarjeta compara varios,
  todos los marcadores relacionados.

---

## 10. Checklist de calidad

- [ ] La fuente explica variabilidad, comparabilidad o seguimiento, no solo el
      significado aislado del marcador.
- [ ] La tarjeta distingue cambio aritmético, variación y significado clínico.
- [ ] No inventa porcentajes, intervalos de cambio ni frecuencia de control.
- [ ] Explica cuándo dos resultados pueden no ser comparables.
- [ ] No interpreta una serie personal ni proyecta valores futuros.
- [ ] Reconoce que estabilidad no equivale necesariamente a normalidad.
- [ ] `source_type` es `lab-longitudinal-interpretation-summary`.
- [ ] `seccion` es `seguimiento` y los facets siguen la taxonomía.
