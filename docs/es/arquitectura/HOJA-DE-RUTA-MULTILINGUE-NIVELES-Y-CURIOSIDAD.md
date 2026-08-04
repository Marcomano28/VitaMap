# Hoja de ruta multilingüe · Interfaz, RAG, niveles y Pausa curiosa

Versión 1.0 · 2026-07-13
Estado: decisión arquitectónica propuesta tras auditoría completa
Ámbito: interfaz española y alemana; contenido español, alemán e inglés

Este documento gobierna las decisiones de idioma de VitaMap. Cuando exista una
diferencia con ejemplos históricos de `ROADMAP.md`,
`ARQUITECTURA-CORPUS-TEMATICO-Y-RECUPERACION.md`, la propuesta de niveles o la
Pausa curiosa, prevalece este documento para el plano multilingüe.

## 1. Veredicto

La dirección seguida fue **correcta para descubrir el producto**, pero no es
suficiente para garantizar una experiencia multilingüe escalable.

Conviene conservar:

- una única taxonomía conceptual y un único grafo;
- `source_language` separado del idioma de la respuesta;
- `source_jurisdiction` separado de la procedencia científica;
- embeddings, aliases y rutas de consulta multilingües;
- tres profundidades como presentación, no como tres corpus;
- Pausa curiosa determinista, sin pedir al LLM que invente datos;
- elección voluntaria de profundidad, sin clasificar a la persona.

Hay que cambiar la condición de la traducción mediante LLM. Puede seguir
existiendo como **fallback visible y medible del chat**, pero no puede ser la
base que garantice el alemán. Las superficies deterministas —interfaz, mapa,
avisos, niveles editoriales y curiosidades— necesitan contenido revisado en el
idioma que muestran.

Decisión central:

> VitaMap mantiene un solo corpus lógico y genera presentaciones revisadas por
> idioma. No crea dos verdades científicas, pero tampoco finge que una
> traducción improvisada equivale a una localización editorial.

## 2. Qué se ha construido hasta hoy

La evolución tuvo sentido como secuencia de piloto:

1. Interfaz española y alemana seleccionada mediante cookie, con alemán como
   valor inicial.
2. Respuesta del chat forzada al idioma elegido y fallbacks deterministas ES/DE
   para analíticas, crisis, fechas y números.
3. Embeddings multilingües y aliases españoles/alemanes para reconocer términos
   como `Leberwerte`, `Schilddrüsenwerte` o `Nüchternglukose`.
4. Metadatos `source_language` y `source_jurisdiction`, más una preferencia
   suave de fuentes DE/EU para el público alemán.
5. Tres profundidades —`discover`, `understand`, `deep`— compuestas después de
   releer de forma segura la tarjeta completa.
6. Pausa curiosa separada del chat, sin memoria personal, con catálogo cerrado
   y renderizado determinista.
7. Reserva de curiosidades generales y de ciencia reciente, todavía fuera del
   corpus publicable.

Este camino validó el valor de la experiencia. El siguiente paso ya no es
añadir traducciones sueltas: es fijar el contrato multilingüe.

## 3. Estado real medido

Auditoría local del 13 de julio de 2026:

| Superficie | Español | Alemán | Garantía actual |
|---|---|---|---|
| Navegación y páginas | cobertura amplia, fragmentada | cobertura amplia, fragmentada | parcial |
| Chat generado | instrucción explícita ES | instrucción explícita DE | depende del LLM; sin control de idioma de salida |
| Respuestas estructuradas de analíticas | sí | sí | buena |
| Corpus aprobado | 354 cuerpos estimados en español | 0 cuerpos alemanes | solo ES editorial |
| Fuente principal declarada | 317 EN, 12 ES, 3 ZH, 22 sin idioma | 0 DE | preferencia DE casi inactiva |
| Tarjetas multinivel en el repositorio | 3 borradores ES | 0 DE | piloto ES |
| Parser multinivel | encabezados españoles exactos | no reconoce encabezados alemanes | no escalable |
| Pausa curiosa activa | 8 tarjetas ES | desactivada | solo ES |
| Reserva general | 7 tarjetas ES | 0 DE | no publicable aún |
| Regresión del chat | 7 casos ES | 0 DE | sin paridad demostrada |

También existen 53 construcciones binarias del tipo `locale === "de"` o tipos
`"es" | "de"` repartidos por la aplicación. Son manejables con dos idiomas,
pero obligan a tocar muchos archivos para añadir un tercero. Algunos controles
visibles, como el selector de tema claro/oscuro, conservan texto español cuando
la interfaz está en alemán.

