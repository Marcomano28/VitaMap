# Guia legal y tecnica del piloto VitaMap en Alemania

**Estado:** borrador operativo interno para revision profesional
**Ultima revision:** 2026-06-08
**Ambito:** piloto cerrado en Alemania, inicialmente 3 usuarios de pago

> Esta guia organiza riesgos y tareas. No es un dictamen juridico, una
> autorizacion para abrir el piloto, una politica de privacidad ni un texto
> contractual destinado a clientes. La calificacion como producto sanitario,
> la evaluacion de impacto, la documentacion de consumidores y las bases
> juridicas deben ser revisadas por profesionales competentes antes de admitir
> datos de salud reales o cobrar la primera suscripcion.

---

## 1. La idea central, en lenguaje llano

Que solo participen tres personas de confianza no elimina las obligaciones
legales. Desde que VitaMap cobra 6 EUR al mes y almacena datos de salud:

- las personas son usuarios, interesados bajo el RGPD y consumidores;
- el operador de VitaMap es responsable del tratamiento;
- la confianza personal no sustituye consentimiento informado ni seguridad;
- el aviso "no es un dispositivo medico" no basta si las funciones o la
  publicidad sugieren diagnostico, prevencion, monitorizacion o tratamiento;
- cobrar solo para cubrir el VPS sigue siendo una actividad economica.

La regla prudente para el piloto es:

```text
primero definir el limite del producto
  -> despues documentar el tratamiento
  -> despues implementar y probar las garantias
  -> solo entonces aceptar el primer dato de salud real
```

## 2. Limite funcional recomendado para el primer piloto

### Zona verde: puede formar parte del piloto inicial

- Archivo privado de documentos aportados por el propio usuario.
- Registro manual de observaciones personales.
- Busqueda, organizacion cronologica, exportacion y borrado.
- Explicaciones educativas generales con fuentes visibles.
- Resumen de lo que el usuario ya ha escrito, sin concluir que padece algo.
- Preparacion de preguntas que el usuario quiera llevar a un profesional.
- Control humano: el usuario revisa y aprueba antes de guardar una extraccion.

### Zona amarilla: requiere evaluacion escrita antes de activarse

- PHQ-9, GAD-7 u otras escalas con puntuacion y bandas interpretativas.
- Deteccion automatica de crisis o avisos basados en respuestas individuales.
- Correlaciones entre sintomas, analiticas, habitos y documentos.
- Interpretacion personalizada de resultados de laboratorio.
- Alertas, clasificaciones de riesgo o seguimiento de un estado de salud.
- OCR o IA que convierta documentos medicos en datos estructurados.
- Recomendaciones personalizadas, aunque se presenten como "reflexivas".

Estas funciones combinan datos individuales con calculo, interpretacion o
scoring. Pueden aumentar el riesgo RGPD y acercar la aplicacion a una
finalidad medica. Para el primer piloto deben permanecer desactivadas o ser
aprobadas expresamente en el informe de calificacion regulatoria.

### Zona roja: no debe entrar en el piloto sin un proyecto regulatorio nuevo

- Diagnosticar, descartar o confirmar una enfermedad.
- Recomendar tratamientos, dosis, cambios de medicacion o abandono de terapia.
- Decir que un resultado es urgente o que no requiere atencion medica.
- Usar VitaMap para decisiones clinicas de un medico o centro sanitario.
- Prometer prevenir, detectar, monitorizar o tratar enfermedades.
- Tomar decisiones automatizadas con efectos importantes sobre una persona.
- Experimentar para demostrar eficacia clinica o publicar resultados sin
  protocolo de investigacion y revision etica/juridica.

## 3. Etapas y puertas de entrada

El numero de usuarios no es el unico criterio. Una funcion nueva puede cambiar
el marco legal aunque siga habiendo tres personas.

### Etapa A: desarrollo privado sin datos reales de terceros

**Permitido:** datos sinteticos, documentos ficticios y datos propios usados
de forma estrictamente privada.

**Objetivo:** probar arquitectura, borrado, restauracion, aislamiento,
guardrails y pagos en modo de prueba.

**Todavia no hacer:**

- invitar voluntarios a subir datos medicos;
- cobrar suscripciones reales;
- publicar promesas sobre prevencion, diagnostico o monitorizacion;
- probar funciones de crisis con personas que dependan de su respuesta.

**Puerta para salir de esta etapa:** completar todas las tareas P0 de la
seccion 8 y obtener las revisiones profesionales indicadas en la seccion 7.

