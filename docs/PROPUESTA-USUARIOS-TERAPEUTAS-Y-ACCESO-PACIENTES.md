# Propuesta · Supporters/acompañantes y acceso a datos de pacientes

Versión 0.1 · 2026-06-17
Estado: **documento a estudiar** (propuesta, no decisión tomada)
ADR asociado cuando se decida: ADR-017 (reservado)

> Este documento explora cómo introducir un segundo tipo de usuario —el
> **supporter/acompañante** (terapeuta, cuidador, ayudante técnico o persona de
> confianza según el caso)— que pueda trabajar con datos de varios pacientes,
> **sin degradar en nada la seguridad del usuario común** (paciente individual).
> No es una decisión; es material para decidir.

> Nota 2026-06-21: se prefiere "supporter/acompañante" como concepto amplio.
> "Terapeuta" queda como un caso posible, pero no agota la figura ni debe
> confundirse con administración de la plataforma.

---

## 1. Objetivo y restricción innegociable

**Objetivo.** Que un usuario supporter/acompañante (alta por invitación) pueda,
además de sus propios datos, trabajar con los datos de varios pacientes o
personas acompañadas y chatear con el modelo respecto a ellos.

**Restricción dura (la que manda sobre todo lo demás).** Añadir este mecanismo
**no puede abrir ninguna superficie nueva de riesgo para el usuario común**. El
invariante actual —"cada usuario solo toca su propia carpeta"— es hoy la base de
toda la seguridad de datos. Cualquier diseño que introduzca acceso cruzado debe:

1. dejar al paciente individual **exactamente igual de aislado** que hoy;
2. hacer que el acceso del supporter sea **explícito, auditable y revocable**;
3. fallar **cerrado** (sin grant válido → sin acceso, como si el dato no
   existiera);
4. no depender de que cada ruta "se acuerde" de comprobar permisos: la
   comprobación debe vivir en **un único sitio obligatorio**.

---

## 2. Punto de partida (qué hay hoy)

Resumen de lo que el código ya garantiza, porque condiciona el diseño:

| Pieza | Estado actual | Implicación |
|---|---|---|
| Identidad | BetterAuth (email+password), alta **solo por invitación** (`registration_invitation`) | Ya hay un flujo de invitación reutilizable |
| Roles | **No existen como dato**. "admin" se deriva de `ADMIN_EMAILS` (env) en `lib/admin.ts` | Supporter/paciente sería el primer rol almacenado |
| Aislamiento de datos | Filesystem por usuario: `data/users/<userId>/{memory,documents,index.sqlite}` | Datos ya particionados; sin mezcla |
| Acceso a datos | Todo pasa por `requireUserId()` / `requireUserIdFromRequest()` (`lib/session.ts`) y usa **ese** id | Choke point único ya existente |
| Retrieval | `queryMemoryAndKB(userId, …)` recibe el `userId` **como parámetro explícito** | Leer otra carpeta es mecánicamente trivial; lo único que lo impide es que el id = sesión |
| Auditoría | `audit_event` con `actor` **y** `subject_id` separados, append-only con hash chain (ADR-007) | El modelo "X actúa sobre datos de Y" ya cabe sin cambiar esquema |
| Path safety | `safeUserId()` valida formato del id (anti path traversal) | Protege la ruta, **no** la decisión de autorización |

**Conclusión de partida:** la fontanería está casi lista (los datos ya se
direccionan por `userId` explícito y hay un único choke point). El trabajo real
es **autorización correcta** y **gobernanza de datos de salud**, no viabilidad.

---

## 3. La decisión de modelado central

Hay dos formas muy distintas de representar "las personas acompañadas de un
supporter", y de ella se derivan casi todas las diferencias de seguridad.
Conviene elegirla **primero**.

### Variante A · Cubículos del supporter (el supporter sube los datos)

El supporter posee varios `userId` adicionales —"cubículos"— que él mismo crea y
gestiona. Cada cubículo es un contenedor de datos de un paciente que **el propio
supporter** ha subido. El paciente puede no tener cuenta.

