# Datos sinteticos de prueba

Estos archivos son completamente ficticios y se usan solo para comprobar
VitaMap durante la Fase 0. No contienen datos de ninguna persona real y no
deben usarse para tomar decisiones medicas.

Prueba inicial:

1. Subir `analitica-sintetica-01.pdf` desde `/upload`.
2. Esperar a que el estado cambie a `Listo para revisar`.
3. Comprobar que fecha, laboratorio, valores, unidades y rangos coinciden.
4. Corregir manualmente cualquier error de OCR o extraccion.
5. Confirmar la incorporacion a la memoria.
6. Consultar los datos desde memoria y chat.
7. Exportar la cuenta y verificar el contenido.
8. Borrar el dato o la cuenta al terminar la prueba.

Valores esperados:

- Normales: hemoglobina, leucocitos, plaquetas, creatinina, HDL,
  trigliceridos y TSH.
- Altos: glucosa, colesterol total y LDL.
- Bajo: vitamina D.

## Serie longitudinal para visualizaciones

`longitudinal/` contiene cuatro informes de una misma persona ficticia. Los
tres primeros forman una serie comparable; el cuarto cambia LDL de mg/dL a
mmol/L para comprobar que VitaMap interrumpe la linea y no inventa una
conversion. Ver `longitudinal/README.md` para el recorrido de prueba completo.

## Suite de regresión del chat

`chat-regression-cases.json` recoge casos de comportamiento del asistente
(intención + comportamientos esperados) sobre esta analitica sintetica. Lo
exige ADR-014: los ajustes de prompt/guardrail se validan contra
`mistral-small-latest` durante el piloto y deben re-validarse contra el
Qwen3-4B local antes del blindaje final.