### Etapa B: piloto cerrado de 3 usuarios de pago

Esta es la primera etapa legalmente real. Antes de abrirla deben existir:

1. Identidad empresarial y fiscal aclarada.
2. Informe de calificacion de producto sanitario.
3. Evaluacion de impacto de proteccion de datos, o una justificacion
   profesional documentada de por que no procede.
4. Politica de privacidad, consentimiento, aviso legal y condiciones del
   servicio revisados.
5. Contratos y evaluacion de proveedores.
6. Controles tecnicos P0 probados con evidencia.
7. Procedimientos de incidentes, derechos y retirada del piloto.

El piloto debe ser realmente cerrado: tres invitaciones nominativas, sin
registro publico, sin indexacion y sin compartir cuentas.

### Etapa C: ampliacion controlada de 4 a 12 usuarios

No existe una exencion especial por permanecer debajo de 12 usuarios. Antes de
cada ampliacion:

- revisar la evaluacion de impacto y el mapa de proveedores;
- verificar capacidad, aislamiento y tiempos de respuesta;
- comprobar que borrado, exportacion, cancelacion y restauracion siguen
  funcionando;
- revisar incidentes, falsos positivos del guardrail y reclamaciones;
- comprobar que ninguna descripcion publica haya ampliado la finalidad;
- confirmar que la cuota, impuestos y facturacion continuan correctos.

La ampliacion se detiene si aparece una brecha, un error de aislamiento, una
respuesta medica peligrosa o una funcion sin evaluacion previa.

### Etapa D: nuevas fuentes, mas automatizacion o uso profesional

Se abre una evaluacion nueva antes de incorporar cualquiera de estos cambios:

- wearables, sensores, imagen medica o genetica;
- APIs externas o modelos de IA fuera del VPS;
- acceso de medicos, terapeutas, investigadores o familiares;
- menores de edad o personas especialmente vulnerables;
- integracion con ePA, aseguradoras, hospitales o empleadores;
- analisis poblacional, entrenamiento de modelos o reutilizacion secundaria;
- alertas proactivas, scoring avanzado o recomendaciones individuales;
- expansion comercial fuera de Alemania.

No basta con actualizar el consentimiento. Deben revisarse finalidad, base
legal, contratos, evaluacion de impacto, seguridad y calificacion MDR.

### Etapa E: producto medico o investigacion

Si VitaMap pretende aportar informacion usada para diagnostico o tratamiento,
monitorizar procesos fisiologicos, demostrar eficacia clinica o integrarse en
la asistencia sanitaria, deja de ser una simple ampliacion del piloto.

Puede requerir, entre otras cosas:

- clasificacion conforme al Reglamento de productos sanitarios;
- sistema de gestion de calidad y gestion de riesgos;
- evaluacion clinica, documentacion tecnica y marcado CE;
- organismo notificado segun la clase aplicable;
- vigilancia y gestion formal de incidentes;
- protocolo de investigacion, consentimiento separado y comite de etica.

Esta etapa no debe comenzar sin abogado especializado en
`Medizinprodukterecht` y consultor regulatorio.

## 4. Proteccion de datos: expediente minimo

### 4.1 Roles y bases juridicas

El operador de VitaMap es el **responsable del tratamiento**. Debe constar su
nombre o razon social, direccion y contacto real; no sirve "el operador de esta
instancia".

No todo se apoya en el mismo consentimiento:

| Tratamiento | Base que debe evaluarse |
|---|---|
| Cuenta, acceso y prestacion contratada | Art. 6.1.b RGPD |
| Facturas, contabilidad y obligaciones legales | Art. 6.1.c RGPD |
| Seguridad y prevencion de abuso | Art. 6.1.f RGPD, tras ponderacion |
| Datos de salud | base del Art. 6 y excepcion explicita del Art. 9; en el piloto se plantea consentimiento explicito Art. 9.2.a |
| Comunicaciones opcionales o nuevos usos | consentimiento separado cuando corresponda |

Retirar el consentimiento de salud debe detener ese tratamiento y permitir
borrar la memoria. No obliga a borrar documentos contables que deban
conservarse legalmente; ambas categorias deben estar separadas.

### 4.2 Documentos que deben existir