La cobertura no debe expresarse como “la aplicación es bilingüe” todavía. La
formulación exacta es:

> La aplicación dispone de una interfaz ES/DE parcial y puede generar respuestas
> en ambos idiomas; el corpus editorial y la evaluación garantizada siguen
> siendo esencialmente españoles.

## 4. Separar siete conceptos que hoy se rozan

El modelo futuro debe distinguir:

| Concepto | Significado |
|---|---|
| `ui_locale` | idioma y convenciones de la interfaz, por ejemplo `de-DE` |
| `answer_language` | idioma solicitado para la respuesta del chat, por ejemplo `de` |
| `content_locale` | idioma de la redacción editorial: `es`, `de` o `en`; no implica que exista una interfaz pública en ese idioma |
| `source_language` | idioma de la fuente citada, por ejemplo `en` |
| `source_jurisdiction` | jurisdicción o marco de la fuente, por ejemplo `US` o `EU` |
| `evidence_context` | marco geográfico preferido para orientación local, por ejemplo `DE` |
| `document_language` | idioma del PDF o documento personal subido |

Hablar alemán no implica automáticamente vivir en Alemania. Durante el piloto
puede mantenerse `evidence_context: DE` por configuración, pero no debe quedar
oculto dentro de `locale=de`. Esta separación permitirá alemán para Austria o
Suiza sin aplicar silenciosamente un marco alemán.

## 5. Arquitectura objetivo: una tarjeta conceptual, varias presentaciones

Cada intención mantiene una identidad conceptual. Las redacciones por idioma
son **rendiciones** de esa identidad.

Frontmatter propuesto:

```yaml
tarjeta_id: colesterol-ldl-interpretacion-medlineplus--de
canonical_card_id: colesterol-ldl-interpretacion-medlineplus
content_locale: de
localization_kind: translation
localization_status: reviewed
localized_from: colesterol-ldl-interpretacion-medlineplus
localized_from_version: 2
localized_from_checksum: "sha256:..."
editorial_schema_version: 2
```

Reglas:

- `tarjeta_id` identifica el archivo publicable y continúa siendo único.
- `canonical_card_id` agrupa todas las rendiciones de una intención.
- Las tarjetas españolas existentes conservan su `tarjeta_id`; si no declaran
  `canonical_card_id`, este se interpreta temporalmente como igual a
  `tarjeta_id`.
- `content_locale` es obligatorio para toda tarjeta nueva o modificada.
- `source_language` continúa describiendo la fuente, nunca el cuerpo.
- `localization_status` admite como mínimo `draft`, `machine-draft`, `reviewed`
  y `stale`.
- Una traducción automática nunca puede recibir `reviewed` sin revisión humana.
- Si cambia la versión o el checksum de la tarjeta origen, las rendiciones
  derivadas pasan a `stale` y dejan de utilizarse en superficies deterministas.
- Retirar la tarjeta conceptual retira todas sus rendiciones.

No son dos corpus independientes. Comparten taxonomía, identidad, relaciones,
estado científico y ciclo de retirada. Son proyecciones lingüísticas de un
único catálogo gobernado.

## 6. Bloques editoriales independientes del idioma

El parser actual usa como identificador textos españoles como `En una frase` o
`Límites de la explicación`. Esto mezcla la etiqueta visible con el contrato
técnico.

La versión 2 debe usar identificadores invisibles y estables:

```markdown
<!-- vitamap:block summary -->
## Kurz gesagt

[Texto alemán]

<!-- vitamap:block analogy -->
## Ein Bild zum Einstieg

[Texto alemán]

<!-- vitamap:block limitations -->
## Grenzen dieser Erklärung

[Texto alemán]
```

IDs multinivel:

```text
summary
analogy
literal
relations
limitations
deep_dive
sources
```

La etiqueta H2 puede cambiar por idioma; el selector de profundidad utiliza el
ID. El parser v2 debe convivir temporalmente con el parser español v1 para no
romper las tarjetas ya publicadas.

Las curiosidades pueden usar el mismo principio con IDs `fact`, `mechanism`,
`limitations` y `sources`. Esto permitirá ofrecer una curiosidad fácil o más
detallada en el futuro sin crear otro formato incompatible.

## 7. Recuperación multilingüe sin duplicar la verdad

QMD permite buscar por colecciones. La evolución recomendada es mantener un
solo índice operativo con proyecciones por idioma:

```text
kb-es       cuerpos editoriales españoles revisados
kb-de       cuerpos editoriales alemanes revisados
kb-legacy   tarjetas aún no migradas, tratadas como ES
```

Flujo:

```text
pregunta
  → resolver contexto de idioma en el servidor
  → detectar tema e intención con vocabulario multilingüe
  → buscar primero en la colección del content_locale solicitado
  → agrupar candidatos por canonical_card_id
  → seleccionar una sola rendición por intención
  → si falta: buscar la tarjeta base y activar fallback del chat
  → releer tarjeta completa y componer la profundidad
  → generar respuesta
  → comprobar idioma de salida
```

El fallback mediante LLM solo está permitido para respuestas generadas del
chat. La Pausa curiosa, las etiquetas del mapa, avisos legales y demás bloques
deterministas no muestran un cuerpo de otro idioma ni lo traducen al vuelo.

### Corrección necesaria de la preferencia de fuente

La función actual puede colocar una fuente alemana con puntuación semántica
menor por encima de una fuente inglesa más relevante. Esto contradice la regla
editorial de no rebajar calidad solo por idioma.

Idioma y jurisdicción de la fuente deben actuar como desempate **después** de
tema, intención, autoridad y relevancia, o dentro de variantes conceptualmente
equivalentes. Nunca como reordenación global que pueda cambiar de tema o nivel
de evidencia.

## 8. Garantía del idioma de respuesta

Una instrucción al LLM no es una garantía. El contrato operativo será:

1. El servidor resuelve `answer_language`; no confía únicamente en el valor
   enviado por el navegador.
2. El prompt combina reglas de seguridad comunes con un paquete de estilo del
   idioma solicitado.
3. Tras sanear etiquetas internas, se comprueba el idioma del texto visible.
4. Se excluyen de esa comprobación nombres propios, fórmulas, unidades y títulos
   de fuentes.
5. Si el texto usa predominantemente otro idioma, se hace una única
   reescritura sustentada.
6. Si vuelve a fallar, se muestra un mensaje fijo y localizado. No se entrega
   una respuesta en el idioma incorrecto.

Las respuestas breves o casi enteramente numéricas requieren una regla
especial: deben validarse por sus frases fijas y no por un detector estadístico
poco fiable.

Cambiar el idioma durante una conversación afecta a la interfaz y a las
respuestas nuevas. Los mensajes anteriores no se reescriben silenciosamente.
Una recomposición por profundidad sí puede producir una nueva versión en el
idioma vigente y debe indicarlo en sus metadatos.

## 9. Interfaz escalable

Los textos de la interfaz están repartidos entre `lib/i18n.ts`, múltiples
objetos `TEXT` locales y condicionales binarios. La migración debe llevarlos a
catálogos por namespace con cobertura comprobable:

```text
messages/es/common
messages/es/chat
messages/es/map
messages/es/admin
messages/de/common
messages/de/chat
messages/de/map
messages/de/admin
```

Un registro central de locales define:

- locale BCP 47;
- idioma de respuesta;
- locale numérico y de fechas;
- fallback;
- si está habilitado para usuarios;
- recursos de crisis aplicables al `evidence_context`, no solo al idioma.

El gate de compilación debe fallar si a un locale habilitado le falta una clave.
La revisión incluye texto visible, `aria-label`, títulos, errores, emails,
consentimiento, facturación, administración, mapa y estados vacíos.

Los nombres visibles de markers no deben derivarse del slug. La taxonomía debe
añadir etiquetas canónicas por idioma; los aliases continúan sirviendo para
reconocer preguntas, no como traducciones de presentación.

## 10. Pausa curiosa por idioma

La decisión de no traducir curiosidades mediante el LLM en tiempo real es
correcta. Para habilitar alemán:

- `/api/curiosity` recibe o resuelve el locale en el servidor;
- el catálogo filtra duro `content_locale` y `localization_status: reviewed`;
- la exclusión de vistos opera por `canonical_card_id`, para no mostrar la misma
  curiosidad dos veces en idiomas distintos;
- relación con el tema usa IDs canónicos, no palabras traducidas;
- título, cuerpo y limitaciones proceden de la misma rendición;
- una tarjeta de ciencia reciente debe mostrar fecha editorial y fecha de
  próxima revisión;
- si no existe curiosidad revisada para ese idioma, se oculta la acción o se
  muestra un estado localizado; nunca se devuelve español bajo una UI alemana.

Primer catálogo alemán recomendado: las ocho curiosidades del piloto actual,
no las siete tarjetas generales de reserva. La reserva se localiza después de
aprobar `topic` y su política editorial.

## 11. Administración y gates

La administración debe mostrar una matriz por tarjeta conceptual:

```text
                         ES          DE
LDL · interpretación    vigente     vigente
Glucosa · interpretación vigente    borrador
HbA1c · curiosidad       vigente     stale
```

Reglas de publicación:

- sustitución atómica por `tarjeta_id` dentro de una rendición;
- unicidad adicional de `(canonical_card_id, content_locale)` entre tarjetas
  publicadas;
- no publicar `machine-draft`, `stale` ni `taxonomy_status: proposed`;
- no publicar un locale no registrado;
- bloquear una rendición si faltan bloques obligatorios;
- comprobar paridad de facetas conceptuales entre rendiciones;
- preservar derechos y fuente exacta de cada rendición;
- marcar como stale las derivadas cuando cambia el origen.

El futuro `corpus:lint` debe incluir estas reglas. La inferencia del idioma por
dominio puede ayudar al backfill, pero no sustituye un `source_language`
explícito en una publicación nueva.

## 12. Seguridad clínica y lingüística

Las reglas clínicas son comunes a todos los idiomas y no deben copiarse a mano
en prompts divergentes. Se recomienda:

- política central con IDs estables;
- ejemplos lingüísticos por locale solo cuando sean necesarios;
- patrones deterministas por idioma para frases observadas en producción;
- misma batería de casos clínicos en cada idioma habilitado;
- paridad de verdict y flags, no igualdad literal de la respuesta;
- recursos de crisis por país o contexto, no por lengua solamente;
- revisión específica de metáforas: una imagen segura en español puede adquirir
  otro matiz en alemán.

Una explicación fácil conserva fuentes y límites. Una traducción no puede
perder `limitations` ni suavizar una incertidumbre. Una explicación profunda no
puede añadir afirmaciones que no estén en el conjunto de fuentes.

## 13. Plan de migración

### Avance local · 13 de julio de 2026

Ya están implementados, pendientes de despliegue:

- registro central de interfaz ES/DE y contenido ES/DE/EN, con
  `LanguageContext` público limitado a ES/DE;
- metadatos `canonical_card_id`, `content_locale`, estado, origen, versión,
  checksum y esquema editorial;
- conservación de esos campos al importar, editar, publicar y recuperar;
- identidad administrativa por concepto + idioma, manteniendo el fallback por
  `tarjeta_id` para el corpus anterior;
- bloqueo de rendiciones `machine-draft` y `stale`;
- parser editorial v2 por anchors con compatibilidad v1;
- migración local de las tres tarjetas piloto españolas al esquema v2;
- auditoría de backfill estrictamente de solo lectura: 354 tarjetas legacy,
  todas candidatas a revisión antes de recibir identidad española, sin IDs
  ausentes ni rendiciones duplicadas;
- tres rendiciones alemanas v2 completas como `draft` tras una segunda pasada
  lingüística y de fidelidad, enlazadas a sus originales mediante versión y
  checksum;
- prueba de las tres profundidades en tres conceptos con rendiciones ES/DE/EN;
- tres rendiciones inglesas v2 como `draft`, almacenables pero no seleccionables
  como idioma de interfaz o respuesta;
- gate administrativo que impide publicar o indexar `en` mientras continúe
  como locale de contenido no público.

Todavía no están completados la aplicación por lotes del backfill, la
publicación administrativa de las tres rendiciones alemanas, el filtrado QMD
por locale ni la garantía de idioma de salida. Por tanto, M1 y M2 siguen
abiertos hasta superar sus gates completos.

### M0 · Auditoría y definición — completada

- inventario de interfaz, corpus, prompts, retrieval, niveles y curiosidades;
- medición de cobertura real;
- identificación de dependencias y falsos supuestos.

### M1 · Contrato de idioma — prioridad P0

1. Crear registro central de locales y `LanguageContext` del servidor.
2. Adoptar `content_locale`, `canonical_card_id`, estados y checksum.
3. Preservar esos campos en importación y administración.
4. Extender el gate de publicación y las pruebas.
5. Hacer backfill de tarjetas existentes como `content_locale: es`, primero en
   modo informe y después por lotes.

### M2 · Esquema editorial v2 — prioridad P0

1. Añadir anchors `vitamap:block` con fallback al parser v1.
2. Migrar LDL A, glucosa A y glucosa/HbA1c D.
3. Crear rendiciones alemanas revisadas de esas tres tarjetas.
4. Probar las tres profundidades en ES y DE.
5. Medir repetición, fidelidad, límites y ausencia de datos personales.

### M3 · Pausa curiosa bilingüe — prioridad P0

1. Hacer el endpoint consciente de locale.
2. Localizar y revisar las ocho tarjetas del catálogo piloto.
3. Filtrar por locale y estado editorial.
4. Activar el botón alemán solo cuando el catálogo supere los gates.
5. Mantener la reserva general fuera de producción hasta aprobar `topic`.