```
supporter (cuenta real)
├── data/users/<supporterId>/                 ← sus propios datos
└── cubículos (ids gestionados por el supporter)
    ├── data/users/<cubicle-1>/               ← datos del paciente 1
    ├── data/users/<cubicle-2>/               ← datos del paciente 2
    └── …
```

- **Cómo encaja en la arquitectura:** casi perfecto. Un cubículo **es** una
  carpeta `data/users/<id>/` más; el chat y el retrieval ya funcionan con
  cualquier `userId`. No hace falta "acceso cruzado" en el sentido fuerte: el
  supporter cambia el `userId` activo de su sesión a uno de sus cubículos.
- **Seguridad para el usuario común:** **intacta**. Los cubículos son ids que
  nadie más posee; el paciente individual con cuenta propia sigue aislado
  exactamente igual. No se comparte nada entre cuentas reales.
- **Coste:** un cubículo no tiene cuenta de login; necesita un modelo de
  "propiedad" (qué supporter posee qué cubículos) y un selector de contexto.
- **Límite legal/ético:** el dato del paciente vive bajo el control del
  supporter, no del paciente. Eso es defendible si el supporter es el
  responsable de tratamiento de su propia consulta, pero **el paciente no
  controla ni revoca** desde la app. Hay que documentarlo en la guía legal.

### Variante B · Concesión entre cuentas reales (el paciente comparte)

El paciente tiene su propia cuenta y **concede** acceso a un supporter mediante
un *grant* explícito y revocable.

```
paciente (cuenta real, dueña de sus datos)
   │  grant: "concedo lectura a supporter S"
   ▼
supporter (cuenta real) ──► puede leer data/users/<patientId>/ mientras el grant esté activo
```

- **Cómo encaja:** requiere acceso cruzado real entre cuentas → introduce el
  choke point de autorización nuevo (§5). Más superficie, pero más limpio
  legalmente.
- **Seguridad para el usuario común:** el invariante cambia para **quien
  decide compartir**; el resto de pacientes siguen igual. El riesgo es que el
  acceso cruzado mal implementado se generalice.
- **Coste:** mayor (tabla de grants, consentimiento, revocación, UI por ambas
  partes).
- **Legal/ético:** el más sólido — el paciente es dueño y revoca cuando quiera.

### Variante C · Híbrida (recomendada a estudio)

Empezar por **A (cubículos)** para el piloto —es lo que describe la figura de
supporter: "yo subo los datos de las personas a las que acompaño y chateo sobre
ellos"— y es la que **menos toca la seguridad del usuario común**. Dejar **B
(grant entre cuentas)** como evolución cuando un paciente con cuenta propia quiera
compartir con su supporter. Ambas pueden convivir si el modelo de autorización
(§5) se diseña genérico desde el principio: "¿puede el actor A operar sobre el
sujeto S?".

> **Recomendación preliminar:** Variante A para Fase piloto; arquitectura del
> choke point preparada para B. Decisión a confirmar en ADR-017.

### 3.1 Red de supporters: invitación delegada, no administración delegada

La continuidad conceptual propuesta no es "dar admin a más personas", sino crear
una red limitada de **supporters** capaces de acompañar a otros usuarios o de
gestionar cubículos, bajo estatutos explícitos.

Principio base:

```text
admin        = gobierna la plataforma, corpus, configuración y operación.
supporter   = acompaña datos de salud de sujetos concretos con permiso limitado.
paciente     = cuenta propia o sujeto/cubículo con datos.
```

Un supporter podría ofrecer a otra persona una **clave de invitación** para
convertirse en supporter, pero esa clave no debe ser equivalente a poder
administrativo. Debe ser una invitación **patrocinada y acotada**:

