# Estatutos del acompañante (supporter) · BORRADOR

Versión **0.1-borrador** · 2026-08-02
Estado: **NO VIGENTE** — borrador de trabajo para revisión jurídica
ADR asociado: ADR-018 · Propuesta: `PROPUESTA-USUARIOS-TERAPEUTAS-Y-ACCESO-PACIENTES.md`
Versión alemana (destinada a ser la vinculante): `de/STATUTEN-BEGLEITPERSON.md`

> **Advertencia sobre este documento.** Es un borrador redactado desde el
> diseño técnico y la `GUIA-LEGAL-PILOTO-ALEMANIA.md`, no un texto jurídico
> validado. Su función es dar a un especialista alemán algo concreto que
> corregir en vez de partir de cero. **Ningún acompañante debe aceptarlo ni
> operar bajo él hasta que esté revisado y su estado pase a "vigente".**
>
> El §0 recoge las decisiones que este borrador **no** puede tomar por su
> cuenta. Mientras sigan abiertas, el resto del texto es provisional.
>
> Idioma: el borrador se redacta en español por ser el idioma de trabajo del
> proyecto. Si el piloto opera en Alemania, la **versión vinculante debe ser la
> alemana**, producida junto con el asesor y no por traducción automática.

---

## 0. Decisiones abiertas (bloquean la versión vigente)

Estas preguntas determinan el contenido real de los estatutos. Se listan
primero, en vez de esconderlas al final, porque cambian el texto entero.

**0.1 · ¿Quién es el responsable del tratamiento de los datos de la persona
acompañada?** Es la pregunta central. Hoy, cada usuario es titular de sus
propios datos y consiente sobre sí mismo. Con los cubículos aparece alguien
cuyos datos de salud residen en la instancia **sin cuenta propia**. Las dos
lecturas posibles llevan a documentos distintos:

- *(a)* El **acompañante** es responsable y VitaMap es encargado del
  tratamiento → hace falta un contrato de encargo del Art. 28 RGPD entre el
  operador y cada acompañante, y estos estatutos son un anexo de ese contrato.
- *(b)* El **operador de VitaMap** sigue siendo responsable y el acompañante es
  una persona autorizada bajo su instrucción → estos estatutos son el
  instrumento de instrucción y autorización, y el operador responde
  directamente frente a la persona acompañada.

Este borrador está escrito en la hipótesis *(b)* por ser la más conservadora
para el operador (asume más responsabilidad, no menos). **Debe confirmarse.**

**0.2 · ¿Puede haber personas acompañadas sin cuenta propia en el piloto?** Es
la Variante A del diseño. Su ventaja es técnica; su coste es que esa persona no
puede ejercer sus derechos desde la aplicación. Mientras sea así, el §7 impone
un procedimiento manual, que debe considerarse suficiente o no.

**0.3 · ¿Entra esto siquiera en el piloto actual?** La
`GUIA-LEGAL-PILOTO-ALEMANIA.md` §3 sitúa el "acceso de médicos, terapeutas,
investigadores o familiares" en la **Etapa D**, que exige evaluación nueva de
finalidad, base legal, contratos, DSFA, seguridad y calificación MDR. El piloto
cerrado es Etapa B. Debe decidirse expresamente si se abre Etapa D o si la
figura del acompañante espera.

**0.4 · Personas vulnerables y menores.** La misma §3 los marca como disparador
de evaluación nueva. Si la figura del acompañante existe precisamente para
personas que no pueden gestionar sus datos solas, este punto no es marginal:
es probable que sea el caso central. Requiere postura explícita.

**0.5 · ¿Profesión sanitaria?** Si el acompañante es terapeuta o profesional
sanitario, le aplican deberes propios (secreto profesional, documentación
clínica) que pueden entrar en tensión con el posicionamiento educativo de
VitaMap. Debe aclararse si estos estatutos bastan o si esa figura queda fuera.

---

## 1. Qué es un acompañante y qué no

**Es.** Una persona de confianza —cuidador, familiar, ayudante técnico o
profesional del acompañamiento— aceptada expresamente por el operador para
organizar y consultar, dentro de VitaMap, información de salud de personas
concretas a las que acompaña, con permiso documentado de esas personas.

