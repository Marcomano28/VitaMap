# Borrador — transferencia de inferencia a Mistral (consentimiento, privacidad, ADR-014)

Creado 2026-07-02 · **borrador para revisión jurídica profesional** (no es dictamen legal).
Deriva de la auditoría de `apps/web/app/api/chat/route.ts` y del modo external
verificado en el VPS (`LLM_BASE_URL=https://api.mistral.ai/v1`,
`LLM_MODEL=mistral-small-latest`).

Propósito: dar el texto de arranque para (A) precisar ADR-014 con el alcance real
de la transferencia, (B) el consentimiento explícito Art. 9.2.a que nombra a
Mistral, (C) el párrafo de privacidad, y (D) la línea del Registro Art. 30. Todo
debe revisarlo el abogado de protección de datos antes de publicarse.

---

## A. Addendum a ADR-014 (alcance real de la transferencia)

> Para pegar como sección nueva dentro de ADR-014 en `docs/DECISIONS.md`.

**Addendum 2026-07-02 · Qué datos se transfieren realmente.** La auditoría del
flujo de chat (`api/chat/route.ts`) precisa la frase "solo viajan los prompts en
tránsito": un turno de chat dispara **hasta cinco llamadas** al proveedor externo,
y varias incluyen datos de categoría especial (Art. 9):

1. **Reescritura de consulta** (`query-rewrite.ts`) — pregunta del usuario + hasta
   20 mensajes de historial.
2. **Clasificador de crisis** (`crisis.ts`) — pregunta + historial.
3. **Generación principal** (`route.ts`) — bloque de contexto que incluye
   **fragmentos recuperados de la memoria personal del usuario** (hasta 3 chunks,
   `minScore` 0.35) + evidencia del corpus + la pregunta + historial.
4. **Guardrail (revisión)** (`guardrail.ts`) — borrador + bloque de contexto
   (incluye memoria personal).
5. **Guardrail (reescritura socrática)** — ídem, cuando aplica.

Es decir, la memoria personal de salud del usuario y sus preguntas se transfieren
a Mistral en casi cada interacción. La frase de ADR-014 debe leerse en ese
sentido, y el consentimiento y la privacidad deben describirlo así (secciones B/C).

**Higiene confirmada.** `RETRIEVAL_DEBUG=false` en producción: las consultas y
títulos de chunks **no** se escriben en los logs de docker. El audit log guarda
solo contadores (`personal=N evidence=M verdict=…`), sin contenido.

**Condiciones aún abiertas (bloquean datos reales, no la fase sintética).**
(a) DPA/Art. 28 con Mistral firmado; (b) Zero Data Retention / opt-out de
entrenamiento confirmado por escrito en la cuenta; (c) esta descripción reflejada
en consentimiento, privacidad, Registro Art. 30 y DSFA.

---

## B. Consentimiento explícito (Art. 9.2.a DSGVO) — cláusula de transferencia

Granular, separable del resto del consentimiento y **revocable**. Versión alemana
(piloto en Alemania) y española.

### DE (principal)

> **Verarbeitung durch einen externen KI-Anbieter während der Pilotphase.**
> Während der geschlossenen Pilotphase wird die Antwortgenerierung des Assistenten
> von einem Auftragsverarbeiter mit Sitz in der EU durchgeführt: **Mistral AI SAS,
> Paris, Frankreich** (Modell „mistral-small-latest", API „La Plateforme").
>
> Dabei werden pro Anfrage an Mistral übermittelt: deine Frage, bis zu 20
> vorangegangene Nachrichten des Gesprächs sowie **relevante Auszüge aus deiner
> persönlichen Gesundheits-Memory** und aus der Wissensdatenbank, die zur
> Beantwortung herangezogen werden. Es handelt sich um **Gesundheitsdaten
> (Art. 9 DSGVO)**. Pro Antwort können mehrere solcher Übermittlungen erfolgen
> (Umformulierung der Anfrage, Krisenprüfung, Generierung, Sicherheitsprüfung).
>
> Mistral verarbeitet diese Daten ausschließlich zur Erbringung dieser Funktion,
> auf Grundlage eines Auftragsverarbeitungsvertrags (Art. 28 DSGVO), **ohne
> Nutzung zu Trainingszwecken** und mit **Zero Data Retention**, soweit vertraglich
> vereinbart. Die Verarbeitung erfolgt in der EU.
>
> Diese externe Verarbeitung ist **auf die Pilotphase befristet**; in der
> Produktionsversion erfolgt die Inferenz vollständig lokal auf dem Server.
>
> ☐ Ich willige ausdrücklich ein, dass meine Gesundheitsdaten für die Dauer der
> Pilotphase zu diesem Zweck an Mistral AI (EU) übermittelt und dort verarbeitet
> werden. Ich kann diese Einwilligung jederzeit mit Wirkung für die Zukunft
> widerrufen; danach steht die Chat-Funktion nicht mehr zur Verfügung.