- el supporter que invita queda registrado como `sponsor_user_id`;
- la invitación declara `invitation_kind='supporter'`;
- el nuevo supporter debe aceptar estatutos/versiones legales propios;
- toda creación, aceptación, uso y revocación queda auditada;
- la capacidad de invitar a nuevos supporters depende de criterios explícitos
  (cuota, profundidad de red, antigüedad, formación, confianza o revisión);
- revocar a un supporter debe cortar su capacidad de acceso y, si los estatutos
  lo prevén, su capacidad de seguir patrocinando a otros.

Esto permite que la red crezca por confianza humana sin convertir la confianza en
una puerta trasera técnica. El supporter **no** puede saltarse el consentimiento,
no ve datos fuera de sus sujetos autorizados, no accede al corpus admin y no puede
concederse a sí mismo más poder.

Para el piloto puede existir una figura de **supporters semilla**: los primeros
acompañantes aceptados manualmente por el operador. Después, si se aprueba, esos
supporters semilla podrían patrocinar nuevos supporters dentro de límites muy
claros.

#### Estatutos mínimos del supporter

Antes de activar esta red, VitaMap debería tener un documento versionado de
estatutos del supporter. Como mínimo debe fijar:

1. finalidad: apoyo educativo, organización de datos y explicación acompañada,
   no diagnóstico ni sustitución profesional;
2. límites: no usar VitaMap para urgencias, decisiones clínicas, promesas de cura
   ni captación opaca;
3. consentimiento: ningún dato de otra persona entra sin base clara y documentada;
4. minimización: subir solo lo necesario y separar cubículos/personas;
5. confidencialidad: no compartir capturas, exportaciones ni claves;
6. seguridad: MFA obligatorio para supporters antes de datos reales de terceros;
7. trazabilidad: aceptar que todo acceso cruzado quede auditado;
8. revocación: el permiso puede retirarse y debe cortar el acceso de inmediato;
9. invitación delegada: patrocinar a otro supporter es una responsabilidad
   explícita, limitada y revocable;
10. escalado: dudas legales, incidentes o riesgo clínico se derivan fuera de la
    herramienta.

#### Modelo conceptual de invitación delegada

```sql
-- Extensión conceptual de registration_invitation
invitation_kind     TEXT  -- 'patient' | 'supporter'
sponsor_user_id     TEXT  -- supporter/admin que genera o patrocina
max_delegation_depth INTEGER
statutes_version    TEXT  -- estatutos aceptados al registrarse
```

La decisión fina queda abierta: la clave de supporter puede crear directamente el
rol en un piloto pequeño, o puede crear una candidatura que el operador confirma.
Mi recomendación preliminar es:

- **piloto cerrado:** supporters semilla aprobados por operador;
- **red inicial:** supporters semilla pueden patrocinar, con cuota baja y
  auditoría;
- **escala posterior:** pasar a candidatura/revisión y estatutos más formales.

---

## 4. Esbozo del modelo de datos

Todo en SQLite (coherente con ADR-005 "sin Postgres en Fase 0/1"). Dos piezas:
el **rol** del usuario y la **propiedad/concesión** sobre sujetos de datos.

### 4.1 Rol de usuario

Vía `additionalFields` de BetterAuth (igual que `consentVersion` hoy):

```ts
user.additionalFields = {
  userType: { type: "string", required: false, input: false }, // "patient" | "supporter"
  // (admin sigue derivándose de ADMIN_EMAILS; no se mezcla con userType)
}
```

`userType` lo asigna el flujo de invitación (la invitación ya puede declarar
"esta invitación crea un supporter"). Por defecto: `patient`. **Nunca**
self-service: el rol supporter solo nace de una invitación marcada como tal.

### 4.2 Sujetos de datos y propiedad/concesión

Una sola tabla cubre **A y B** si se modela como "acceso de un actor a un
sujeto de datos", donde el sujeto es un `userId` (cuenta real o cubículo).

