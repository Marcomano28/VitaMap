# Estudio · Preparación epistémica del usuario

Cómo comunicar la incertidumbre científica sin producir desconfianza:
qué mensaje, en qué etapa, para qué perfil psicológico.

Versión 0.1 · 2026-06-13
Estado: estudio técnico de UX / diseño conductual

## 0. Qué resuelve este estudio (y qué no es)

VitaMap responde con honestidad: distingue lo firme de lo discutido, atribuye las
fuentes, expresa límites (ADR-013, doc de recuperación §7.4). El problema es que
esa honestidad, mal entregada, el usuario medio la lee como **evasión,
inseguridad o falta de autoridad** — un "páramo de incertidumbre" que erosiona la
confianza justo cuando intenta ser fiable.

Este documento **no** es copy literario ni un manifiesto. Es el diseño de *cómo*
se prepara el marco interpretativo del usuario para que reciba la incertidumbre
como señal de rigor y no como defecto: taxonomía de mensajes, disparadores,
secuencia por etapa del producto, implementación sobre la arquitectura actual y
métricas de validación.

El objetivo medible no es "que confíe", sino **confianza calibrada**: que sepa
distinguir cuándo apoyarse con fuerza y cuándo con cautela, sin caer ni en fe
ciega ni en cinismo.

## 1. Modos de fallo que prevenimos

| Fallo | Mecanismo psicológico | Síntoma observable |
|---|---|---|
| "Hedging = evasión" | El usuario espera veredicto; la cautela se lee como esquivar | Abandona, repregunta irritado, busca respuesta tajante fuera |
| Amplificación de ansiedad | Incertidumbre sobre la salud → amenaza | Bucle de repreguntas ansiosas, o abandono por angustia |
| Vacío de autoridad | Sesgo de autoridad: quiere que "alguien le diga" | Frustración, percepción de herramienta inútil |
| Sobre-advertencia (backfire) | Carga cognitiva excesiva al inicio | Bounce en onboarding, no lee, no vuelve |
| Cinismo inducido | "Si ni la ciencia sabe, nada vale" | Descarta también lo firme; deriva a pseudociencia |

Las dos puntas son el riesgo real: **decir poco** produce desconfianza; **decir
demasiado, demasiado pronto** produce abandono. El diseño navega entre ambas.

## 2. Modelo del usuario (rasgos a tener en cuenta)

Usuario medio interesado: adulto curioso por su salud, no especialista, que paga
6 €/mes (ADR-011) y quiere "tomar las riendas". Rasgos relevantes para el diseño:

- **Baja tolerancia a la ambigüedad en contexto de salud** (la ansiedad de salud
  es frecuente y sesga la lectura hacia la amenaza).
- **Sesgo de autoridad / deseo de respuesta definitiva.**
- **Atención y memoria de trabajo limitadas**: no leerá textos largos (causa de
  que el formato "pergamino" fracase).
- **Calibración inicial dispar**: unos sobre-confían en "la ciencia dice"; otros
  llegan ya cebados por desinformación o desconfianza.
- **Alta necesidad de agencia/control** (es el motor de VitaWende: úsese a favor).

### 2.1 Cuatro perfiles y qué encuadre les llega

No todos reaccionan igual; el mensaje debe poder modularse.

| Perfil | Riesgo dominante | Encuadre que funciona |
|---|---|---|
| **Buscador ansioso** | Angustia ante la duda | Normalizar + contener: "una pregunta, no una sentencia"; señal de que hay un humano (médico) al final |
| **Escéptico empoderado** | Cinismo | Mostrar el mecanismo: por qué la revisión es fortaleza, no fallo |
| **Optimizador pragmático** | Impaciencia con la cautela | Dar lo accionable primero, la incertidumbre como matiz acotado |
| **Inclinado a lo alternativo** | Rechazo de la evidencia | Figura/fondo (ADR-013): respeto a la tradición sin equivaler verdades; no convertir la ciencia en adversario |

No hace falta clasificar explícitamente al usuario en Fase 1; basta con que el
encuadre por defecto sirva al ansioso y al pragmático (mayoría) y que el lenguaje
nunca empuje al escéptico ni al alternativo hacia el cinismo.

## 3. Principios de diseño (de la evidencia conductual)

1. **Divulgación progresiva / just-in-time.** Enseñar el concepto **en el momento
   en que aparece**, no como lección previa. La incertidumbre se explica la
   primera vez que se topa con ella, no en el umbral.
