# Decisiones arquitectónicas (ADR ligero)

Documento vivo de decisiones técnicas con su contexto. Una entrada por
decisión; nunca se borran, solo se marcan como *superseded* si cambian.

**Siguiente número libre: ADR-021.** (El orden de las entradas no es
monotónico; comprobar aquí antes de asignar número.)

---

## ADR-020 · Modo demostración por configuración, no por bifurcación del proyecto
**Estado:** aceptada · 2026-08-13

**Contexto.** El piloto con datos reales queda en pausa: cerrar el frente legal
(DSFA, análisis MDR, registro Art. 30, contratos Art. 28, firmas profesionales)
no es abordable por una sola persona, y el corpus necesita colaboradores. Al
mismo tiempo interesa que la instancia sea visitable como muestra de
arquitectura y portafolio.

Son dos usos con requisitos opuestos —uno custodia datos de salud reales, el
otro solo tiene que enseñarse— y la tentación es separarlos: un repositorio
privado y otro público, o una rama paralela permanente.

**Decisión.** Ni lo uno ni lo otro: **un repositorio, una rama, y el modo como
variable de entorno**, siguiendo el patrón que ya establece `lib/flags.ts`.

`DEMO_MODE=true` convierte la instancia en muestra: consulta anónima sobre
datos sintéticos de solo lectura, con las cuotas de ADR-019; sin subida, sin
registro y sin cobro. Apagado (por defecto), la aplicación es el piloto de
siempre, con sus puertas intactas.

**Por qué no dos repositorios.** Cada corrección —una dependencia parcheada, un
fallo de seguridad— habría que aplicarla dos veces. La divergencia es cuestión
de meses, y el que diverge peor es el público: justo el que se enseña. Además
duplica el trabajo de higiene del repositorio.

**Por qué no una rama paralela.** Una rama que nunca se fusiona es un segundo
repositorio con peor ergonomía. La deuda de fusión crece hasta que fusionar da
miedo y se deja de hacer.

**Consecuencia deseable.** Que el mismo código sirva para ambos usos *es* la
demostración de arquitectura: quien lea `flags.ts`, el choke point de ADR-018 y
las puertas del checklist ve que la separación entre lo que se enseña y lo que
se custodia está resuelta en el diseño. Dos repositorios divergentes no cuentan
esa historia.

**Condición no negociable.** El modo demostración debe declarar de forma visible
que los datos son ficticios y que es una muestra, no un servicio. Es una
herramienta de salud: la claridad sobre qué es cada cosa forma parte del
producto.

**Registro y cobro cerrados mientras dure el modo.** El alta ya exige código de
invitación nominativa (ADR-012), así que ningún visitante puede registrarse ni
pagar. Se mantiene deliberadamente: **no se cobra por un servicio que todavía no
puede prestarse**. Quien pagara adquiriría derecho a subir sus analíticas, que es
justo lo que está detrás de las puertas del checklist; cobrar sin poder admitirle
sería un problema de consumo, no solo una incoherencia.

En su lugar, la demostración sustituye el formulario de registro por una
explicación honesta —qué es VitaMap, en qué estado está— y una vía de contacto.
Para un portafolio funciona mejor que un botón de pago, y es además el canal
natural para encontrar a los colaboradores que el proyecto necesita.

**Datos del operador.** La excepción registrada en el checklist (2026-08-13)
permite al administrador subir analíticas propias reales bajo su propio riesgo.
No afecta a este modo: la demostración usa un sujeto distinto (`demo-public`)
sembrado solo con datos sintéticos, y la memoria del operador nunca se expone.

**Implementación: una ruta, no dos.** El visitante anónimo entra por el mismo
`/api/chat` que todo el mundo, a través de `requireChatContext()` en
`lib/data-access-guards.ts`. Se intenta primero el camino con sesión —el choke
point de ADR-018, sin cambios para quien tiene cuenta— y solo ante
`UnauthorizedError` **con el modo encendido** se cae al camino anónimo.

Cuatro garantías de ese diseño:

1. **El sujeto es una constante**, `DEMO_SUBJECT_ID`, nunca tomado de la
   petición: un visitante no puede direccionar los datos de una persona real.
2. **Una sesión válida sin suscripción sigue recibiendo 402.** Solo se cae al
   camino anónimo por falta de sesión, no por falta de pago: quien tiene cuenta
   no se cuela por la puerta de los visitantes.
3. **La clave de cuota es la IP**, no el sujeto — todos los visitantes comparten
   sujeto, así que usarlo como clave daría una sola cuota para el mundo entero.
   La IP se toma de las cabeceras que pone Caddy con `header_up`, que
   **reemplaza** en vez de añadir, de modo que no es falsificable. IPv6 se
   recorta al prefijo /64 para que cambiar de dirección dentro del propio rango
   no renueve la cuota.
4. **El límite de ráfaga anónimo es más estrecho** (4/min frente a 10/min).

Duplicar la ruta habría sido más simple de leer y peor de mantener: el chat
concentra guardrail, detector de crisis, recuperación y política conversacional,
y una copia paralela habría divergido en seguridad — que es justo donde no debe
divergir. Es el riesgo que este ADR advierte en sus consecuencias.

**Lo que el visitante no puede hacer** no se apoya en comprobaciones nuevas sino
en que la ruta de chat solo lee: no escribe memoria y sus eventos de auditoría
no contienen contenido de la conversación (solo recuentos y veredicto). La
subida, la exportación y el borrado siguen exigiendo sesión y suscripción.