```sql
-- Catálogo de "sujetos de datos" = toda carpeta data/users/<id>.
-- Para cuentas reales, data_subject_id == userId de la cuenta.
-- Para cubículos (Variante A), es un id generado sin cuenta de login.
CREATE TABLE IF NOT EXISTS data_subject (
  id            TEXT PRIMARY KEY,          -- el <userId> usado en la ruta de datos
  kind          TEXT NOT NULL,             -- 'account' | 'cubicle'
  display_label TEXT,                      -- alias visible al supporter (p.ej. "Paciente A.M.")
  created_by    TEXT NOT NULL,             -- userId que lo creó (supporter, o el propio paciente)
  created_at    TEXT NOT NULL,
  archived_at   TEXT                       -- soft-delete
);

-- Concesiones de acceso: quién (actor) puede operar sobre qué sujeto y cómo.
CREATE TABLE IF NOT EXISTS data_access_grant (
  id              TEXT PRIMARY KEY,
  data_subject_id TEXT NOT NULL REFERENCES data_subject(id),
  actor_user_id   TEXT NOT NULL,           -- el supporter que recibe el acceso
  scope           TEXT NOT NULL,           -- 'read' | 'chat' | 'manage' (ver §4.3)
  origin          TEXT NOT NULL,           -- 'ownership' (cubículo propio) | 'patient_grant' (consentido)
  status          TEXT NOT NULL,           -- 'active' | 'revoked'
  consent_version TEXT,                    -- versión de consentimiento aplicable (B)
  granted_by      TEXT NOT NULL,           -- quién concedió (supporter en A, paciente en B)
  granted_at      TEXT NOT NULL,
  revoked_at      TEXT,
  UNIQUE (data_subject_id, actor_user_id, scope)
);

CREATE INDEX IF NOT EXISTS data_access_grant_actor
  ON data_access_grant(actor_user_id, status);
```

Notas de diseño:

- **El propio dueño no necesita grant.** Un usuario siempre puede operar sobre
  su propio `data_subject_id == userId`. El grant es solo para acceso de
  terceros. Esto mantiene al usuario común en el camino de hoy, sin tocar nada.
- **Variante A** = filas con `origin='ownership'`: el supporter crea el sujeto
  (`kind='cubicle'`) y obtiene automáticamente un grant `manage` sobre él.
- **Variante B** = filas con `origin='patient_grant'`: el paciente crea el grant
  hacia el terapeuta; revocable poniendo `status='revoked'`.
- **Revocación inmediata y dura:** revocar = `status='revoked'`. El choke point
  (§5) consulta `status='active'`, así que el corte es instantáneo.
- **Sin reescritura de datos:** las carpetas `data/users/<id>/` no cambian de
  forma. Solo cambia **quién puede direccionarlas**.

### 4.3 Scopes (qué puede hacer el acceso)

| scope | Significado | Uso típico |
|---|---|---|
| `read` | Ver memoria/observaciones del sujeto | Terapeuta consulta histórico |
| `chat` | Lanzar chat RAG en el contexto del sujeto | "chatear respecto a estos datos" |
| `manage` | Subir/editar/borrar datos del sujeto | Cubículo propio (Variante A) |

Empezar con el mínimo necesario para el piloto (probablemente `manage` para
cubículos, que implica `read`+`chat`). No conceder `manage` en grants de
paciente (B) salvo decisión explícita: un supporter no debería poder borrar los
datos de la cuenta de un paciente.

---

## 5. El choke point de autorización (la pieza crítica de seguridad)

Hoy el patrón es: cada ruta llama `requireUserId()` y usa ese id. El cambio
**no** debe ser "y a veces uso otro id si me lo pasan". Debe ser **una función
obligatoria** que traduzca (actor de la sesión, sujeto solicitado) → id de datos
autorizado, **fallando cerrado**.

### 5.1 Forma propuesta