### M4 · Recuperación y fuente local — prioridad P1

1. Crear colecciones QMD por `content_locale` dentro del mismo índice.
2. Agrupar resultados por `canonical_card_id`.
3. Implementar fallback explícito a la tarjeta base para chat.
4. Corregir la preferencia de fuentes para que no domine relevancia ni
   autoridad.
5. Incorporar un primer lote de fuentes institucionales DE/EU equivalentes.

### M5 · Cobertura completa de producto — prioridad P1

1. Consolidar catálogos de UI y eliminar condicionales binarios dispersos.
2. Localizar markers, territorios, relaciones, emails, errores y accesibilidad.
3. Añadir comprobación de idioma de salida y reescritura única.
4. Duplicar la suite clínica ES en DE y ejecutar paridad.
5. Añadir benchmark de retrieval ES/DE por tema e intención.

### M6 · Prueba de escalabilidad — iniciada antes de un tercer idioma público

Se ha añadido `en` como locale de contenido no visible para usuarios. Antes de
convertirlo en idioma público todavía hay que verificar que:

- se incorpora desde el registro sin editar decenas de condicionales;
- faltan claves y contenidos de forma explícita, no silenciosa;
- retrieval, niveles y curiosidades degradan según contrato;
- no es necesario duplicar taxonomía, grafo ni seguridad clínica.

Solo después se habilita otro idioma al público.

## 14. Gates de aceptación

Un locale se considera habilitado para una superficie únicamente si cumple:

### Interfaz

- 100 % de claves requeridas presentes;
- cero texto de otro idioma en recorrido automatizado;
- fechas, números, ARIA, errores y avisos correctos.

### Chat

- todos los casos de seguridad tienen par equivalente;
- salida en el idioma solicitado o fallback fijo, nunca idioma incorrecto;
- `discover`, `understand` y `deep` conservan hechos, límites y fuentes;
- consultas conceptuales no filtran datos personales;
- consultas personales conservan unidades y referencias originales.

### Retrieval

- benchmark por idioma, tema e intención;
- misma tarjeta conceptual esperada aunque cambie la formulación;
- una variante local no desplaza evidencia más pertinente de otro tema;
- no aparecen dos rendiciones de la misma tarjeta en una respuesta.

### Corpus y localización

- locale, estado, versión y checksum válidos;
- cero rendiciones stale en superficies deterministas;
- paridad de facetas y relaciones;
- fuente y derechos verificables.

### Pausa curiosa

- cuerpo, título y límites en el locale solicitado;
- cero memoria personal;
- solo IDs permitidos y revisados;
- no repetición por `canonical_card_id`;
- fecha y revisión visibles en ciencia reciente.

## 15. Métricas internas

Sin convertirlas en gamificación para la persona, conviene medir:

- cobertura revisada por `(canonical_card_id, content_locale)`;
- tasa de fallback por traducción en chat;
- tasa de salida en idioma incorrecto;
- rendiciones stale;
- `recall@3` por idioma e intención;
- diferencias de verdict de seguridad ES/DE;
- uso de niveles y comprensión, sin guardar el texto clínico de la pregunta;
- curiosidades abiertas y cerradas de forma agregada, sin perfil sensible.

## 16. Prioridad inmediata

No hay que traducir las 354 tarjetas. El siguiente incremento debe demostrar el
contrato completo con el mínimo conjunto que ya ha sido probado por el usuario:

1. LDL A en ES/DE y tres profundidades.
2. Glucosa A en ES/DE y tres profundidades.
3. Glucosa + HbA1c D en ES/DE.
4. Las mismas tres tarjetas en EN como prueba de contenido no público.
5. Las ocho curiosidades piloto en ES/DE.
6. Suite espejo de preguntas conceptuales, personales, de evolución, seguridad
   y cambio de profundidad.

Si este recorrido funciona, ampliar el corpus será trabajo editorial repetible.
Si no funciona, se corrige el contrato antes de multiplicar traducciones.

## 17. Decisión final

Se mantiene el enfoque híbrido, pero con una corrección decisiva:

- **una verdad conceptual compartida**;
- **rendiciones revisadas por idioma**;
- **proyecciones QMD por locale dentro del mismo sistema**;
- **traducción del LLM solo como fallback controlado del chat**;
- **superficies deterministas sin traducción improvisada**;
- **gates simétricos antes de llamar habilitado a un idioma**.

Así, los tres niveles y la Pausa curiosa dejan de ser funciones españolas que
el modelo intenta trasladar, y se convierten en capacidades multilingües con un
ciclo editorial, técnico y de seguridad verificable.