- Registro de actividades de tratamiento, aunque se documente de forma breve.
- Evaluacion de impacto (`DSFA`/`DPIA`) firmada y versionada.
- Politica de privacidad conforme a los articulos 12 y 13 RGPD.
- Texto de consentimiento explicito, granular y revocable.
- Politica de conservacion para memoria, cuentas, logs, backups y facturas.
- Lista de proveedores, ubicaciones, funciones y transferencias.
- Contratos de encargo del Art. 28 cuando correspondan.
- Procedimiento de acceso, rectificacion, exportacion, oposicion y borrado.
- Procedimiento de brechas y registro de incidentes.
- Revision documentada de la necesidad de delegado de proteccion de datos.

La lista alemana de tratamientos sujetos a DSFA incluye el uso de IA para
interactuar con personas o valorar aspectos personales. VitaMap, ademas,
trata datos de salud y realiza scoring. Por ello debe partir de la presuncion
de que la DSFA es necesaria. Si resulta obligatoria, el apartado 38 BDSG puede
hacer obligatorio un delegado de proteccion de datos con independencia del
numero de trabajadores. Esta conclusion debe validarse con un especialista
aleman y con la autoridad competente del `Bundesland`.

### 4.3 Proveedores

El texto actual no debe afirmar "destinatarios: ninguno". Como minimo se deben
analizar y describir:

- **Hetzner:** alojamiento del VPS y ubicacion elegida.
- **Backblaze B2:** copia cifrada, region, credenciales y subencargados.
- **Stripe:** cuenta, suscripcion y pago; nunca debe recibir datos de salud.
- **Revolut:** recepcion bancaria y obligaciones financieras.
- **DNS, correo y soporte:** incluso si no ven el contenido medico, pueden
  tratar identificadores, IP o metadatos.

Stripe debe recibir solo los datos necesarios para cobrar. El identificador
interno enviado como metadata debe ser seudonimo y nunca contener diagnosticos,
documentos, respuestas a escalas ni texto de salud.

### 4.4 Brechas

Debe existir una ficha de emergencia con:

```text
detectar
  -> contener y conservar evidencia
  -> valorar datos y personas afectadas
  -> documentar la decision
  -> notificar a la autoridad, cuando proceda, dentro de 72 horas
  -> avisar a las personas si existe alto riesgo
  -> corregir y revisar la DSFA
```

El operador debe saber de antemano cual es su autoridad de proteccion de datos
segun el lugar de establecimiento.

## 5. Producto sanitario, ejercicio de la medicina e IA

### 5.1 El disclaimer no decide la clasificacion

La finalidad real se deduce de las funciones, instrucciones, web y publicidad.
Palabras como "analizar", "detectar", "interpretar", "monitorizar",
"prevenir" o "diagnosticar" son senales de finalidad medica cuando se aplican
a una persona concreta.

El MDR indica que el software que proporciona informacion usada para
decisiones diagnosticas o terapeuticas entra, como regla general, en la regla
11. El nivel de riesgo puede elevar su clase.

Antes del piloto debe existir un informe breve que responda:

1. Cual es la finalidad prevista exacta de VitaMap.
2. Que funciones quedan dentro y fuera.
3. Que afirmaciones pueden publicarse.
4. Por que cada modulo no es producto sanitario o que ruta regulatoria sigue.
5. Como se controla que futuras funciones no cambien esa conclusion.

Debe revisarse especialmente:

- bandas de resultado de PHQ-9 y GAD-7;
- aviso automatico asociado a la pregunta 9 de PHQ-9;
- interpretacion de analiticas;
- correlaciones longitudinales;
- clasificador de crisis;
- expresiones publicas sobre "prevencion", "estado de salud" o
  "razonamiento clinico".

Ademas, la actividad profesional o comercial dirigida a determinar, curar o
aliviar enfermedades puede entrar en el ambito del `Heilpraktikergesetz`.
VitaMap no debe ofrecer actos medicos personalizados sin revisar tambien este
limite.

### 5.2 Reglamento de IA

Desde el 2 de febrero de 2025 se aplica la obligacion de alfabetizacion en IA.
Aunque el operador sea una sola persona, debe conservar una nota de formacion
y conocimiento sobre:

- capacidades y limites del modelo;
- sesgos y errores previsibles;
- uso de datos personales;
- supervision humana;
- respuesta ante incidentes;
- cambios de modelo, prompts y guardrails.

La evaluacion debe repetirse antes de cambiar de modelo o de dar una finalidad
medica al sistema.

## 6. Pagos, consumidores, empresa e impuestos

### 6.1 Antes del primer cobro real

