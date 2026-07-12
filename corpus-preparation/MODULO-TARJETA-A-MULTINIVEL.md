# Módulo editorial · Tarjeta A multinivel

Versión 0.1 · 2026-07-12
Estado: contrato para borradores piloto; complementa `PROMPT-INVESTIGACION-RAG.md`

## 1. Cuándo se aplica

Este módulo se aplica únicamente cuando se pide expresamente una tarjeta A de
interpretación preparada para los tres niveles de lenguaje de VitaMap.

No sustituye el brief principal. Permanecen vigentes sus reglas de fuentes,
derechos, taxonomía, evidencia, límites, seguridad y formato de entrega. Si hay
conflicto, prevalece la regla más restrictiva.

No se aplica automáticamente a tarjetas B, C, D, E ni a capas tradicionales.

## 2. Una tarjeta, tres distancias

La tarjeta continúa respondiendo una sola intención: explicar qué mide un
marcador y cómo se interpreta de forma general. Los niveles cambian la
profundidad de presentación, no la intención, la evidencia ni la autoridad.

No se crean tres archivos. Se redacta una tarjeta con bloques H2 reconocibles
por la capa de composición.

## 3. Estructura obligatoria

Usa exactamente estos encabezados, en este orden y una sola vez:

```markdown
# [Título del parámetro]

## En una frase
[Definición literal breve, de una o dos frases.]

## Una imagen para empezar
[Metáfora opcional y breve, seguida dentro del mismo bloque por su anclaje.]

## Qué significa realmente
[Qué mide, cómo se obtiene y cómo se interpreta de forma general.]

## Cómo se relaciona
[Contexto, panel, prueba complementaria o factores que cambian la lectura.]

## Límites de la explicación
[Qué no permite concluir un valor aislado y dónde deja de servir la metáfora.]

## Si quieres profundizar
[Mecanismo, método, comparabilidad o matices de fuentes.]

## Fuentes
[Citas y URLs oficiales.]
```

`En una frase`, `Qué significa realmente`, `Límites de la explicación` y
`Fuentes` son obligatorios. `Una imagen para empezar`, `Cómo se relaciona` y
`Si quieres profundizar` deben incluirse en los pilotos; en futuras tarjetas
solo se incluirán cuando aporten contenido respaldado y diferente.

No añadas otros encabezados H2: quedarían fuera de la composición. Dentro de un
bloque se permiten H3, tablas, listas y enlaces cuando sean necesarios.

## 4. Contrato de cada profundidad

La aplicación compone los bloques así:

| Profundidad | Bloques |
|---|---|
| `discover` | En una frase + imagen + significado literal + límites + fuentes |
| `understand` | Lo anterior + cómo se relaciona |
| `deep` | Todos los bloques, incluido profundizar |

Los límites y las fuentes aparecen siempre. Una versión sencilla no debe perder
la frontera entre educación general y lectura individual.

## 5. Reglas para metáforas

Toda metáfora debe cumplir tres pasos:

1. **Imagen:** comparación reconocible y breve.
2. **Anclaje literal:** qué representa realmente.
3. **Límite:** dónde deja de funcionar.

La imagen no puede introducir una afirmación que la fuente no sostenga. Evita:

- presentar moléculas como personajes con voluntad;
- equiparar “fuera de rango” con daño;
- describir LDL y HDL como enemigos morales;
- sugerir que un mecanismo general está ocurriendo en esa persona;
- convertir un rango general en objetivo individual;
- usar una metáfora para encubrir incertidumbre.

El límite de la metáfora debe aparecer en `Límites de la explicación`, aunque
también puede anticiparse en el propio bloque visual.

## 6. Relación con QMD

QMD se utiliza para localizar y ordenar tarjetas. Su `bestChunk` no es la fuente
de la composición multinivel.

Después de seleccionar una tarjeta, VitaMap debe:

1. releer el Markdown completo desde el directorio autorizado del KB;
2. rechazar rutas externas, symlinks, extensiones no Markdown y tamaños no
   permitidos;
3. extraer los bloques por encabezados;
4. rechazar encabezados reconocidos duplicados o bloques obligatorios vacíos;
5. seleccionar únicamente los bloques de la profundidad solicitada.

Ordenar los bloques desde la puerta de entrada hasta el detalle mejora la
lectura y actúa como defensa adicional, pero no sustituye esta relectura.

## 7. Longitud

La tarjeta completa puede ocupar aproximadamente 500–900 palabras. Cada bloque
debe poder entenderse sin depender de que el usuario haya leído todos los
anteriores. Evita repetir rangos o cautelas literalmente en varios bloques.

## 8. Migración de una tarjeta existente

Cuando ya exista una tarjeta aprobada:

- no cambies `tarjeta_id`;
- conserva la intención y las fuentes válidas;
- no añadas afirmaciones nuevas solo para llenar un bloque;
- actualiza el contrato `evidence` y la dirección de relaciones si faltaban;
- prepara la nueva versión fuera de `approved-current-structure`;
- compara afirmación por afirmación con la versión publicada;
- sustitúyela únicamente después de revisión humana y prueba de recuperación;
- no presupongas que conservar `tarjeta_id` produce un reemplazo automático:
  el flujo administrativo debe comprobar y retirar la versión publicada
  anterior o implementar una sustitución atómica.

## 9. Checklist adicional

- [ ] Los siete encabezados están escritos exactamente una vez.
- [ ] La primera frase es literal, no metafórica.
- [ ] La metáfora tiene anclaje y límite.
- [ ] `discover` conserva límites y fuentes.
- [ ] Los rangos están atribuidos y no se presentan como objetivos personales.
- [ ] `Cómo se relaciona` no convierte `mismo_panel` en causalidad.
- [ ] `Si quieres profundizar` no introduce interpretación individual.
- [ ] El documento pasa el parser editorial y el lint de taxonomía.