**No es.** No es un administrador de la plataforma: no accede a la
configuración, ni al corpus, ni a los datos de ningún usuario fuera de los
sujetos que tiene autorizados. No es un rol clínico: VitaMap no es historia
clínica ni instrumento de diagnóstico o tratamiento. No es una vía para ampliar
el acceso por confianza personal: cada acceso nace de una autorización
registrada y revocable.

El acompañante no obtiene su condición registrándose. **Solo puede nacer de una
invitación nominativa emitida o confirmada por el operador** (§8).

---

## 2. Cláusulas

Numeradas para poder citarlas en auditoría e incidentes. Al aceptarlas, el
acompañante se compromete a lo siguiente.

**2.1 · Finalidad.** Usar VitaMap solo como apoyo educativo, de organización de
información y de explicación acompañada. No usarlo para diagnosticar, indicar,
ajustar o suspender tratamientos, ni para sustituir la consulta profesional.

**2.2 · Límites de uso.** No usar VitaMap en urgencias ni en situaciones donde
una respuesta tardía o errónea pueda causar daño. No prometer curación,
prevención ni mejora clínica. No captar personas acompañadas de forma opaca,
engañosa o aprovechando una relación de dependencia.

**2.3 · Consentimiento previo.** No introducir datos de ninguna persona sin su
consentimiento previo, informado y documentado, recogido con la plantilla
`CONSENTIMIENTO-PERSONA-ACOMPANADA.md`. Si la persona no puede consentir por sí
misma, no proceder sin la representación legal acreditada y sin aviso al
operador (ver §0.4).

**2.4 · Minimización.** Subir únicamente lo necesario para la finalidad
acordada. Un cubículo por persona, sin mezclar información de varias. No
introducir datos de terceros que aparezcan incidentalmente en un documento
(familiares mencionados en un informe, por ejemplo) sin necesidad real.

**2.5 · Confidencialidad.** No compartir capturas, exportaciones, enlaces ni
contenidos con nadie ajeno a la relación de acompañamiento. No compartir la
cuenta, la contraseña ni el segundo factor. La cuenta es estrictamente personal.

**2.6 · Seguridad.** Activar y mantener el segundo factor (MFA) antes de
acceder a datos reales de terceros. Usar dispositivos con bloqueo de pantalla y
sin sesión compartida. Comunicar al operador, **sin demora y en un máximo de 24
horas**, cualquier pérdida de dispositivo, sospecha de acceso indebido o
compromiso de credenciales, para que el operador pueda cumplir sus plazos de
notificación de brecha.

**2.7 · Trazabilidad.** Aceptar que todo acceso a datos de otra persona queda
registrado de forma inalterable (actor, sujeto, momento y tipo de acceso), que
ese registro puede revisarse ante un incidente o una reclamación, y que puede
mostrarse a la persona acompañada si lo solicita.

**2.8 · Revocación.** Aceptar que el permiso sobre cualquier persona puede
retirarse en cualquier momento —por esa persona, por el operador o por el
propio acompañante— con efecto inmediato, sin preaviso y sin necesidad de
justificación. Tras la revocación, no intentar recuperar el acceso por ningún
medio, ni conservar copias fuera de la plataforma.

**2.9 · Invitación delegada.** Si el operador le concede la facultad de
proponer nuevos acompañantes, ejercerla como responsabilidad y no como
privilegio: solo personas que conoce, dentro de la cuota asignada, informándolas
de estos estatutos. La facultad es limitada y revocable, y proponer a alguien no
transfiere ninguna capacidad de decisión sobre la plataforma. En el piloto rige
el §8.

**2.10 · Escalado.** Derivar fuera de la herramienta toda duda legal, incidente
de seguridad, conflicto con la persona acompañada o señal de riesgo clínico o
de crisis. VitaMap no es un canal de atención ni de emergencia.

---

## 3. Aceptación y registro

La aceptación es un acto explícito y versionado, con el mismo mecanismo que el
consentimiento del usuario común (`CONSENT_VERSION` en `apps/web/lib/consent.ts`):

- se registra la **versión** de estatutos aceptada y la fecha;
- si el texto cambia de forma sustancial, se incrementa la versión y el
  acompañante debe **volver a aceptarla** antes de seguir accediendo a datos de
  terceros;