**Consecuencias.** El checklist de go-live queda marcado como pausado con fecha
y motivo, sin rebajar ninguna casilla. Reanudar es apagar la variable y seguir
por la Puerta 0. El riesgo a vigilar es que el modo demostración acumule código
propio hasta convertirse de hecho en la bifurcación que se quería evitar:
mantenerlo como un condicional fino sobre las mismas rutas, no como una
aplicación paralela.

---

## ADR-019 · Cuota diaria de inferencia en tres capas
**Estado:** aceptada — capa de suscriptor y tope global en producción; capa
anónima implementada a la espera de la demo pública · 2026-08-13

**Contexto.** Se plantea abrir una demostración pública sin suscripción, para
que la instancia sirva de portafolio: consultar el asistente sobre un conjunto
de datos sintéticos de solo lectura, sin subir nada. Eso expone el endpoint más
caro del sistema a internet.

Dos riesgos concretos. El de coste: la inferencia se paga por token y cada
consulta dispara **varias** pasadas (generación + guardrail y a veces
reescritura, ADR-006/ADR-010), así que el gasto real por pregunta es un
múltiplo del aparente. Y el de abuso: un endpoint LLM abierto acaba
localizándose y usándose como proxy gratuito de terceros.

`lib/rate-limit.ts` no cubre esto: es un limitador de ráfaga en memoria (N por
minuto) cuyo objetivo declarado es que una sesión no sature la CPU. Acota la
velocidad, no el gasto acumulado, y se reinicia con el proceso.

**Decisión.** Cuota diaria persistente en tres capas, en `lib/llm-quota.ts`:

| Capa | Actor | Propósito | Defecto |
|---|---|---|---|
| `anon` | Visitante sin cuenta (clave: IP) | Que la instancia no sea un LLM gratuito ajeno | 12/día |
| `user` | Persona suscrita (clave: userId) | Red ante sesión robada o cliente en bucle | 100/día |
| global | Toda la instancia | Techo conocido de la factura | 300/día |

Configurables con `LLM_DAILY_ANON_MAX`, `LLM_DAILY_USER_MAX` y
`LLM_DAILY_GLOBAL_MAX`. `LLM_DISABLED=true` es un interruptor de emergencia que
corta toda inferencia sin tocar sesión, exportación, borrado ni billing.

Cuatro decisiones de diseño que conviene no revertir sin motivo:

1. **Se cuenta una unidad por consulta del usuario**, no por llamada al modelo.
   Contar llamadas haría que el número configurado no significase nada
   intuitivo. La contrapartida es que el multiplicador de pasadas hay que
   tenerlo presente al dimensionar el tope global.
2. **Persistente en `auth.sqlite`**, no en memoria. Con contadores en memoria,
   reiniciar el contenedor reiniciaría el tope global — justo la garantía que
   no debe poder saltarse.
3. **Se comprueba global antes que actor.** Con la instancia al tope no se
   gasta cuota individual de nadie, y el motivo devuelto distingue "no hay
   capacidad" de "has llegado a tu límite".
4. **Un rechazo no consume cuota**, y existe `refundLlmQuota()` para consultas
   que se abortan antes de llegar al modelo.

El límite de suscriptor es holgado a propósito: **en uso normal no debe
notarse**. Si alguien lo alcanza legítimamente, es señal de que hay que subirlo,
no de que esté racionando bien.

**Consecuencias.** El gasto de inferencia tiene un máximo conocido de antemano,
condición previa para abrir cualquier acceso sin suscripción. La tabla
`llm_quota_usage` crece con el número de actores distintos por día;
`pruneQuotaUsage()` la poda. Suite: `npm run test:llm-quota` (27
comprobaciones).

**Pendiente.** La capa `anon` no tiene todavía consumidor: la ruta de demo
pública no existe. Antes de abrirla hacen falta, además, una aceptación ligera
previa al primer mensaje (carácter educativo + las consultas viajan a un
proveedor UE, ADR-014) y la garantía en código de que esa vía no persiste nada.

---

## ADR-018 · Supporters con cubículos (Variante A) sobre choke point de autorización genérico
**Estado:** borrador — implementación base en código, acceso cruzado APAGADO por flag · 2026-08-02

> Nota de numeración: PROPUESTA-USUARIOS-TERAPEUTAS-Y-ACCESO-PACIENTES.md
> reservaba "ADR-017", pero ese número fue asignado el 2026-07-01 a los
> matices de evidencia RAG. Esta decisión es, por tanto, ADR-018.