2. **Mostrar, no sermonear.** El asistente *modela* la confianza calibrada con
   marcadores consistentes en cada respuesta; el usuario aprende el código por
   exposición, no por discurso.
3. **Expectativa antes de la fricción.** Una sola frase de encuadre en onboarding
   ("esta herramienta te dice *cuán segura* es cada cosa"), no un tratado.
4. **Consistencia de señal.** Un vocabulario y una marca visual estables (la
   distinción "firme / en estudio") para que se aprendan implícitamente.
5. **Etiquetado del afecto + normalización** para desactivar la amenaza ("que un
   dato cambie es la ciencia funcionando", dicho cuando ocurre).
6. **Coste cognitivo mínimo.** Una línea, descartable, expandible si se quiere.

## 4. Taxonomía de mensajes (el "qué", por función)

No son frases sueltas: son **clases de intervención**, cada una con disparador,
ubicación y función.

| Clase | Función | Dónde aparece | Disparador |
|---|---|---|---|
| **A · Primer encuadre** | Fijar expectativa: "aquí verás cuán seguro es cada dato" | Onboarding, 1 frase + 1 explicador opcional 20 s | Una vez, al registro |
| **B · Marcador de confianza** | Señal continua firme/en-estudio + tipo de fuente | En cada respuesta, junto a la cita | Siempre (derivado de metadatos) |
| **C · Microexplicación contextual** | Explicar la cautela la 1ª vez que aparece | Bajo una respuesta cauta/contestada | 1ª vez que una respuesta es de baja certeza |
| **D · Normalización de revisión** | Reencuadrar el cambio/conflicto como honestidad | Cuando un dato o guía cambia, o las fuentes discrepan | 1ª vez que hay revisión/conflicto |
| **E · Refuerzo espaciado** | Afinar la actitud sin saturar | Cierre ocasional de consulta | Event-driven, con tope estricto |

**Corrección clave respecto a la idea previa de "una frase por consulta":** la
entrega NO debe ser un goteo mecánico por sesión. Debe ser **contextual /
event-driven** — el mensaje cae cuando el usuario se encuentra con el fenómeno que
explica. Una microexplicación sobre la revisión científica entregada antes de que
el usuario vea jamás una respuesta cauta es ruido; entregada en el momento exacto
en que se topa con ella, es comprensión.

## 5. Secuencia por etapa (el "cuándo")

| Etapa | Estado del usuario | Intervención | Forma concreta |
|---|---|---|---|
| **0 · Umbral (onboarding)** | No sabe qué esperar | A | 1 frase en el alta + explicador opcional ("¿cómo lee VitaMap la ciencia?", 20 s, saltable) |
| **1 · Primeras respuestas** | Explora | B | Marcadores de confianza visibles; sin teoría todavía |
| **2 · 1er encuentro con baja certeza** | "¿por qué no me responde claro?" | C | Línea bajo la respuesta: por qué hay cautela, expandible |
| **3 · 1er conflicto/revisión** | "¿no que era así?" | D | Línea que normaliza la corrección |
| **4 · Uso sostenido** | Ya conoce el código | E | Refuerzo escaso, con tope (p. ej. máx. 1 por semana) |

El "pergamino inicial" se reduce, por tanto, a la **intervención A**: una frase y
un explicador opcional. El resto del peso conceptual se reparte en B–E,
distribuido en el tiempo y anclado a eventos reales.

## 6. Implementación sobre la arquitectura actual

- **B (marcadores de confianza) es determinista, no "vibes" del LLM.** Se deriva
  de `source_kind` / `source_type` y `limitations`, que ya llegan al prompt y al
  resultado (doc de recuperación §7.4, ADR-013). Mapear: `clinical-evidence` con
  consenso → "firme"; `clinical-evidence` emergente o fuentes discrepantes → "en
  estudio"; `tradition-context` → etiqueta de tradición, no de evidencia. El
  marcador lo pone el servidor a partir de metadatos, igual que las citas.
- **C y D se disparan reutilizando el guardrail (ADR-006).** La 2ª pasada ya
  clasifica la respuesta; se le añade detectar "¿expresó incertidumbre / fuentes
  en conflicto?" y emitir una bandera que el cliente convierte en la
  microexplicación. Sin coste de inferencia adicional relevante.
- **Estado de educación persistente por usuario (detalle no trivial).** Las
  intervenciones C/D/E deben dispararse **una vez**. Pero el historial de chat no
  se persiste en servidor en Fase 1 (ADR-010). Se necesita un pequeño estado
  ("primer-encuadre-visto", "microexplicacion-vista", "revision-vista", contador
  de refuerzo) en el directorio del usuario (`data/users/<id>/`, como un `.json` o
  frontmatter), no en el estado efímero del cliente. Es lo único nuevo de
  almacenamiento que requiere este sistema.
- **Modulación por modo de recuperación.** La Lectura clínica, la Comparación y la
  Perspectiva tradicional (doc §10, E1) piden tonos distintos: en Comparación, D
  es casi nativa ("estas fuentes no responden lo mismo"); en Perspectiva
  tradicional, B etiqueta tradición sin refutación clínica ritual.
- **Vínculo con grounding (E4).** Cuando exista cita por afirmación, el marcador B
  se ancla a cada afirmación, no a la respuesta entera: máxima precisión de la
  señal firme/en-estudio.

## 7. Restricciones de redacción de los mensajes (como contrato de diseño)

- Máx. ~1 frase (≈20 palabras) por intervención en contexto; el explicador A puede
  ser algo más largo pero saltable.
- Nivel de lectura llano, sin jerga ("en estudio", no "evidencia GRADE baja").
- **Debe bajar la ansiedad, no subirla.** Test interno: si una variante deja al
  usuario más temeroso, se descarta.
- Sin veredicto clínico, sin consejo, sin objetivos individuales (coherente con la
  herramienta).
- Cada clase (A–E) admite 2–3 variantes para A/B testing.
- La metáfora del viaje (firme/arena, horizonte, guía) puede teñir el *tono* de la
  microcopia, pero nunca a costa de la claridad ni de la brevedad.

## 8. Validación y métricas

A escala piloto (3 usuarios, ADR-011) la validación es cualitativa, pero el diseño
se instrumenta para escalar.

- **Comportamentales (proxy de confianza):** tasa de abandono *tras* una respuesta
  cauta vs. una firme; nº de repreguntas (engagement sano) vs. salida; uso del
  "expandir" en C.
- **Comprensión:** micro-chequeo opcional o entrevista ("cuando viste que el dato
  podía cambiar, ¿cómo lo interpretaste?").
- **Reutilizar la suite de regresión** (30–50 Q/A, ADR-014): etiquetar qué
  respuestas son "cautas/contestadas" y observar la reacción ante ellas.
- **A/B del encuadre A** y de las variantes de C/D.
- **Monitor de riesgo:** bounce en onboarding (sobre-advertencia), reportes de
  angustia (amplificación de ansiedad).

Criterio de éxito calibrado: ante una respuesta "en estudio", el usuario **no
abandona** y la trata como invitación a repreguntar o a consultar a su médico — no
como fallo de la herramienta ni como permiso para descartarlo todo.

## 9. Riesgos y antídotos

| Riesgo | Antídoto |
|---|---|
| Sobre-educar → bounce | Event-driven, no goteo; topes; todo saltable |
| Sub-educar → "herramienta evasiva" | Marcador B siempre presente; C al primer contacto |
| Señal inconsistente | Vocabulario y marca visual fijos y derivados de metadatos |
| Amplificar ansiedad (perfil ansioso) | Normalización + puntero al humano; lenguaje de contención |
| Tono paternalista | Una frase, de compañía; nunca lección |
| Inducir cinismo (perfil escéptico) | Separar siempre lo firme de lo en-estudio: no todo es arena |

## 10. Recomendación · MVP para el piloto

Construir solo esto primero, medir, y luego decidir el resto:

1. **A** — una frase de encuadre en el alta + explicador opcional de 20 s.
2. **B** — marcador firme / en-estudio / tradición en cada respuesta, derivado de
   los metadatos que ya existen.
3. **C** — una microexplicación, disparada la primera vez que una respuesta es de
   baja certeza.
4. **D** — una normalización, disparada el primer conflicto/revisión.
5. El **estado de educación por usuario** (§6) para que C y D ocurran una sola vez.

Diferir E (refuerzo) y la modulación por perfil hasta tener señal de que A–D
funcionan. Mismo criterio que el resto del proyecto: materializar por necesidad
medida, no por anticipación.

---

### Nota sobre el material previo

El formato literario largo queda retirado como entregable. Sus intuiciones útiles
-- microfrases, metáfora ligera y cierre de sesión -- se integran en
[EL-ATRIO-DE-LA-BRUJULA.md](EL-ATRIO-DE-LA-BRUJULA.md) como claves de orientación.
No debe presentarse al usuario un texto ceremonial inicial para leer.