El operador debe confirmar con `Gewerbeamt` y `Finanzamt`:

- forma juridica e identidad comercial;
- necesidad de `Gewerbeanmeldung`;
- alta fiscal y numeracion de facturas;
- aplicacion o no de la regla de pequeno empresario del apartado 19 UStG;
- tratamiento del IVA si se presta el servicio fuera de Alemania;
- conservacion de documentos contables;
- conveniencia de seguro de responsabilidad profesional/cibernetica.

Que los 18 EUR solo cubran el VPS no excluye la actividad economica. La
obligacion de declarar un negocio puede existir aunque no haya intencion de
obtener beneficio.

### 6.2 Informacion contractual

Antes de Checkout deben mostrarse claramente:

- identidad y contacto del proveedor;
- servicio concreto que se contrata;
- precio total de 6 EUR, impuestos incluidos cuando corresponda;
- periodicidad mensual y renovacion automatica;
- fecha y forma de cobro;
- duracion, cancelacion y momento en que termina el acceso;
- politica de cambios futuros de precio;
- derecho de desistimiento y formulario aplicable;
- acceso a condiciones guardables;
- limitaciones educativas y procedimiento de reclamacion.

El flujo debe producir una confirmacion del contrato en soporte duradero. El
boton final debe expresar inequivocamente la obligacion de pago. Stripe Checkout
ayuda, pero no sustituye la informacion que VitaMap debe presentar.

Para una suscripcion contratada en una web alemana debe evaluarse e implementar
el boton de cancelacion exigido por el apartado 312k BGB, permanentemente
visible y acompanado de confirmacion electronica. Borrar la cuenta no es un
sustituto adecuado de cancelar el contrato.

## 7. Cuando es necesaria asesoria externa

### Antes del primer usuario real y del primer pago

**No avanzar sin estas revisiones:**

- Abogado aleman de proteccion de datos/IT: DSFA, consentimiento, privacidad,
  proveedores, condiciones y proceso de incidentes.
- Especialista en productos sanitarios: finalidad prevista y clasificacion de
  los modulos actuales, en especial escalas e IA personalizada.
- `Steuerberater` o consulta fiscal inicial: alta, IVA, facturas y gastos.
- Evaluacion de delegado de proteccion de datos externo si la DSFA resulta
  obligatoria.

Para reducir costes, se puede preparar primero todo el expediente y contratar
una revision delimitada con preguntas concretas, no pedir que el abogado
descubra el proyecto desde cero.

### Consulta obligatoria antes de un cambio

Solicitar nueva revision antes de:

- activar una funcion de zona amarilla o roja;
- incorporar un proveedor que reciba datos o prompts;
- abrir el registro o superar el grupo controlado;
- tratar datos de menores;
- compartir resultados con profesionales;
- investigar, publicar o entrenar con datos de usuarios;
- operar en otro pais;
- cambiar de herramienta educativa a promesa medica.

### Consulta urgente

Contactar inmediatamente con abogado/DPO si:

- una persona ve datos de otra;
- se pierde una clave o copia de seguridad;
- el VPS, email administrativo o Stripe sufren acceso no autorizado;
- el modelo ofrece una recomendacion que puede causar dano;
- llega una reclamacion, requerimiento de autoridad o solicitud compleja;
- una persona comunica dano o dependencia de una respuesta de VitaMap.

## 8. Ajustes tecnicos para la primera etapa

### P0: bloquean la entrada de datos reales