```ts
// lib/data-access.ts  (NUEVO — único lugar que decide acceso cruzado)

export type DataScope = "read" | "chat" | "manage";

/**
 * Devuelve el data_subject_id sobre el que el actor puede operar, o lanza.
 * - Si target es undefined o == actor: acceso propio (camino de hoy, sin grant).
 * - Si target != actor: exige grant ACTIVO con el scope pedido. Si no, lanza
 *   ForbiddenError (fail-closed) y NO revela si el sujeto existe.
 * Audita SIEMPRE el acceso cruzado (actor != subject).
 */
export async function resolveDataSubject(
  actorUserId: string,         // de la sesión, ya validado por safeUserId
  targetSubjectId: string | undefined,
  scope: DataScope,
): Promise<string> {
  const subject = safeUserId(targetSubjectId ?? actorUserId);
  if (subject === actorUserId) return subject;            // acceso propio

  const grant = getActiveGrant(subject, actorUserId, scope); // status='active'
  if (!grant) {
    // Fail-closed + no enumeración: mismo error exista o no el sujeto.
    throw new ForbiddenError();
  }
  await logAuditEventSafe({
    actor: actorUserId,
    action: `data.cross_access.${scope}`,
    subjectId: subject,
    payloadSum: `grant=${grant.id}`,
  });
  return subject;
}
```

### 5.2 Cómo se cablea (sin debilitar al usuario común)

- **Toda** ruta de datos deja de usar `requireUserId()` directamente para
  direccionar datos y pasa a:
  ```ts
  const actor = await requireUserId();
  const subject = await resolveDataSubject(actor, requestedSubject, "chat");
  const result = await queryMemoryAndKB(subject, …);
  ```
- Para el **usuario común no cambia nada**: `requestedSubject` es `undefined` →
  `resolveDataSubject` devuelve su propio id por el camino corto, sin tocar la
  tabla de grants. Cero superficie nueva para él.
- El `targetSubjectId` viene de la sesión/selector de contexto del supporter,
  **nunca** se confía en un id crudo del cliente sin pasar por
  `resolveDataSubject`. El id sigue validándose con `safeUserId` (anti
  traversal) **antes** de la comprobación de grant.
- **Fail-closed + anti-enumeración:** sin grant → `ForbiddenError` idéntico
  exista o no el sujeto. Un atacante no puede distinguir "no autorizado" de "no
  existe".

### 5.3 Invariantes que hay que test-ear (suite de seguridad dedicada)

1. `target == actor` → siempre permitido (regresión del usuario común).
2. `target != actor` sin grant activo → `ForbiddenError`, **siempre**.
3. Grant revocado → corte inmediato (status leído en cada petición).
4. Scope insuficiente (`read` cuando se pide `chat`) → denegado.
5. `safeUserId` rechaza ids con formato inválido antes de tocar grants.
6. Acceso cruzado **siempre** deja registro de auditoría (actor ≠ subject).
7. Ninguna ruta de datos direcciona `data/users/<id>` **sin** pasar por
   `resolveDataSubject` (lint/grep de control).

> El invariante 7 es el que protege de verdad: la seguridad no depende de que
> cada desarrollador "se acuerde", sino de que exista **un solo camino** hacia
> los datos.

---

## 6. Impacto en el resto del sistema

