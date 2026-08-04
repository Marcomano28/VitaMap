# Consentimiento de la persona acompañada · BORRADOR

Versión **0.1-borrador** · 2026-08-02
Estado: **NO VIGENTE** — borrador de trabajo para revisión jurídica
Documento hermano: `ESTATUTOS-SUPPORTER.md` · ADR asociado: ADR-018
Versión alemana (destinada a ser la vinculante): `de/EINWILLIGUNG-BEGLEITETE-PERSON.md`

> **Advertencia.** Borrador redactado desde `apps/web/lib/consent.ts` y
> `GUIA-LEGAL-PILOTO-ALEMANIA.md`. No es un texto jurídico validado y **no
> debe firmarse con nadie** hasta que un especialista alemán lo revise.
>
> Depende de las decisiones abiertas del §0 de los estatutos, en particular de
> quién es el responsable del tratamiento (§0.1). Los huecos marcados
> `[[ … ]]` deben rellenarse antes de usar el documento; los marcados
> `[[DECIDIR: … ]]` requieren decisión previa, no solo un dato.
>
> Este consentimiento se firma **en papel o por medio verificable, fuera de la
> aplicación**, porque la persona que lo firma puede no tener cuenta. Debe
> conservarse: sin él, el acompañante no puede introducir sus datos.
>
> Idioma: la **versión vinculante debe ser la alemana** si el piloto opera en
> Alemania. La traducción se produce junto con el asesor, no automáticamente.

---

## Notas de uso (no forman parte del documento que se firma)

- Se emite **un consentimiento por persona acompañada**, no uno por
  acompañante ni uno genérico.
- Se entrega copia firmada a la persona. Que solo la tenga el acompañante
  vacía de sentido el §6.
- Si la persona no puede consentir por sí misma, este documento **no basta**:
  ver §0.4 de los estatutos, pendiente de postura.
- El texto evita afirmar nada que no esté ya decidido en `consent.ts`. Donde el
  tratamiento cambia respecto al del usuario común (datos introducidos por un
  tercero, sin cuenta propia), se dice expresamente.

---

# Información y consentimiento para el tratamiento de datos de salud en VitaMap

## 1. Quién trata tus datos

**Responsable del tratamiento:** `[[NOMBRE O RAZÓN SOCIAL, DIRECCIÓN Y CONTACTO
REAL DEL OPERADOR]]`

> La guía legal §4.1 es explícita: debe constar identificación real. No sirve
> "el operador de esta instancia".

**Persona que te acompaña:** `[[NOMBRE DEL ACOMPAÑANTE]]`, quien introducirá y
consultará tu información dentro de la herramienta.

`[[DECIDIR: según §0.1 de los estatutos, indicar aquí si el acompañante actúa
bajo la responsabilidad del operador (hipótesis b) o si es él el responsable y
el operador un encargado (hipótesis a). La redacción de este apartado cambia
según la respuesta.]]`

**Contacto directo para tus derechos:** `[[EMAIL Y DIRECCIÓN POSTAL DEL
OPERADOR]]`. Puedes escribir a esta dirección **sin pasar por la persona que te
acompaña**, en cualquier momento.

## 2. Qué es VitaMap

Una herramienta educativa que ayuda a organizar y entender información de
salud. **No emite diagnósticos, no recomienda tratamientos y no sustituye la
consulta con un profesional sanitario.** No debe usarse en urgencias.

## 3. Qué se va a tratar y para qué

**Finalidad:** que la persona que te acompaña pueda organizar tu información de
salud y conversar con el asistente de la herramienta sobre ella, para ayudarte
a entenderla mejor.

**Datos:** los que tú y esa persona acordéis introducir. Pueden incluir
resultados de analíticas, informes médicos, observaciones sobre cómo te
encuentras, respuestas a cuestionarios e imágenes que se suban. Son datos de
salud, protegidos de forma reforzada por el Art. 9 del RGPD.

**Solo se introduce lo necesario** para esa finalidad. Si no quieres que algo
concreto entre en la herramienta, dilo: no tiene que entrar.

**Base legal:** tu **consentimiento explícito**, conforme a los Arts. 6.1.a y
9.2.a del RGPD. Sin él no se trata ningún dato tuyo.

## 4. Quién puede ver tu información