| Ajuste | Estado observado el 2026-06-07 | Evidencia de cierre |
|---|---|---|
| Invitaciones verificadas en servidor | Implementado: codigo ligado a email, hash, caducidad, un solo uso y endpoint directo bloqueado | Prueba automatizada y comando administrativo |
| Control de suscripcion en servidor | Implementado: paginas, acciones y APIs sensibles exigen estado `active`; billing, ajustes, exportacion y borrado permanecen accesibles | Completar prueba end-to-end en VPS para active, pending, past_due y cancelled |
| Privacidad, Impressum, condiciones y desistimiento | Pendiente | Paginas publicadas y revision juridica fechada |
| Cancelacion independiente del borrado | Customer Portal integrado; falta activarlo/configurarlo en Stripe LIVE y validar juridicamente el flujo 312k | Cancelacion al final del periodo, confirmacion y webhook probados |
| Consentimiento con responsable y proveedores reales | Borrador actualizado en version `2026-06-08`; faltan identidad real, politica publicada, revision juridica y mecanismo de reconsentimiento | Version aprobada, reconsentimiento y registro |
| DSFA y registro Art. 30 | Pendiente | Documentos firmados y versionados |
| Clasificacion MDR por modulo | Pendiente | Informe profesional y matriz de funciones |
| MFA para operador y usuarios | Pendiente en VitaMap; la ADR exige completarlo antes del piloto real | Prueba de alta, recuperacion, dispositivo perdido y revocacion |
| Verificacion de email y recuperacion segura | Pendiente | Tests sin revelar existencia de cuentas |
| Cifrado del VPS verificado | Documentado, no probado en este repo | Acta de despliegue y prueba de reinicio |
| Restauracion y borrado en backups | Backup existe; falta prueba y politica de supresion | Simulacro y plazo de expiracion documentado |
| Procedimiento de incidentes de 72 h | Pendiente | Simulacro de mesa y contactos |
| Prueba de aislamiento entre usuarios | Parcial por rutas y carpetas | Tests automatizados de acceso cruzado |
| Desactivar modulos amarillos sin aprobacion | Pendiente | Feature flags cerrados por defecto |

### P1: completar antes de ampliar el piloto

- Limitacion de intentos de login, registro, chat y subida.
- Alertas de disponibilidad, espacio, backup fallido y errores de webhook.
- Politica de parches con fecha y responsable.
- Escaneo de dependencias y revision de imagenes Docker.
- `Content-Security-Policy` y revision de cabeceras.
- Sesiones mas cortas para acciones sensibles y reautenticacion.
- Rotacion probada de secretos y claves, con copia de recuperacion offline.
- Registro de accesos administrativos al VPS.
- Inventario de ficheros derivados: markdown, QMD, temporales OCR y caches.
- Comprobacion de que logs y errores no contienen salud, prompts o documentos.
- Eliminacion segura de temporales de OCR y extraccion.
- Reconciliacion documentada entre Stripe y la base local ante eventos
  rechazados, filas heredadas o fallos parciales.
- Reembolsos, disputas, final de periodo tras cancelacion y fin efectivo del
  acceso.
- Confirmacion de facturas, desistimiento, cambio de precio y fin de acceso.

### Observaciones sobre la arquitectura actual

1. Los PDF e imagenes originales se cifran por usuario con `age`, lo cual es
   positivo.
2. Los markdown derivados y los indices QMD permanecen legibles mientras el
   servidor esta encendido. LUKS protege el disco apagado, pero no sustituye
   permisos, aislamiento, control administrativo y minimizacion.
3. La cadena hash de auditoria detecta cambios accidentales o parciales, pero
   no es "inviolable": quien controla la base puede reescribir toda la cadena.
   Conviene anclar periodicamente el hash final fuera del VPS.
4. El borrado de cuenta debe cubrir originales, derivados, indices, inbox,
   temporales y la expiracion de copias. Los registros fiscales y de pago se
   conservan separados segun su obligacion legal.
5. El LLM local reduce transferencias a terceros, pero no elimina el riesgo de
   respuestas incorrectas ni la obligacion de evaluar el tratamiento.
6. El webhook valida la firma, comprueba el Price esperado, registra
   `event.id` para idempotencia, conserva la asociacion con el usuario y evita
   que eventos antiguos degraden estados o fechas mas recientes. Los ocho
   estados de suscripcion de Stripe se mapean a los estados locales. Todavia
   faltan reconciliacion operativa, reembolsos/disputas y pruebas en LIVE.
7. Los accesos a exportacion, cancelacion y borrado deben seguir disponibles
   aunque falle el pago; chat, memoria y subida deben quedar bloqueados.

## 9. Checklist de autorizacion del piloto

No marcar una casilla por intencion. Cada una debe enlazar a una evidencia.

### Legal y organizacion

- [ ] Operador, direccion, contacto y forma juridica definidos.
- [ ] Alta comercial/fiscal resuelta antes del primer cobro.
- [ ] Seguro evaluado.
- [ ] Finalidad prevista de VitaMap firmada.
- [ ] Informe MDR revisado por especialista.
- [ ] DSFA terminada y riesgo residual aceptado.
- [ ] Necesidad de DPO resuelta por escrito.
- [ ] Registro Art. 30 terminado.
- [ ] Contratos y proveedores revisados.
- [ ] Privacidad, consentimiento, Impressum y condiciones publicados.
- [ ] Desistimiento y cancelacion probados.

### Tecnica

