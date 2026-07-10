---
name: ayurveda-vitamap-runner
description: Genera un paquete de tarjetas Markdown VitaMap Ayurveda desde un unico tema, usando web_search, web_extract y escritura de archivos.
metadata:
  hermes:
    requires_toolsets: [web, file]
---

# Ayurveda VitaMap Runner

## Contrato

El usuario da solo un tema. Ejecuta herramientas y escribe archivos. No des un
plan, no pidas alcance, no termines con fuentes candidatas.

Uso previsto desde Telegram:

```text
/ayurveda-vitamap-runner Tema: <tema>
```

Tambien acepta:

```text
/ayurveda-vitamap-runner Tema: <tema> Email: <correo>
```

Si no se indica email, usa el destinatario principal/configurado en Himalaya si
esta disponible. Si no hay email disponible, entrega los `.md` como documentos
descargables en Telegram.

Salida minima obligatoria en una sola ejecucion:

```text
/opt/data/outbox/vitamap-ayurveda/<slug>/RUNNING.md
/opt/data/outbox/vitamap-ayurveda/<slug>/SOURCES.md
/opt/data/outbox/vitamap-ayurveda/<slug>/T1-BLOCKED.md o una tarjeta T1
/opt/data/outbox/vitamap-ayurveda/<slug>/<tarjeta-t2>.md o T2-BLOCKED.md
/opt/data/outbox/vitamap-ayurveda/<slug>/MANIFEST.md
/opt/data/outbox/vitamap-ayurveda/<slug>/EMAIL.md
```

Si una fase falla, escribe el archivo de bloqueo correspondiente y continua con
las fases posibles. No esperes otra sesion.

## Procedimiento Rigido

1. Deriva un slug ASCII, kebab-case, desde el tema.
2. Crea la carpeta `/opt/data/outbox/vitamap-ayurveda/<slug>/`.
3. Escribe `RUNNING.md` con tema, fecha y estado `iniciado`.
4. Busca con `web_search` y extrae con `web_extract`.
5. Escribe `SOURCES.md`.
6. Haz una auditoria de tarjetas posibles para el tema y escribela en
   `MANIFEST.md` mas adelante.
7. Decide T1:
   - Si hay pasaje clasico verificable, escribe una tarjeta T1.
   - Si no, escribe `T1-BLOCKED.md`.
8. Decide T2:
   - Si hay fuente academica suficiente, escribe una o varias tarjetas T2
     justificadas por intenciones recuperables distintas.
   - Si no, escribe `T2-BLOCKED.md`.
9. Decide si hacen falta T3, M2, M3 o M4 segun la matriz de tarjetas posibles.
10. Lee de vuelta cada tarjeta creada y ejecuta la validacion mecanica de esta
   skill. Si falla, reescribe la tarjeta antes de continuar.
11. Escribe `MANIFEST.md` solo despues de que la validacion mecanica pase.
12. Entrega el paquete por email si es posible; si no, por documentos Telegram.
13. Responde en chat solo con rutas de archivos creados y estado de entrega.

## Regla de Arranque y Presupuesto de Herramientas

Las primeras acciones con herramientas deben ser de archivo, no de investigacion:

1. crear la carpeta de salida;
2. escribir `RUNNING.md`;
3. escribir un `SOURCES.md` inicial con estado `pendiente`;
4. solo despues buscar fuentes.

No esperes a terminar la investigacion para escribir archivos. El paquete debe
existir aunque la investigacion se corte por limite de iteraciones.

Presupuesto operativo:

- Usa como maximo 4 busquedas web iniciales.
- Extrae como maximo 4 fuentes antes de decidir tarjetas.
- Si la investigacion no alcanza, escribe `T1-BLOCKED.md` y/o
  `T2-BLOCKED.md` con el motivo.
- Si queda poco presupuesto o aparece cualquier limite de iteraciones, deja el
  paquete en estado revisable: `RUNNING.md`, `SOURCES.md`, bloqueos, y
  `MANIFEST.md`.
- Nunca termines una ejecucion diciendo solamente que "lo siguiente seria
  generar el paquete". Genera siempre los archivos minimos posibles primero.

## Matriz de Tarjetas Posibles

Antes de redactar, decide que tipo de tema recibiste. No preguntes al usuario
salvo que el termino pueda referirse a dos entidades distintas.

## Tres Salidas Editoriales

VitaMap no debe convertir Ayurveda en una sombra de la analitica. Trabaja con
tres salidas complementarias. Clasifica cada tarjeta candidata antes de
redactarla y registra esa clasificacion en `MANIFEST.md`:

1. **hub**: concepto Ayurveda autonomo. Define el concepto, sus variantes y su
   lugar dentro del marco Ayurveda. Debe poder leerse sin depender de una
   analitica moderna.
2. **relacion-interna**: conexion entre conceptos Ayurveda. Explica relaciones
   como Rasa -> Rakta, Agni -> Ama, Dhatu -> Srotas, Pitta -> Rakta, sin
   convertirlas en fisiologia biomédica.
3. **puente-editorial**: comparacion limitada entre un area biomédica o
   biomarcador y una perspectiva Ayurveda. Solo existe si la relacion es
   honesta, util y explicitamente limitada. Un puente no es una equivalencia.

La red Ayurveda autonoma tiene cuerpo propio: conceptos, textos, practicas,
especies y debates internos de Ayurveda se conectan por su logica interna
(Agni, Ama, Ojas, Rasa, Dosha, Dhatu, Srotas, Ahara, Prakriti, etc.). Los
puentes editoriales son una segunda capa para preguntas modernas concretas.

No fuerces un puente. Si el tema es `rasa`, crea un paquete hub de Ayurveda. Si
el tema es `insulina desde Ayurveda`, crea una tarjeta puente solo si puedes
explicar con claridad que la relacion es tematica o historica, no una
traduccion de insulina a un concepto ayurvedico.

### Regla figura-fondo para facets

Antes de redactar cada tarjeta, decide si puede llevar facets biomedicos:

- `hub`: no usa `sistema`, `area_de_salud`, `categoria` ni `muestra`.
- `relacion-interna`: no usa `sistema`, `area_de_salud`, `categoria` ni
  `muestra`.
- `puente-editorial`: usa los facets canonicos del biomarcador moderno y deja
  claro que el puente es tematico, no una equivalencia.

La traduccion aproximada no basta para abrir facets. Para `rakta`, por ejemplo,
no uses `hematologico`, `salud-cardiovascular` ni `salud-hepatica` solo porque
una traduccion aproximada sea "sangre"; para `raktavaha srotas`, no uses
`cardiovascular` solo por la idea de canales/transporte; para `pitta`, no uses
`hepatobiliar` solo por asociaciones con bilis, calor o transformacion.

Si una tarjeta `hub` o `relacion-interna` contiene esos facets, falla la
validacion mecanica y debes reescribirla antes de crear `MANIFEST.md`.

Antes de escribir tarjetas, intenta leer la taxonomia canonica si existe:

```text
/opt/data/repos/VitaMap/corpus-preparation/corpus-taxonomy.json
```

Si no puedes leerla, usa estas reglas de seguridad:

- `marker` solo puede contener valores canonicos conocidos. Para conceptos
  ayurvedicos sin marker propio usa `marker: [ayurveda]`.
- No inventes markers como `rasa`, `agni`, `ama`, `ojas`, `pitta` o
  `jatharagni` salvo que existan en la taxonomia leida.
- Si un concepto merece ser nodo canonico nuevo, proponlo en `MANIFEST.md` bajo
  "Propuesta de ampliacion de taxonomia", pero no lo uses todavia como marker.
- `relacionado_con[].id` solo puede apuntar a markers canonicos. Las relaciones
  entre conceptos ayurvedicos no canonicos deben ir en el cuerpo de la tarjeta,
  en una seccion "Conexiones internas del marco ayurvedico".
- `sistema` y `area_de_salud` no se usan en hubs ni relaciones internas. Usalos
  solo si la fuente y el texto sostienen un `puente-editorial` claro. Si solo
  servirian para hacer parecer biomédico un concepto tradicional, omitilos.

### Concepto ayurvedico

Ejemplos: Agni, Ama, Ojas, Prakriti, Dosha, Srotas, Dhatu.

Considera:

- T1: fuente clasica verificable. Si no pasa la puerta T1, escribe
  `T1-BLOCKED.md`.
- T2 hub: definicion, historia, traduccion, tipologia y limites.
- T2 relacion-interna: crea una tarjeta separada solo si hay una intencion
  recuperable distinta y fuente suficiente, por ejemplo subtipos, estados,
  variantes, relaciones entre conceptos o debates filologicos.
- T3: solo si hay una pregunta moderna evaluable con evidencia cientifica
  concreta. No conviertas una revision conceptual en T3.

Toda T2 hub de concepto ayurvedico debe incluir, si la fuente lo permite:

- definicion y variantes terminologicas;
- lugar dentro del sistema Ayurveda;
- **Conexiones internas del marco ayurvedico**: conceptos vecinos y tipo de
  relacion, escritos en el cuerpo de la tarjeta sin inventar markers;
- **Lo que no permite concluir**: biomarcadores, diagnosticos modernos,
  eficacia, seguridad o tratamiento si la fuente no lo sostiene.

No crees una tarjeta "lista" separada si solo enumera terminos ya cubiertos por
otra T2. Integra esa lista como alias y seccion breve dentro de la tarjeta
principal, salvo que la lista responda una intencion recuperable distinta y no
duplique contenido.

Regla anti-duplicacion para conceptos:

- Antes de escribir una T2 nueva, compara su pregunta dominante con las T2 ya
  planificadas.
- Si el 70% o mas de su contenido seria una lista, definicion o resumen ya
  incluido en otra tarjeta, no la escribas.
- Mueve los sinonimos y terminos de busqueda a `alias`.
- Mueve listas breves a una seccion dentro de la tarjeta principal.
- Escribe `T2-BLOCKED.md` solo cuando una tarjeta candidata haya sido
  descartada por duplicacion, falta de fuente o falta de intencion recuperable.
  El bloqueo debe explicar que tarjeta se considero y por que no se genero.
- No crees una T2 tipo "indice" salvo que el indice tenga valor propio para
  desambiguar muchos terminos que no caben razonablemente en `alias`.

Para `Agni en sentido amplio`, considera como posibles:

- T1 Agni en texto clasico, si hay pasaje verificable.
- T2 Agni general: Paka, funcion transformadora y tipologia.
- T2 Jatharagni/estados: solo si la fuente cubre estados como sama, manda,
  vishama o tikshna con intencion propia.
- T2 Bhutagni/Dhatvagni: solo si la fuente aporta explicacion suficiente y no
  repite la T2 general.
- T3 medicion/operacionalizacion: solo si la fuente es un estudio o revision
  sobre cuestionarios, validacion o investigacion moderna; marcar siempre que
  no equivale a biomarcador.

### Especie, planta, preparado o sustancia natural

Ejemplos: amalaki, ashwagandha, triphala, guggulu, curcuma.

Considera:

- M1 identidad si la especie/preparado necesita desambiguacion botanica.
- M2 uso documentado tradicional si hay fuente historica, regulatoria o
  academica suficiente.
- M3 evidencia moderna solo para una preparacion e indicacion concretas.
- M4 seguridad si hay uso posible, interacciones, toxicidad, calidad,
  embarazo/lactancia o contaminacion.
- T1/T2 solo si el objetivo es textual o historico, no producto natural.

### Practica o intervencion ayurvedica

Ejemplos: panchakarma, nasya, abhyanga, rasayana como practica.

Considera:

- T1 si hay pasaje clasico verificable.
- T2 contexto historico/conceptual.
- T3 evidencia moderna por indicacion concreta.
- Seguridad si la practica tiene riesgos, contraindicaciones o calidad
  profesional relevante.

### Biomarcador moderno relacionado con Ayurveda

Ejemplos: glucosa, HbA1c, colesterol, vitamina A.

No generes Ayurveda como equivalencia ni obligues a la tradicion a seguir la
estructura de la analitica. Considera:

- T1/T2 solo como fondo historico o cultural, con limites explicitos.
- T2 puente editorial solo cuando haya una coincidencia tematica honesta. En
  ese caso el `marker` debe ser el biomarcador canonico moderno y
  `tradicion: ayurveda`; el cuerpo debe decir que no hay equivalencia directa.
- Si el puente no es claro, no lo generes. En `MANIFEST.md` deja un hueco de
  busqueda futura y recomienda recuperar la red Ayurveda autonoma como contexto
  lateral cuando el usuario pida esa perspectiva.
- T3 solo si evalua una practica/preparado concreto frente a una pregunta
  moderna.

## Auditoria de Cobertura del Tema

En `MANIFEST.md`, antes de listar archivos, incluye:

```text
Auditoria de tarjetas posibles:
- Tipo de tema:
- Tarjetas consideradas:
- Tarjetas generadas:
- Tarjetas bloqueadas:
- Motivo de cada bloqueo:
- Huecos recomendados para busqueda futura:
```

No generes tarjetas por cuota. Cada tarjeta debe tener fuente suficiente,
intencion recuperable distinta y limites claros.

## Busqueda