**Contexto.** Se quiere introducir el usuario **supporter/acompañante** que
trabaje con datos de varios sujetos (pacientes o personas acompañadas) sin
degradar el aislamiento del usuario común ("cada usuario solo toca su propia
carpeta"). La propuesta detallada (variantes A/B/C, modelo de datos, riesgos)
vive en `docs/es/legal/PROPUESTA-USUARIOS-TERAPEUTAS-Y-ACCESO-PACIENTES.md`.

**Decisión.**
**Variante A (cubículos) para el piloto, sobre un choke point de autorización
genérico ya preparado para la Variante B (grant entre cuentas).**

La pieza de seguridad se construyó primero, según la regla de oro de la
propuesta (§8): el choke point y su suite de invariantes existen y pasan
**antes** de que ninguna UI permita acceso cruzado.

Implementación base (2026-08-02):

| Pieza | Fichero |
|---|---|
| Choke point `resolveDataSubject` + tablas `data_subject` / `data_access_grant` + gestión de cubículos y grants | `apps/web/lib/data-access.ts` |
| Guardas de ruta `requireDataSubject` / `requireDataSubjectFromRequest` (sustituyen a `requireSubscribedUserId*` en rutas de datos) | `apps/web/lib/data-access-guards.ts` |
| `safeUserId` extraído a módulo sin dependencias (compartido por sesión y choke point) | `apps/web/lib/user-id.ts` |
| Suite de seguridad de los 7 invariantes (§5.3 de la propuesta) | `apps/web/scripts/test-data-access.ts` (`npm run test:data-access`) |
| Control automático del invariante 7 (ninguna ruta direcciona datos fuera del choke point) | `apps/web/scripts/check-data-access-invariant.ts` (`npm run check:data-access`) |
| Flag de módulo, apagado por defecto | `SUPPORTER_ACCESS_ENABLED` en `lib/flags.ts` |
| Nuevas acciones de auditoría `data.cross_access.*`, `data.subject.*`, `data.grant.*` | `apps/web/lib/audit.ts` |

Las 26 rutas/acciones de datos migraron de `requireSubscribedUserId*()` a
`requireDataSubject*(scope)` con scopes `read` (páginas), `chat` (chat y
curiosity) y `manage` (mutaciones). Para el usuario común nada cambia: sin
`targetSubjectId`, el choke point devuelve su propio id por el camino corto sin
tocar la tabla de grants. Jerarquía de scopes: `manage` ⊇ `chat` ⊇ `read`.

Excepción deliberada (allowlist del control automático): `app/api/export`
(exportación RGPD) opera **solo** sobre datos propios y nunca debe ser
direccionable a otro sujeto, así que queda fuera del choke point con
`requireUserIdFromRequest`. Igual para ajustes/borrado de cuenta.

**Razón.** La Variante A es la que menos superficie abre: un cubículo es una
carpeta `data/users/<id>` cuyo id no posee ninguna otra cuenta, así que el
aislamiento del usuario común queda intacto por construcción. La fontanería
existente (datos direccionados por `userId` explícito, retrieval por parámetro,
auditoría con actor/sujeto separados) hacía el coste pequeño. El choke point
genérico ("¿puede el actor A operar sobre el sujeto S con scope X?") permite
añadir la Variante B después solo con filas `origin='patient_grant'`, sin tocar
las rutas otra vez.

**Fail-closed en dos capas:** sin grant activo → `ForbiddenError` (idéntico
exista o no el sujeto, anti-enumeración); y todo acceso cruzado además detrás de
`SUPPORTER_ACCESS_ENABLED=false` por defecto.

**Advertencia.** Antes de encender el flag en un entorno con datos reales:
estatutos del supporter versionados y sección correspondiente en
`GUIA-LEGAL-PILOTO-ALEMANIA.md`; flujo de invitación con
`invitation_kind='supporter'`; MFA para cuentas supporter (ADR-009); y UI de
selector de contexto que pase `targetSubjectId` explícito. Cuando exista ese
selector, las llamadas a auditoría de las rutas deben usar `actor` (no
`subject`) como actor del evento.

---

## ADR-017 · Preservar los matices de evidencia en la generación RAG
**Estado:** aceptada · 2026-07-01

**Contexto.** Los fragmentos de fuente se truncaban a 600 caracteres antes de
entrar en el prompt (`SNIPPET_MAX_CHARS` en `lib/qmd-prompt.ts`). Las tarjetas de
evidencia se redactan por diseño en 250–500 palabras con sus matices al final
("qué no permite concluir", "qué se sabe y qué no", "los suplementos no ayudan
sin déficit"). A 600 caracteres solo sobrevivía la primera sección, así que esos
caveats se amputaban antes de llegar al modelo. Efecto observado: ante "¿qué como
para las uñas?", el asistente reproducía la intro de la tarjeta de biotina y
omitía el matiz "suplementar no ayuda sin déficit".

**Decisión.** Truncación diferenciada por tipo de fuente en `wrapForPrompt`:
evidencia (curada, acotada) a **2000** caracteres; memoria personal (larga, no
curada) a **600**. Las `limitations` del frontmatter no se truncan (llegan
siempre). En la misma dirección, el guardarraíl amplía
`unsupported_factual_claim` a relaciones nutriente↔síntoma/tejido sin fuente.

**Razón.** La memoria personal puede ser larga y no curada → recorte corto. La
evidencia es curada y su valor honesto vive en los límites del final → hay que
conservarla entera.

**Advertencia.** No bajar el límite de evidencia (2000) por coste de tokens sin
una prueba de regresión que demuestre que los caveats siguen llegando. La
garantía del test es "no volvemos a truncar corto en `wrapForPrompt`", **no** "el
caveat siempre llega al modelo": eso depende además de si QMD entrega el cuerpo o
un sub-trozo (`bestChunk`), fuera del alcance de esta capa.

**Implementación.** `SNIPPET_MAX_CHARS_EVIDENCE` / `SNIPPET_MAX_CHARS_PERSONAL` en
`lib/qmd-prompt.ts`; guardarraíl en `lib/llm.ts` y `lib/guardrail.ts`. Regresión
en `scripts/test-qmd-prompt.mts` (evidencia con caveat tras el carácter 600 debe
aparecer; memoria personal larga debe truncarse).

**Consecuencias.** Las respuestas conservan los límites de la evidencia; el coste
de prompt sube algo (hasta ~2000×3 en evidencia), asumible con el modelo externo
(ADR-014). Complementa a ADR-016 (frontera educativa) y a ADR-006/013 (no
prescribe): la regla 13 alimentaria del system prompt evita que "¿qué como?" se
convierta en receta.

---

## ADR-016 · Guía educativa del asistente (opcional, desactivable)
**Estado:** aceptada · 2026-06-15

**Contexto.** Ante "¿qué me recomiendas?", el asistente desviaba a una
pregunta abierta (observación + pregunta) sin ayudar a entender el valor
ni preparar la consulta con un profesional; se leía como evasivo. Pero el
producto no diagnostica, no prescribe y no fija objetivos individuales
(ADR-006, ADR-013), y las funciones interpretativas amplían el riesgo
regulatorio que el piloto debe poder desactivar (GUIA-OPERATIVA B-1). El
consentimiento posiciona VitaMap como herramienta educativa.

**Decisión.** Regla opcional (regla 14; renumerada desde la 13 el 2026-07-01 al
añadirse la regla 13 de orientación alimentaria — no prescribir dieta, ver
ADR-017) tras el flag `ASSISTANT_EDU_GUIDE`.
Cuando un valor cae fuera del intervalo de referencia del propio informe, o
la persona pide consejo/veredicto, el asistente explica el marcador EN
GENERAL con fuentes de educación institucional citadas, como preparación
para el especialista, SIN interpretar el resultado personal (no afirma
causa, significado individual ni nivel de preocupación). Frontera:
educación general (permitida) vs interpretación del resultado individual
(riesgo regulatorio, prohibida). Agnóstica de proveedor: no rompe la
invariante de ADR-014 (local y externo ven el mismo prompt).

**Implementación.** `EDU_GUIDE_RULE` en `lib/llm.ts`, añadida de forma
condicional al system prompt en `app/api/chat/route.ts`.
`ASSISTANT_EDU_GUIDE` en `.env.example` e `infra/.env.example`, por defecto
`false`. Depende de que exista corpus de educación institucional en
`data/kb/` para esos marcadores. El comportamiento se fija en una suite de
regresión (`test-data/chat-regression-cases.json`).

**Nota (corrección).** El primer intento publicó esos marcadores por git en
`data/kb/markers/`. Se revirtió: el KB del despliegue ya contenía ese corpus
(y más completo, incluidas las "Tarjetas B" de alimentación/factores),
gestionado vía `/admin/corpus` directamente en el volumen Docker, que no se
versiona en git. La dependencia de corpus la satisface ese corpus del
volumen, no el repo. Lección: el corpus vivo está en el volumen, no en
`data/kb/` del repositorio (ver QMD-EVOLUCION §4.7).

**Riesgo conocido (ADR-014).** El prompt ajustado contra
`mistral-small-latest` transfiere solo parcialmente a Qwen3-4B: re-validar
los casos de la suite contra el modelo local antes del blindaje final. Las
Tarjetas B (`nutrition-lifestyle-summary`) quedan retenidas hasta que el
caso de regresión confirme que el asistente las cita en descriptivo y no
las convierte en pauta personal.

**Consecuencias.** El asistente pasa de evasivo a guía-para-entender dentro
de los límites del producto. La función educativa/interpretativa es
explícita y conmutable por configuración. La dependencia del corpus queda
documentada.

---

## ADR-015 · Cifrado de disco (LUKS) diferido a Fase 2
**Estado:** aceptada · 2026-06-13

**Contexto.** El análisis de brechas declara LUKS como mitigación de la
memoria personal en claro en disco. En un VPS, LUKS implica que cada
reinicio (kernel updates, incidencias del host) deja la máquina parada
esperando passphrase en consola, o exige dropbear en initramfs. Con un
solo operador y 3 usuarios piloto, ese coste operativo supera el riesgo
que mitiga.

**Decisión.** Diferir el cifrado at-rest de la memoria a Fase 2
(coincidiendo con la re-provisión del servidor GPU, donde se evaluará
LUKS+dropbear o cifrado a nivel de aplicación). Mitigaciones vigentes en
Fase 1: PDFs originales cifrados con age; acceso al VPS solo por SSH con
clave; backups restic cifrados; 3 usuarios piloto con consentimiento
informado; aislamiento por usuario en filesystem.

**Consecuencias.** Un atacante con acceso al disco del hipervisor o a un
snapshot del proveedor leería los `.md` de memoria y los índices SQLite.
Riesgo aceptado temporalmente y documentado; el texto de consentimiento
no promete cifrado at-rest del almacenamiento activo. Disparador de
revisión: paso a GPU server o >10 usuarios (mismo trigger que ADR-014).

---

## ADR-014 · Inferencia externa UE temporal durante el piloto
**Estado:** aceptada · 2026-06-12

**Contexto.** Qwen3-4B en llama.cpp sobre el CCX13 (CPU) produce
latencias de 50-80 s por respuesta: generación non-streaming + segunda
pasada del guardrail + tercera pasada ocasional (rewrite), cada una con
prefill completo (~1.5k system + contexto RAG + historial). Inutilizable
para ajustar el RAG y validar la fluidez conversacional con los 3
usuarios piloto. La privacidad total (inferencia 100% local) es la
bandera del producto, pero es una promesa de producción, no un requisito
de la fase de ajuste.

**Decisión.** Durante el piloto, la inferencia puede delegarse a una API
OpenAI-compatible de un proveedor UE (Mistral La Plateforme,
`mistral-small-latest`). Todo lo demás permanece local: índice RAG,
auth, perfiles, audit log, backups. Solo viajan los prompts en tránsito.

Condiciones obligatorias antes de activar el modo externo:
opt-out de entrenamiento confirmado en el Admin Console del proveedor;
Zero Data Retention si el plan lo permite; consentimiento explícito de
cada usuario piloto en el onboarding ("durante el piloto las consultas
se procesan vía un proveedor UE con retención cero; en producción la
inferencia será 100% local"); no publicitar "privacidad total" mientras
el modo externo esté activo.

**Implementación.** `LLM_PROVIDER` (local|external) en `lib/env.ts`.
`lib/llm.ts` omite los campos específicos de llama.cpp
(`chat_template_kwargs`, `cache_prompt`) y adapta `response_format` al
dialecto OpenAI cuando el proveedor es externo. En compose, el servicio
`llm` queda tras el perfil `local-llm`; el modo se cambia solo con
variables en `infra/.env` (ver `.env.example`). El system prompt, el
guardrail y el flujo de chat no cambian.

**Disparador de retorno a local (blindaje final).** Cualquiera de:
paso a servidor GPU; fin de la fase piloto y apertura a usuarios no
conocidos; >10 usuarios. El retorno es revertir las variables del MODO A
en `infra/.env`.

**Riesgo conocido.** Los ajustes de prompts/guardrail hechos contra
Mistral transfieren solo parcialmente a Qwen3. Mitigación: mantener una
suite de regresión de 30-50 preguntas/respuestas validadas durante el
piloto y correrla contra el modelo local antes del blindaje final.

**Consecuencias.** Latencia esperada 1-3 s por pasada. El CCX13 libera
~5 GB de RAM y 3 vCPU. Coste estimado <2 $/mes con 3 usuarios. La
promesa de privacidad total queda explícitamente diferida, no rota.

---

## ADR-013 · Figura, fondo y procedencia del corpus compartido
**Estado:** actualizada · 2026-06-12

**Contexto.** La base compartida puede reunir guías clínicas, estudios,
documentos educativos y fuentes de tradiciones como Ayurveda o medicina
tradicional china. El campo actual `evidence_level` mezcla fuerza empírica,
tipo documental y pertenencia a una tradición, lo que puede producir
equivalencias engañosas.

**Decisión.** La memoria personal es el centro de VitaMap. La intención de la
pregunta decide qué carril ocupa la figura:

- las afirmaciones sobre diagnóstico, eficacia, parámetros clínicos y seguridad
  priorizan evidencia clínica y educación institucional verificable;
- las preguntas históricas, textuales, culturales o filosóficas priorizan
  fuentes tradicionales y estudios académicos adecuados;
- las comparaciones recuperan ambos carriles por separado.

Las fuentes tradicionales:

- se atribuyen siempre como tradición y no como evidencia clínica;
- no confirman científicamente una afirmación;
- pueden ocupar el primer plano cuando responden la intención de la persona;
- se explican primero desde sus propios términos, contexto y debate académico;
- no reciben una refutación clínica automática cuando la pregunta no es clínica.

Figura y fondo no implican equivalencia epistemológica. Si dos fuentes hacen la
misma afirmación clínica, se aplica el estándar clínico. Si responden preguntas
distintas, no se las obliga a competir en una sola escala.

Para el piloto, cada documento compartido usa una clasificación mínima de
procedencia (`clinical-evidence`, `institutional-education` o
`tradition-context`), tipo documental, fuente, fecha, estado de revisión y
limitaciones. La relevancia calculada por QMD no es un nivel de evidencia.

**Consecuencias.**
- `tradition` deja de ser un valor de la misma escala que GRADE.
- El system prompt debe seleccionar la figura según la intención, conservar el
  contexto y mostrar discrepancias sin fabricar consenso ni antagonismo.
- El router debe distinguir, al menos, preguntas clínicas, tradicionales y
  comparativas.
- Los límites clínicos y de seguridad aparecen cuando son pertinentes; no se
  usan como cierre ritual de cada explicación tradicional.
- Las citas visibles deben corresponder a fuentes realmente utilizadas.
- La interfaz administrativa `/admin/corpus`, restringida por `ADMIN_EMAILS`,
  crea borradores fuera del índice y permite revisar, aprobar, publicar, probar
  y retirar.
- Una URL registra procedencia; el chat no navega páginas web en vivo.
- Ningún conector o comprobación periódica publica contenido sin aprobación
  humana.
- No se exige para el piloto clasificación multidimensional, un panel
  editorial completo ni índices externos separados.
- Esas medidas pueden introducirse después si el volumen, varios curadores o
  riesgos observados de mezcla justifican su coste.

---

## ADR-012 · Registro cerrado mediante invitaciones nominativas
**Estado:** aceptada · 2026-06-07

**Contexto.** El piloto se limita inicialmente a tres personas. Ocultar o no
publicar `/register` no impide que alguien use el formulario o llame
directamente al endpoint de alta de BetterAuth.

**Decisión.** Cada alta requiere un código administrativo:

- ligado a un email normalizado;
- generado con 192 bits aleatorios;
- almacenado únicamente como hash SHA-256;
- con caducidad de 1 a 90 días;
- revocable y válido para una sola cuenta;
- reservado durante el registro para impedir consumo concurrente.

La invitación se consume antes de crear la cuenta. Si BetterAuth rechaza el
alta, el mismo proceso puede reabrirla; si el proceso se interrumpe, queda
cerrada antes que permitir una cuenta no autorizada.

El endpoint `/api/auth/sign-up/email` exige además una cabecera interna firmada
con `BETTER_AUTH_SECRET`. Solo la Server Action que validó la invitación añade
esa autorización, por lo que llamar directamente a BetterAuth no evita el
control.

**Operación.** `npm run invite -w @vitamap/web -- create <email>` en local, o
el servicio Docker de perfil `tools` en el VPS. El código se muestra una sola
vez y se comparte por un canal privado, nunca dentro de una URL.

**Consecuencias.**
- La tabla `registration_invitation` comparte `auth.sqlite`.
- Crear una invitación no crea todavía una cuenta ni concede acceso.
- El alta continúa necesitando consentimiento y, después, pago confirmado.
- Las pruebas cubren código incorrecto, email distinto, caducidad, revocación,
  concurrencia, reintento, uso único y bypass directo de BetterAuth.

---

## ADR-011 · Cuota compartida de infraestructura con acceso por suscripción
**Estado:** aceptada · 2026-06-07

**Contexto.** VitaMap necesita un VPS europeo para mantener los datos y el
modelo de IA dentro de la infraestructura controlada. En el piloto inicial,
el VPS de 4 vCPU, 8 GB de RAM y 160 GB de disco cuesta 16,65 €/mes, antes de
comisiones de pago y otros costes operativos menores. El proyecto comienza
con tres usuarios reales y no busca obtener margen vendiendo diagnósticos o
consejo médico.

**Decisión.** El acceso al piloto es por invitación y requiere una
suscripción activa de **6 €/mes por usuario**:

```text
3 usuarios x 6 €/mes = 18 €/mes
```

La cuota financia la infraestructura compartida que hace posible VitaMap.
Stripe procesa la suscripción y transfiere los fondos a la cuenta operativa
del proyecto. VitaMap sigue siendo una herramienta educativa: el pago no
compra un diagnóstico, tratamiento, consulta médica ni una respuesta clínica
determinada.

**Evolución de la cuota.** A medida que aumente el número de usuarios activos
de pago, la cuota podrá reducirse por etapas. El cambio no será automático:
antes se revisarán el coste real del VPS, las comisiones, los backups, el uso
de CPU y RAM y la necesidad de ampliar infraestructura. Cada cambio de precio
se comunicará con antelación y se aplicará de forma transparente.

**Umbral de revisión.** El VPS actual se considera adecuado para un piloto de
hasta aproximadamente 12 usuarios con uso moderado y poca concurrencia. Al
acercarse a ese número se revisarán las métricas reales. Llegar a 12 usuarios
no obliga por sí solo a cambiar de servidor ni garantiza una bajada de cuota:
la decisión depende de capacidad, latencia y coste de la siguiente categoría.

**Consecuencias.**
- Registro permitido solo mediante invitación válida.
- Tras registrarse, el usuario debe completar Checkout y esperar la
  confirmación del webhook de Stripe.
- Sin suscripción activa no se habilitan chat, memoria, subida de documentos
  ni assessments; billing, ajustes, exportación y borrado de cuenta siguen
  disponibles.
- Stripe es la fuente de verdad del estado de pago. La URL de retorno de
  Checkout no activa por sí sola el acceso.
- La página de suscripción debe explicar precio, periodicidad, renovación,
  cancelación y finalidad de la cuota.

---

## ADR-001 · QMD como motor RAG central
**Estado:** aceptada · 2026-06-01

**Contexto.** Necesitamos un motor RAG local con BM25 + vector + reranker
sobre markdown, capaz de aislar memorias por usuario y de actualizarse en
caliente.

**Decisión.** Usar `@tobilu/qmd` como librería embebida en `apps/web`.
Un store por usuario en `data/users/<id>/index.sqlite` + un store
compartido en `data/kb-index.sqlite`.

**Alternativas descartadas.** Postgres + pgvector (más infra para 3
usuarios), Qdrant (otro servicio), MongoDB Atlas (cloud + GDPR), Mongo
Community (sin índice vectorial nativo), LanceDB (sin BM25+rerank
integrado).

**Consecuencias.** Aislamiento GDPR trivial vía filesystem. Schema de
chunks lo decide QMD (900 tokens, 15% overlap). Si más adelante hace
falta análisis estructurado longitudinal, se añadirá Postgres como
capa derivada, manteniendo QMD para RAG.

La evolución operativa, los riesgos conocidos y las puertas para el piloto
se mantienen en `docs/es/arquitectura/QMD-EVOLUCION-VITAMAP.md`.

---

## ADR-002 · Embedding multilingüe Qwen3-Embedding-0.6B desde Fase 0
**Estado:** aceptada · 2026-06-01

**Contexto.** Voluntarios escribirán en español (principal) e inglés.
El default de QMD (embeddinggemma-300M) está optimizado para inglés.

**Decisión.** Fijar `QMD_EMBED_MODEL=hf:Qwen/Qwen3-Embedding-0.6B-GGUF/...`
desde el primer `qmd embed`.

**Consecuencias.** Reindexar tras cambiar de modelo cuesta horas en una
KB grande; fijarlo ahora evita esa migración futura.

---

## ADR-003 · Memoria del usuario como markdown con frontmatter YAML
**Estado:** aceptada · 2026-06-01

**Contexto.** Necesitamos un formato que sea portable, inspeccionable
por el usuario, exportable, GDPR-friendly y eficaz para alimentar al
LLM.

**Decisión.** Cada observación es un `.md` con frontmatter YAML
(`type`, `observed_at`, `tags`, valores numéricos cuando aplique) y
cuerpo libre.

**Consecuencias.** Right-to-erasure = `rm -rf data/users/<id>`.
Export = `zip -r memoria.zip data/users/<id>/memory`.

---

## ADR-004 · LLM principal con protocolo OpenAI-compatible
**Estado:** aceptada · 2026-06-01

**Contexto.** Queremos poder cambiar de modelo y de runtime
(llama.cpp / Ollama / vLLM) sin tocar código de aplicación.

**Decisión.** El cliente en `lib/llm.ts` habla `POST /v1/chat/completions`
contra `LLM_BASE_URL`. Compatible con cualquier servidor que exponga
ese contrato.

**Consecuencias.** Cambiar de Qwen3-4B a Qwen3-14B o a otro modelo es
modificar `.env`.

---

## ADR-005 · Sin Postgres en Fase 0/1
**Estado:** aceptada · 2026-06-01

**Contexto.** Para 3 usuarios sin análisis estructurado complejo,
Postgres añade superficie de operación sin valor proporcional.

**Decisión.** SQLite vía BetterAuth para auth + audit; QMD/SQLite para
RAG. Sin Postgres hasta que aparezca una necesidad concreta de análisis
estructurado longitudinal (Fase 2 opcional, Fase 3 probable).

**Consecuencias.** Backup = un par de ficheros. Migración a Postgres
cuando ocurra implica una capa derivada, no una reescritura.

---

## ADR-006 · Guardrail anti-diagnóstico como segunda pasada del LLM
**Estado:** aceptada · 2026-06-01

**Contexto.** El system prompt socrático puede ser ignorado o
malinterpretado por el modelo. Necesitamos una capa de seguridad
independiente del comportamiento del modelo principal.

**Decisión.** Cada respuesta del modelo pasa por una segunda llamada
(mismo modelo, prompt minimalista) que clasifica si contiene lenguaje
diagnóstico o prescriptivo. Si sí: reescritura socrática o bloqueo.

**Consecuencias.** Doble latencia para respuestas no triviales.
Mitigable con clasificación selectiva (solo cuando aparecen palabras
clave de riesgo).

---

## ADR-010 · Chat sin streaming en Fase 1 por integridad del guardrail
**Estado:** aceptada · 2026-06-01

**Contexto.** El asistente de IA tiene un guardrail (`lib/guardrail.ts`)
que clasifica la respuesta del LLM y la reescribe o bloquea si detecta
lenguaje diagnóstico o prescriptivo. Este guardrail necesita la
respuesta COMPLETA del modelo principal para clasificarla; no puede
funcionar token a token sobre un stream.

**Decisión.** En `/api/chat` no se hace streaming. El cliente espera la
respuesta completa, ya filtrada por el guardrail. Latencia típica
20-50s en CCX13 (15-25s del LLM principal + 3-5s del clasificador +
opcionalmente 15-25s más si hay reescritura). UI muestra estado
"Pensando…" con animación durante la espera.

**Alternativa explorada.** Streaming del draft al cliente para feedback
temprano, y al final una operación de "reemplazo del mensaje" si el
guardrail decide reescribir o bloquear. Rechazada por dos razones:
(1) ya mostrar texto que luego desaparece o cambia es UX-hostil y
debilita la confianza del usuario en la herramienta, (2) si por un fallo
en la lógica de reemplazo el cliente queda con la versión "draft"
visible, hemos roto el contrato del guardrail.

**Disparador para revisar.** Cuando estemos en Fase 3 con GPU y la
latencia base baje a 2-4s, el guardrail puede correr en paralelo con
el reranker y el coste UX de la espera no compensa el riesgo del
streaming. Esa revisión irá con un ADR-XXX nuevo.

**Consecuencias.** UI de chat con animación de "pensando" obligatoria.
Historial de chat NO se persiste en servidor en Fase 1 (vive solo en
React state del cliente, se pierde al refrescar). Persistencia con
cifrado por usuario llega en Fase 2 cuando montemos análisis longitudinal.

---

## ADR-009 · BetterAuth sobre SQLite; MFA antes del piloto real
**Estado:** actualizada · 2026-06-08

**Contexto.** Login obligatorio por requisito GDPR (aislamiento por
usuario, audit log significativo, trazabilidad del consentimiento Art.
9.2.a). Necesitamos un sistema self-hosted que comparta DB con
`audit_event` para no añadir infra.

**Decisión.** `better-auth` con backend `better-sqlite3` sobre
`data/auth.sqlite` (la misma BD que aloja `audit_event`). Email +
contraseña, sesión por cookie httpOnly de 14 días con refresh
diario, auto-signin tras registro. Mínimo de 10 caracteres en
contraseña. Durante el desarrollo privado, el alta sigue siendo
invite-only y puede probarse sin verificación de email.

Antes de admitir datos de salud de terceros, la decisión cambia: se debe
incorporar MFA (TOTP o passkey) con códigos de recuperación, revocación y
procedimiento de pérdida de dispositivo probados. La cuenta operadora y las
cuentas del piloto deben completar ese segundo factor. También debe existir
verificación de correo y recuperación segura que no revele si una cuenta
existe. La relación de confianza y el reducido número de usuarios no sustituyen
estas medidas.

**Alternativas descartadas.**
- *Lucia Auth*: el mantenedor lo marcó como legacy en 2024 a favor de
  recetas con Oslo. Construir auth a mano sobre Oslo es más código del
  que necesitamos para un piloto.
- *Magic links sin contraseña*: requiere SMTP en el VPS (otro
  contenedor + DKIM/SPF + reputación). Sobredimensionado para 3 usuarios.
- *Passkey / WebAuthn como único método*: máxima seguridad pero recuperación
  compleja si el voluntario pierde el dispositivo. Sigue siendo candidato como
  segundo factor si se acompaña de recuperación probada.
- *Servicios gestionados (Clerk, Auth0, Supabase Auth)*: implementación
  más rápida pero envía identidades de pacientes a un tercero, añade
  DPAs y complica el encuadre "nada sale del VPS".

**Flujo de consentimiento.** El registro NO se completa hasta marcar
dos checkboxes obligatorios (reconocimiento educacional + consentimiento
Art. 9.2.a). El audit log captura `auth.register` +
`auth.consent.granted` con la versión del documento (`CONSENT_VERSION`
en `lib/consent.ts`). Los cambios incrementan la versión. El registro ya
guarda qué versión aceptó cada usuario; el bloqueo de acceso hasta aceptar
una versión posterior sigue siendo P0 antes del piloto real.

**Borrado de cuenta.** Type-to-confirm `"BORRAR"` + contraseña. Orden:
audit log (`consent.revoked` + `user.purge:start`) → `rm -rf
data/users/<id>/` → eliminación BetterAuth → `user.purge:complete`.
El audit log sobrevive al borrado con identificador pseudonimizado para
acreditar el cumplimiento del derecho al olvido.

**Consecuencias.** Login obligatorio en `/(app)/*` vía middleware
ligero (chequeo de cookie) + `requireUserId()` en cada server
component/action/route handler. La cookie de sesión es la única forma
de identificar al usuario; no hay query strings `?userId=`.

---

## ADR-008 · OCR con tesseract+poppler en el contenedor `web`; docTR como upgrade Fase 2+
**Estado:** aceptada · 2026-06-01

**Contexto.** Necesitamos OCR sobre PDFs y fotos de analíticas para Fase 1
(3 voluntarios, VPS CCX13 con 8 GB de RAM). El usuario expresó preferencia
por docTR (Python, mejor calidad sobre layouts médicos).

**Decisión.** Para Fase 1 usamos **tesseract 5 + poppler-utils** invocados
por `execFile` desde el contenedor `web`. `lib/ocr.ts` define una
abstracción `ocrPdf` / `ocrImage` con resultado canónico, de modo que
sustituir el backend por un sidecar docTR HTTP en Fase 2+ no toca código
de aplicación: solo se cambia el contenido de `lib/ocr.ts`.

**Razones para no añadir docTR ahora.**
- Un sidecar Python con docTR consume ~1-2 GB de RAM residente y suma
  ~700 MB a la imagen. En CCX13 (8 GB) compromete los márgenes del LLM.
- Añade un quinto contenedor a un stack que mantenemos deliberadamente
  pequeño en Fase 1.
- tesseract 5 con `spa+eng` da resultados aceptables sobre analíticas
  con texto claro, que es el caso predominante.

**Estrategia para PDFs:** intentar primero extracción nativa con
`pdfjs-dist` (instantánea, sin OCR) y solo degradar a OCR si el texto
extraído es insuficiente. Esto cubre la mayoría de analíticas modernas
emitidas digitalmente sin coste de CPU.

**Disparador para migrar a docTR (Fase 2):**
- Volumen de voluntarios >10 con analíticas escaneadas de baja calidad.
- Tasa de error de extracción persistentemente >20% en analíticas reales.
- VPS con suficiente RAM ociosa (CCX53 o superior).

**Consecuencias.** Calidad OCR menor en escaneos pobres. Mitigable con
mayor DPI en `pdftoppm` (ya 300) y con la pasada de extracción del LLM
que tolera ruido. La revisión humana en `/inbox/<id>` es la red de
seguridad final.

---

## ADR-007 · Audit log append-only con hash chain
**Estado:** aceptada · 2026-06-01

**Contexto.** Defensa ante auditorías y reclamaciones GDPR.

**Decisión.** Tabla `audit_event` en `data/auth.sqlite` donde cada
entrada incluye `prev_hash` y `event_hash = sha256(prev || campos)`.
Verificación de la cadena vía cron diario.

**Consecuencias.** Manipulación retroactiva detectable. Coste
despreciable en escritura.