- [x] Registro solo con invitacion valida.
- [ ] Acceso funcional solo con suscripcion valida.
- [ ] MFA y recuperacion probados.
- [ ] TLS, cifrado de disco y secretos verificados.
- [ ] Sin telemetria ni APIs externas con datos reales.
- [ ] Aislamiento cruzado cubierto por tests.
- [ ] Exportacion y borrado probados de extremo a extremo.
- [ ] Restauracion de backup probada.
- [ ] Plazo de eliminacion de backups probado.
- [ ] Logs revisados para impedir contenido sensible.
- [ ] Modulos amarillos desactivados o aprobados.
- [ ] Simulacro de incidente realizado.

### Con los tres participantes

- [ ] Invitacion individual y sesion informativa.
- [ ] Explicacion de limites y posibles errores de IA.
- [ ] Consentimiento libre, explicito y versionado.
- [ ] Canal humano para dudas, retirada e incidentes.
- [ ] Confirmacion contractual y recibo.
- [ ] Recordatorio de no usar VitaMap para urgencias.
- [ ] Fecha de inicio y fin del piloto.
- [ ] Entrevista final y borrado/exportacion elegidos por cada persona.

## 10. Regla de decision

```text
La funcion solo almacena, organiza o busca informacion del usuario?
  si -> zona verde, aplicar RGPD y seguridad
  no
  |
  calcula, interpreta, puntua, alerta o personaliza sobre salud?
    si -> detener activacion y revisar DSFA + MDR
    no
    |
    puede influir en diagnostico, tratamiento o una decision urgente?
      si -> no usar en el piloto educativo
      no -> documentar razonamiento y pruebas antes de activar
```

## 11. Fuentes oficiales principales

Consultadas o revisadas el 2026-06-08:

- [RGPD, Reglamento (UE) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [Consentimiento, BfDI](https://www.bfdi.bund.de/DE/Buerger/Inhalte/Allgemein/Datenschutz/Einwilligung.html)
- [Lista alemana de tratamientos sujetos a DSFA, DSK](https://www.datenschutzkonferenz-online.de/media/ah/20181017_ah_DSK_DSFA_Muss-Liste_Version_1.1_Deutsch.pdf)
- [Apartado 38 BDSG, delegado de proteccion de datos](https://www.gesetze-im-internet.de/bdsg_2018/__38.html)
- [Orientacion BfArM sobre aplicaciones medicas](https://www.bfarm.de/DE/Medizinprodukte/Aufgaben/Festellung-rechtlicher-Status-und-Klassifizierung/_artikel.html)
- [MDR, Reglamento (UE) 2017/745](https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32017R0745)
- [Heilpraktikergesetz](https://www.gesetze-im-internet.de/heilprg/)
- [Reglamento europeo de IA, Art. 4: alfabetizacion en IA](https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng)
- [Apartado 5 DDG, informacion del proveedor](https://www.gesetze-im-internet.de/ddg/__5.html)
- [Apartado 312j BGB, obligacion de pago](https://www.gesetze-im-internet.de/bgb/__312j.html)
- [Apartado 312k BGB, boton de cancelacion](https://www.gesetze-im-internet.de/bgb/__312k.html)
- [Apartado 355 BGB, desistimiento](https://www.gesetze-im-internet.de/bgb/__355.html)
- [Apartado 14 GewO, declaracion de actividad](https://www.gesetze-im-internet.de/gewo/__14.html)
- [Apartado 19 UStG, pequeno empresario](https://www.gesetze-im-internet.de/ustg_1980/__19.html)

## 12. Primera secuencia de trabajo recomendada

1. Congelar temporalmente la entrada de datos reales.
2. Escribir la finalidad prevista modulo por modulo.
3. Desactivar PHQ-9, GAD-7, crisis e interpretacion personalizada hasta su
   evaluacion.
4. Preparar DSFA, registro Art. 30 y mapa de proveedores.
5. Implementar invitaciones, control de suscripcion, MFA y cancelacion.
6. Redactar el paquete legal con identidad real.
7. Entregar el expediente a abogado, especialista MDR y asesor fiscal.
8. Corregir las observaciones y ejecutar un simulacro completo con datos
   ficticios.
9. Autorizar por escrito el piloto de tres personas.

La meta de la primera etapa no es demostrar que VitaMap puede hacerlo todo.
Es demostrar que puede custodiar algo delicado con limites claros, retirada
sencilla y una respuesta responsable cuando algo falla.