Usa 3-6 busquedas adaptadas al tema. No uses siempre `Agni` salvo que el tema
sea Agni o un subtipo relacionado.

Consultas generales:

- `site:carakasamhitaonline.com <tema> Ayurveda`
- `site:carakasamhitaonline.com <tema> "Cha.Sa."`
- `site:pmc.ncbi.nlm.nih.gov <tema> Ayurveda`
- `site:pubmed.ncbi.nlm.nih.gov <tema> Ayurveda`
- `site:ncbi.nlm.nih.gov/books <tema> Ayurveda`

Consultas especificas para Agni:

- `site:carakasamhitaonline.com <tema> Agni`
- `site:carakasamhitaonline.com Jatharagni Bhutagni Dhatvagni`
- `site:pmc.ncbi.nlm.nih.gov Agni Ayurveda`
- `site:pubmed.ncbi.nlm.nih.gov Agni Ayurveda`
- `site:ncbi.nlm.nih.gov/books Ayurveda Agni`

Fuentes preferidas:

- T1: `carakasamhitaonline.com`, `sushrutaproject.org`, `saktumiva.org`,
  `wisdomlib.org` solo si hay pasaje/capitulo verificable.
- T2/T3: `pmc.ncbi.nlm.nih.gov`, `pubmed.ncbi.nlm.nih.gov`,
  `ncbi.nlm.nih.gov/books`, revistas academicas accesibles.
- Evita paginas comerciales salvo como pista, no como base de tarjeta.

## SOURCES.md

Debe incluir:

- tema;
- fecha;
- consultas usadas;
- fuentes extraidas con URL, titulo, tipo candidato y notas;
- fuentes rechazadas y motivo;
- limite editorial principal.

Clasifica cada fuente como:

- `T1-candidate`
- `T1-blocked`
- `T2`
- `T3`
- `M2`
- `M3`
- `M4`
- `pista`

## Puerta T1

Una T1 solo es valida si tienes todo:

- obra clasica identificada;
- capitulo/seccion y numeracion interna cuando exista;
- URL verificable del pasaje;
- separacion clara entre texto base, traduccion, comentario y resumen.

No es T1:

- pagina conceptual;
- revision narrativa;
- glosario;
- pagina que enumera referencias;
- PDF no extraido.

Si no pasa esta puerta, escribe `T1-BLOCKED.md` con:

- tema;
- motivo;
- mejor pista encontrada;
- que faltaria para convertirla en T1;
- si puede cubrirse como T2.

## Tarjeta T2

Usa la mejor fuente academica extraida. Para Agni suele ser aceptable una
revision PMC/PubMed sobre fisiologia/conceptualizacion de Agni si fue extraida
y contiene definicion, tipologia o contexto historico.

Reglas:

- No conviertas conceptos ayurvedicos en diagnosticos o biomarcadores modernos.
- La tarjeta debe empezar y terminar su frontmatter con `---`.
- `source_url` es URL cruda, no Markdown.
- Si existen, incluye `doi`, `pmid` o `pmcid`; si no existen, omite el campo.
- No uses `doi: null`, `pmid: null`, `pmcid: null` ni `muestra: none`.
- `publication_date` es fecha real de la fuente si esta disponible; si no,
  omite el campo.
- Incluye `source_language` cuando sea evidente.
- `tarjeta_id` debe ser identico al nombre del archivo sin `.md`, en
  minusculas y kebab-case. No uses identificadores tipo `T2-AGNI-001`.
- El nombre del archivo debe ser el mismo `tarjeta_id` mas `.md`.
- Incluye `limitations`.
- Parafrasea; evita citas largas.
- Evita expresiones que parezcan equivalencia biomédica directa. No digas
  "equilibrio metabolico" salvo que aclares que es una traduccion aproximada
  dentro del marco ayurvedico; prefiere "procesos de transformacion descritos
  por el marco ayurvedico".
- Redacta una sola intencion recuperable: definicion/contexto, no evidencia
  clinica ni recomendacion.

Frontmatter minimo:

```markdown
---
title: "..."
source_url: "https://..."
doi: "..."
pmid: "..."
pmcid: "..."
publication_date: "AAAA"
source_kind: tradition-context
source_type: traditional-scholarly-context-summary
rights_status: permitted
facets_version: 1
tarjeta_id: ...
dominio: tradiciones-practicas
tipo:
  - concepto_tradicional
marker:
  - ayurveda
seccion: tradicion
tradicion: ayurveda
alias:
  - ...
source_language: en
limitations:
  - "..."
---
```

