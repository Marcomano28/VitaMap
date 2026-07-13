# Reserva editorial · Pausa curiosa general

Estado: **borradores no publicables** · 2026-07-13

Esta carpeta conserva curiosidades sobre el cuerpo y la ciencia biomédica que
pueden ampliar la futura Pausa curiosa de VitaMap más allá de los marcadores de
laboratorio.

## Organización

- `estables/`: mecanismos o hechos consolidados que cambian lentamente;
- `frontera/`: hitos o resultados recientes que requieren fecha, revisión y
  límites más visibles;
- `PROPUESTA-TAXONOMIA.md`: vocabulario todavía no incorporado a
  `corpus-taxonomy.json`;
- `AUDITORIA-FUENTES.md`: procedencia, derechos y madurez de cada tarjeta.

## Regla de publicación

Todas las tarjetas de esta carpeta llevan `taxonomy_status: proposed`. El
administrador debe impedir su publicación mientras ese valor siga presente.
No deben copiarse a `approved-current-structure` ni subirse manualmente al VPS.

Para convertir una tarjeta en publicable hay que:

1. aprobar o ajustar su entrada en `corpus-taxonomy.json`;
2. sustituir `taxonomy_status: proposed` por `taxonomy_status: canonical`;
3. hacer revisión científica y editorial humana;
4. comprobar de nuevo la fuente, la fecha y los derechos;
5. en las tarjetas de frontera, revisar que el lenguaje no convierta un primer
   resultado en una aplicación clínica consolidada;
6. incorporarla explícitamente a la lista curada que puede mostrar la interfaz.

## Criterio editorial

La cifra más llamativa no gana automáticamente. Se han descartado afirmaciones
populares como «perdemos varios kilos de piel al año» o «todo el cuerpo se
renueva cada siete años», porque reducen poblaciones celulares muy diferentes a
un único número difícil de sostener.

Las tarjetas se muestran como texto editorial determinista: no leen analíticas,
memoria ni historial personal, y no deben ser reescritas por el modelo.