- la aceptación queda en el registro de auditoría.

Campo previsto en el diseño: `statutes_version` en la invitación de
acompañante (propuesta §3.1).

---

## 4. Qué puede hacer técnicamente un acompañante

Traducción de las cláusulas a lo que el sistema permite (scopes de ADR-018),
para que no haya distancia entre lo firmado y lo ejecutable:

| Permiso | Significado | En el piloto |
|---|---|---|
| `read` | Consultar la información del sujeto | Sí |
| `chat` | Conversar con el asistente en el contexto del sujeto | Sí |
| `manage` | Subir, editar y borrar información del sujeto | Solo en cubículos propios |

Garantías del sistema, no de la buena voluntad: sin permiso activo el acceso se
deniega siempre; la revocación corta al instante; la información de dos personas
nunca se mezcla en una misma conversación; y ninguna ruta de la aplicación puede
llegar a los datos esquivando esta comprobación (verificado por
`npm run check:data-access`).

Un acompañante **no** puede concederse permisos a sí mismo, ver a quién no
tiene autorizado, acceder al corpus ni a funciones de administración.

---

## 5. Incumplimiento

Ante un incumplimiento, el operador puede suspender el acceso de forma
inmediata y cautelar, sin preaviso. Según la gravedad: revocación de todos los
permisos, cierre de la cuenta, pérdida de la facultad de proponer nuevos
acompañantes y, cuando proceda, notificación a las personas afectadas y a la
autoridad de protección de datos competente.

La suspensión cautelar no requiere prueba concluyente: basta la sospecha
fundada. Se prefiere cortar y revisar después.

---

## 6. Revocación y salida

Cuando un acompañante cesa —por decisión propia, del operador o por
incumplimiento—: se revocan todos sus permisos con efecto inmediato; se decide
expresamente qué ocurre con los datos de las personas que acompañaba
(**decisión abierta**: conservarlos bajo el operador, transferirlos a otro
acompañante con nuevo consentimiento, entregarlos a la persona, o eliminarlos);
se informa a las personas afectadas; y, si tenía facultad de proponer, se
decide qué ocurre con los acompañantes que hubiera propuesto.

Ningún dato de una persona acompañada debe quedar sin responsable identificable
tras la salida de un acompañante.

---

## 7. Derechos de la persona acompañada

Mientras la persona acompañada no tenga cuenta propia (§0.2), sus derechos de
acceso, rectificación, supresión, oposición, limitación y portabilidad **no son
ejercitables desde la aplicación**. Por eso deben estarlo por escrito:

- la plantilla de consentimiento incluye un contacto directo del operador, para
  que no dependa del acompañante;
- el operador mantiene un procedimiento manual para atender esas solicitudes
  dentro de los plazos del RGPD, incluida la localización del cubículo
  correspondiente;
- una solicitud de supresión debe poder ejecutarse aunque el acompañante no
  colabore.

Este punto es el coste real de la Variante A y debe quedar escrito, no
implícito.

---

## 8. Alta de acompañantes en el piloto

Para el piloto rige el modelo más restrictivo, coherente con el carácter
cerrado de la Etapa B:

1. **Acompañantes semilla:** cada alta la aprueba el operador, uno a uno, tras
   conversación previa. No hay registro libre ni autoservicio.
2. **Sin delegación activa:** ningún acompañante puede dar de alta a otro. A lo
   sumo puede **proponer** un candidato, que el operador confirma o rechaza.
3. **Cuota explícita:** número máximo de personas acompañadas por acompañante,
   fijado al alta y revisable.
4. **Registro nominativo:** quién es, a quién acompaña y desde cuándo.

La red de patrocinio con profundidad y cuotas descrita en la propuesta §3.1
queda **fuera del piloto**. Solo se plantea cuando exista experiencia real con
acompañantes semilla y los estatutos estén en versión vigente.

---

## 9. Control de versiones

| Versión | Fecha | Cambios | Estado |
|---|---|---|---|
| 0.1-borrador | 2026-08-02 | Redacción inicial desde ADR-018 y guía legal | No vigente |

Al pasar a vigente: fijar versión 1.0, registrar la fecha, producir la versión
alemana vinculante y reflejar el identificador en `statutes_version`.