Omite `doi`, `pmid`, `pmcid`, `publication_date` o `source_language` si no los
puedes verificar. No dejes campos vacios o nulos.

La primera linea real del archivo debe ser exactamente `---`. No puede haber
texto, espacios, BOM ni `title:` antes de esa linea.

En hubs y relaciones internas, omite tambien `sistema`, `area_de_salud`,
`categoria` y `muestra`. Para Agni general, evita `digestivo` salvo que hayas
reclasificado la tarjeta como `puente-editorial` y el texto sostenga un punto de
contacto tematico claro; para Rakta no uses `hematologico`,
`salud-cardiovascular` o `salud-hepatica` solo porque la traduccion aproximada
sea "sangre".

## Facets y RAG

La tarjeta debe ser una unidad recuperable pequena, no una monografia.

Para conceptos ayurvedicos sin marker canonico propio:

- `dominio: tradiciones-practicas`
- `tipo: [concepto_tradicional]`
- `marker: [ayurveda]`
- `seccion: tradicion`
- `tradicion: ayurveda`
- el concepto real debe aparecer en `title`, `alias` y cuerpo.
- si la tarjeta es `hub` o `relacion-interna`, no declares markers biomédicos.
  La recuperacion lateral por `tradicion: ayurveda` y `marker: [ayurveda]` debe
  traerla cuando el usuario pida la perspectiva tradicional.

Para un puente biomarcador -> Ayurveda:

- usa facets del biomarcador moderno desde la taxonomia (`dominio`, `tipo`,
  `marker`, `categoria`, `muestra`, `sistema`, `area_de_salud`);
- usa `seccion: tradicion` y `tradicion: ayurveda`;
- incluye el concepto Ayurveda en `title`, `alias` y cuerpo, no como marker si
  no es canonico;
- no uses `relacionado_con` para conceptos no canonicos;
- explica la relacion como "punto de contacto tematico", "comparacion
  editorial", "fondo historico" o "lenguaje de otra tradicion", no como
  traduccion fisiologica.
- el primer parrafo debe distinguir los dos planos: "Biomedicina mide/describe
  X; Ayurveda abordaria el terreno desde conceptos como Y, sin equivalencia
  directa".

Usa `sistema` y `area_de_salud` solo en `puente-editorial`, cuando ayuden a
recuperar sin crear una equivalencia falsa. Para Agni general, `digestivo` y
`salud-digestiva` solo son aceptables si la tarjeta fue reclasificada como
puente y el cuerpo distingue los planos; evita añadir
`endocrino-metabolico` salvo que la fuente sea academica y la tarjeta deje
claro que no hay equivalencia biomédica.

No crees T3 si la fuente solo explica el concepto tradicional. T3 requiere una
pregunta cientifica moderna evaluable.

## Validacion Mecanica Obligatoria

Despues de escribir cada tarjeta `.md`, lee el archivo completo o al menos sus
primeras 40 lineas. No confies en memoria.

No instales dependencias ni paquetes para validar. No uses `apt-get`, `pip`,
`npm`, `python`, ni comprobadores YAML externos. La validacion mecanica de esta
skill es una lectura textual simple del archivo escrito y del `MANIFEST.md`.

La tarjeta pasa solo si:

- la primera linea del archivo es exactamente `---`;
- existe una segunda linea `---` que cierra el frontmatter antes del cuerpo;
- `tarjeta_id` coincide exactamente con el nombre del archivo sin `.md`;
- el nombre del archivo esta en minusculas y kebab-case;
- no hay otro archivo de tarjeta para la misma capa con mayusculas o id antiguo
  listado como valido en `MANIFEST.md`;
- `source_url` no usa formato Markdown;
- no contiene `null`, `none`, `doi: null`, `pmid: null`, `pmcid: null` ni
  `muestra: none`;
- no contiene markers no canonicos. Si no pudiste verificar taxonomia, usa solo
  `marker: [ayurveda]` para hubs de conceptos Ayurveda;
- si la funcion editorial es `hub` o `relacion-interna`, no contiene `sistema`,
  `area_de_salud`, `categoria` ni `muestra`;
- si usa una fuente PMC con DOI/PMCID conocidos, esos campos se incluyen;
- `source_type` mapea a `seccion` segun `corpus-taxonomy.json`;
- las frases sobre metabolismo, fisiologia moderna o biomarcadores incluyen
  cautela o se sustituyen por lenguaje interno del marco ayurvedico.

Si falla cualquier punto, reescribe el archivo antes de crear `MANIFEST.md`.