### ES

> **Procesamiento por un proveedor de IA externo durante el piloto.**
> Durante la fase piloto cerrada, la generación de respuestas del asistente la
> realiza un encargado del tratamiento con sede en la UE: **Mistral AI SAS, París,
> Francia** (modelo «mistral-small-latest», API «La Plateforme»).
>
> En cada consulta se transmiten a Mistral: tu pregunta, hasta 20 mensajes previos
> de la conversación y **fragmentos relevantes de tu memoria personal de salud** y
> de la base de conocimiento utilizados para responder. Son **datos de salud
> (Art. 9 RGPD)**. Por cada respuesta puede haber varias de estas transmisiones
> (reescritura de la consulta, comprobación de crisis, generación, revisión de
> seguridad).
>
> Mistral trata estos datos únicamente para prestar esta función, sobre la base de
> un contrato de encargo (Art. 28 RGPD), **sin usarlos para entrenamiento** y con
> **retención cero de datos**, según lo pactado contractualmente. El tratamiento
> se realiza en la UE.
>
> Este procesamiento externo está **limitado a la fase piloto**; en la versión de
> producción la inferencia será totalmente local en el servidor.
>
> ☐ Doy mi consentimiento explícito a que mis datos de salud se transmitan a
> Mistral AI (UE) y se procesen allí con esta finalidad durante el piloto. Puedo
> revocar este consentimiento en cualquier momento con efecto futuro; tras ello la
> función de chat dejará de estar disponible.

---

## C. Párrafo para la política de privacidad (sección "destinatarios / encargados")

> **Proveedor de inferencia de IA — Mistral AI SAS (Francia, UE).** Durante la fase
> piloto, el texto de tus consultas al asistente, el historial reciente de la
> conversación y los fragmentos de tu memoria personal de salud y de la base de
> conocimiento que se utilizan para responder se transmiten al modelo de lenguaje
> de Mistral AI («mistral-small-latest») a través de su API alojada en la UE, con
> la única finalidad de generar la respuesta del asistente. La base jurídica es tu
> consentimiento explícito (Art. 6.1.a y Art. 9.2.a RGPD). Mistral actúa como
> encargado del tratamiento (Art. 28 RGPD), no utiliza estos datos para entrenar
> sus modelos y aplica retención cero según lo pactado. Esta transferencia está
> limitada al piloto; en producción la inferencia se realizará localmente y este
> destinatario dejará de recibir datos.

(Ajustar cuando se firme el DPA: enlazar la versión del contrato y la fecha, y
retirar "según lo pactado" si el ZDR queda confirmado de forma incondicional.)

---

## D. Línea para el Registro de actividades (Art. 30)

| Campo | Valor |
|---|---|
| Actividad | Generación de respuestas del asistente (chat) |
| Categoría de datos | Datos de salud (Art. 9): preguntas, historial, memoria personal |
| Encargado / destinatario | Mistral AI SAS, París, Francia (UE) |
| Finalidad de la cesión | Inferencia del modelo de lenguaje para responder |
| Base jurídica | Art. 6.1.a + Art. 9.2.a (consentimiento explícito) |
| Garantías | Contrato Art. 28; sin entrenamiento; Zero Data Retention; UE |
| Transferencia fuera de UE | No (procesamiento en la UE) |
| Plazo / carácter | Temporal — solo durante la fase piloto (ver ADR-014) |

---

## Antes de datos reales — lista mínima ligada a esto

- [ ] Firmar DPA / Art. 28 con Mistral y archivar versión + fecha.
- [ ] Confirmar por escrito en la cuenta de Mistral: opt-out de entrenamiento y
  Zero Data Retention (captura o cláusula del plan).
- [ ] Pegar el addendum (A) en ADR-014.
- [ ] Integrar la cláusula (B) en el flujo de consentimiento del onboarding,
  como casilla **separada** y revocable.
- [ ] Publicar el párrafo (C) en la política de privacidad.
- [ ] Añadir la línea (D) al Registro Art. 30 y reflejar el tratamiento en la DSFA.
- [ ] Revisión del abogado de protección de datos sobre todo lo anterior.