La persona que te acompaña, indicada en el §1, y nadie más entre los usuarios
de la herramienta. Ningún otro acompañante ni ningún otro usuario puede
acceder a tus datos: el sistema lo impide técnicamente y deniega el acceso por
defecto.

El operador puede acceder por motivos técnicos de mantenimiento, seguridad o
para atender una solicitud tuya.

**Cada acceso queda registrado** de forma que no puede alterarse: quién accedió,
a qué, cuándo y de qué tipo fue el acceso. Puedes pedir ver ese registro.

**Proveedores implicados:** la herramienta se aloja en un servidor en la Unión
Europea (Hetzner). Durante la fase piloto, las preguntas al asistente y los
fragmentos de contexto necesarios para responderlas se procesan a través de
Mistral AI, proveedor con sede en la Unión Europea, con el uso para
entrenamiento de modelos desactivado. Tus documentos y el almacenamiento
principal permanecen en el servidor. Si están activadas las copias de seguridad
externas, Backblaze B2 almacena copias cifradas. No pagas nada ni tienes
suscripción, así que **ningún proveedor de pagos recibe información tuya**.
`[[REVISAR contra la lista de proveedores vigente de la guía legal §4.3 antes
de firmar — si cambia el proveedor de inferencia o de copias, este párrafo
cambia.]]`

**En ningún caso tus datos se utilizan para entrenar modelos.**

## 5. Cuánto tiempo

Mientras dure el acompañamiento y tu consentimiento. Si lo retiras, o si
termina el acompañamiento, tus datos se eliminan del almacenamiento activo.

`[[DECIDIR: qué ocurre con tus datos si la persona que te acompaña deja de usar
la herramienta — ver §6 de los estatutos. Debe poder responderse aquí en una
frase clara.]]`

Las copias de seguridad cifradas quedan aisladas, no se usan para ningún otro
fin y expiran según la política de conservación publicada.

## 6. Tus derechos

Tienes derecho a acceder a tus datos, rectificarlos, suprimirlos, oponerte a su
tratamiento, limitarlo y recibir una copia en formato portable. También a
presentar una reclamación ante la autoridad de protección de datos competente.

**Cómo ejercerlos:** escribiendo al contacto del §1. Como no tienes cuenta
propia en la herramienta, no puedes ejercerlos desde la aplicación; el operador
se compromete a atenderlos igualmente, dentro de los plazos legales, **aunque
la persona que te acompaña no intervenga o no esté de acuerdo**.

**Puedes retirar tu consentimiento en cualquier momento, sin dar
explicaciones.** Retirarlo no afecta a la licitud del tratamiento anterior.
Cuando lo retires, el acceso se corta de inmediato y tus datos se eliminan del
almacenamiento activo.

## 7. Qué firmas

Marca cada casilla solo si estás de acuerdo. Puedes negarte a cualquiera de
ellas, y puedes no firmar en absoluto.

- [ ] He leído esta información y he podido preguntar lo que no entendía.
- [ ] Entiendo que VitaMap es una herramienta educativa, **no un dispositivo
      médico**, y que no da consejo clínico ni sirve para urgencias.
- [ ] **Consiento expresamente** que se traten mis datos de salud en VitaMap
      conforme al Art. 9.2.a RGPD, en los términos aquí descritos.
- [ ] Autorizo a `[[NOMBRE DEL ACOMPAÑANTE]]` a introducir y consultar mi
      información de salud en la herramienta, y a conversar con el asistente
      sobre ella.
- [ ] Sé que puedo retirar esta autorización en cualquier momento escribiendo
      a `[[CONTACTO DEL OPERADOR]]`, y que el acceso se cortará de inmediato.
- [ ] He recibido una copia firmada de este documento.

<br>

| | |
|---|---|
| Nombre de la persona acompañada | `……………………………………………` |
| Fecha y lugar | `……………………………………………` |
| Firma | `……………………………………………` |
| | |
| Nombre del acompañante | `……………………………………………` |
| Firma | `……………………………………………` |

<br>

**Versión del documento:** 0.1-borrador · 2026-08-02
**Identificador interno del registro:** `[[se anota al registrar el
consentimiento en el sistema — campo consent_version del grant]]`

---

## Control de versiones

| Versión | Fecha | Cambios | Estado |
|---|---|---|---|
| 0.1-borrador | 2026-08-02 | Redacción inicial desde consent.ts y guía legal | No vigente |