| Área | Cambio | Tamaño |
|---|---|---|
| `lib/session.ts` | Añadir `resolveDataSubject` (o `lib/data-access.ts`) | Pequeño |
| Rutas de datos (chat, memoria, upload, extracción, observaciones, prakriti) | Sustituir `requireUserId()`→direccionar por `resolveDataSubject` | Mediano (repetitivo) |
| `lib/qmd.ts` | Ninguno: ya recibe `userId` | Nulo |
| Invitaciones | Marcar invitación como "crea supporter" y, si aplica, registrar sponsor | Pequeño-mediano |
| UI supporter | Selector de contexto (paciente/cubículo activo), alta de cubículo, gestión de grants y patrocinios | Mediano-grande |
| UI paciente (solo Variante B) | Conceder/revocar acceso, ver quién accede | Mediano |
| Auditoría | Nuevas `action` de acceso cruzado | Pequeño (esquema ya sirve) |
| Guía legal | Sección de tratamiento de datos entre supporter y paciente + estatutos del supporter | **Crítico, no-código** |

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Una ruta olvida `resolveDataSubject` y usa el id crudo | Invariante 7 + control automático (grep/lint en CI) + revisión |
| Escalada: supporter accede a quien no debe | Fail-closed, scope mínimo, grant único por (sujeto, actor, scope) |
| Enumeración de pacientes | Error idéntico exista o no el sujeto |
| Revocación no efectiva | Estado leído por petición; sin caché de autorización (o caché muy corta e invalidable) |
| Contaminación del RAG entre sujetos | El retrieval ya abre el store del `subject` resuelto; un solo sujeto por petición; **nunca** fusionar memorias de varios sujetos en un mismo prompt |
| Datos de salud sin base legal clara | ADR-017 + sección en `GUIA-LEGAL-PILOTO-ALEMANIA.md` antes de activar |
| Confusión con el posicionamiento "educativo, no diagnóstico" | Definir explícitamente que el supporter usa la herramienta como apoyo educativo, no como historia clínica; el guardrail anti-diagnóstico sigue activo |
| Red de invitaciones que crece sin control | Patrocinio limitado, cuotas, profundidad máxima, estatutos versionados, MFA y revocación de sponsor |

---

## 8. Recomendación de secuencia (si se aprueba)

1. **ADR-017** decidiendo Variante (A piloto, choke point preparado para B) y
   postura legal.
2. **`lib/data-access.ts`** con `resolveDataSubject` + tabla `data_subject` /
   `data_access_grant`, **con su suite de seguridad (§5.3) antes que la UI**.
3. Migrar las rutas de datos al choke point (mediano, mecánico, revisable).
4. Estatutos del supporter + versión legal/operativa aceptable.
5. Flujo de invitación de supporter + alta de cubículos (Variante A).
6. Selector de contexto en UI del supporter + auditoría visible.
7. Invitación delegada entre supporters, primero limitada a supporters semilla.
8. (Evolución) Variante B: consentimiento y revocación desde la cuenta del
   paciente.

**Regla de oro de la secuencia:** el choke point y sus tests existen y pasan
**antes** de que ninguna UI permita acceso cruzado. La seguridad se construye
primero, no se parchea después.

---

## 9. Preguntas abiertas para la decisión

- ¿Cubículos (A) o concesión entre cuentas (B) para el piloto? (recom.: A)
- ¿El supporter puede *chatear como* el paciente o solo *leer + chatear sobre*
  sus datos? (afecta scope y posicionamiento legal)
- ¿El paciente de un cubículo (sin cuenta) tiene algún derecho de acceso/borrado
  exigible vía la app, o se gestiona fuera? (RGPD)
- ¿Un supporter puede tener varios cientos de cubículos? (límites, índice QMD
  por sujeto, coste de stores abiertos — ver QMD-EVOLUCION §rendimiento)
- ¿MFA obligatorio para cuentas supporter? (acceden a datos de terceros; ADR-009
  ya prevé MFA antes del piloto real)
- ¿Un supporter puede patrocinar a otros supporters directamente o solo generar
  candidaturas revisables por el operador?
- ¿Cuál es la profundidad máxima de la red de patrocinio y qué ocurre con los
  descendientes si se revoca al sponsor?

---

## 10. Referencias

- ADR-007 — Audit log append-only con hash chain · `docs/DECISIONS.md`
- ADR-005 — Sin Postgres en Fase 0/1 · `docs/DECISIONS.md`
- ADR-009 — BetterAuth sobre SQLite; MFA antes del piloto · `docs/DECISIONS.md`
- Identidad y sesión · `apps/web/lib/auth.ts`, `apps/web/lib/session.ts`
- Aislamiento de datos por usuario · `apps/web/lib/qmd.ts` (`userMemoryDir`)
- Invitaciones · `apps/web/lib/invitations.ts`
- Guía legal del piloto · `docs/GUIA-LEGAL-PILOTO-ALEMANIA.md`