Para Agni/PMC3221079, si esa es la fuente usada, el frontmatter debe incluir:

```yaml
doi: 10.4103/0974-8520.77159
pmcid: PMC3221079
publication_date: '2010'
source_language: en
```

Y evita la frase `transformacion metabolica`; usa:

```text
digestión y procesos de transformación descritos por el marco ayurvédico
```

## Checklist antes de MANIFEST

Antes de escribir `MANIFEST.md`, verifica:

- todo archivo de tarjeta empieza con `---`;
- `tarjeta_id` coincide con el nombre del archivo sin `.md`;
- `source_type` mapea a `seccion` segun `corpus-taxonomy.json`;
- no hay campos nulos (`null`, `none`) ni URLs Markdown en frontmatter;
- la tarjeta declara limites y revision humana requerida;
- la funcion editorial de cada tarjeta (`hub`, `relacion-interna` o
  `puente-editorial`) queda clara en `MANIFEST.md`;
- las tarjetas `hub` y `relacion-interna` no llevan `sistema`,
  `area_de_salud`, `categoria` ni `muestra`;
- no mezcla T2 con T3, seguridad ni recomendaciones;
- no afirma equivalencias entre Ayurveda y biomedicina moderna.
- cada tarjeta hub incluye conexiones internas o explica por que no hay fuente
  suficiente para declararlas;
- cada tarjeta puente declara si el puente es fuerte, debil o no recomendable,
  y por que;
- no hay tarjetas redundantes: dos tarjetas no deben responder la misma
  pregunta con la misma fuente y casi el mismo contenido;
- si una tarjeta fue descartada por duplicacion, debe aparecer como bloqueada en
  `MANIFEST.md`, no como archivo candidato;
- si hay duplicados antiguos, `MANIFEST.md` debe marcar cuales ignorar y cuales
  son validos. No listes duplicados antiguos como tarjetas generadas validas.

## MANIFEST.md

Debe listar:

- tema;
- fecha;
- ruta;
- archivos creados;
- fuentes usadas;
- capas generadas;
- capas bloqueadas;
- advertencias editoriales;
- revision humana requerida: si.
- checklist editorial: aprobado / requiere correccion, con motivo.

Reglas estrictas:

- Lista solo archivos que realmente existen en la carpeta final.
- Cada nombre listado debe coincidir exactamente con el nombre de archivo
  escrito.
- No listes `T2-BLOCKED.md` si no lo escribiste.
- No listes nombres antiguos, temporales o renombrados.
- Incluye una seccion "Red Ayurveda autonoma" con nodos internos cubiertos y
  huecos, separando tarjetas `hub` y `relacion-interna`.
- Incluye una seccion "Puentes editoriales" con puentes creados, puentes
  descartados y motivo.
- Incluye "Propuesta de ampliacion de taxonomia" cuando el tema produjo
  conceptos que deberian ser markers o topics canonicos, pero no los uses en
  frontmatter hasta que existan.

## Entrega Email / Telegram

Despues de `MANIFEST.md`, intenta entregar todos los `.md` del paquete:

- `RUNNING.md`
- `SOURCES.md`
- `T1-BLOCKED.md` o tarjeta T1
- tarjeta T2 o `T2-BLOCKED.md`
- `MANIFEST.md`

Si `email:himalaya` o una herramienta de email esta disponible:

- envia los `.md` como adjuntos;
- asunto: `VitaMap Ayurveda - <tema> - tarjetas candidatas`;
- destinatario: el indicado en `Email:` o el principal configurado;
- cuerpo breve: archivos adjuntos, capas generadas/bloqueadas, ruta local y
  advertencia de revision humana;
- no pegues el contenido completo de las tarjetas en el cuerpo.

Despues escribe `EMAIL.md` con:

- estado: enviado / no-enviado;
- destinatario usado, si se conoce;
- asunto;
- archivos adjuntos;
- error si fallo.

Si email no esta disponible o falla, no bloquees el paquete. Responde con rutas
absolutas de los `.md` y termina con:

```text
[[as_document]]
```

Esto permite que Telegram entregue los `.md` como documentos descargables.

## Fallos

Si `web_search` o `web_extract` fallan, escribe `SOURCES.md` explicando el fallo
y continua con `T1-BLOCKED.md`, `T2-BLOCKED.md` y `MANIFEST.md`.

Si no puedes escribir archivos, responde exactamente:

```markdown
## File tool bloqueado
- Ruta intentada:
- Error:
```
