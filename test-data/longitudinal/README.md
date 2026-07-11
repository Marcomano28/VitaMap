# Suite sintetica longitudinal

Cuatro informes completamente ficticios para probar la visualizacion temporal,
la extraccion OCR y la normalizacion de analiticas. No contienen datos reales y
no deben utilizarse para tomar decisiones medicas.

## Recorrido A - serie comparable

Subir, revisar y confirmar en este orden:

1. `analitica-longitudinal-01.pdf` - 2025-10-14
2. `analitica-longitudinal-02.pdf` - 2026-01-22
3. `analitica-longitudinal-03.pdf` - 2026-05-12

Los tres informes usan las mismas unidades. El LDL pasa de 151 a 145 y despues
a 139 mg/dL. VitaMap debe poder construir una linea temporal continua.

## Recorrido B - interrupcion deliberada

Despues del recorrido A, subir `analitica-longitudinal-04-unidad-distinta.pdf`.
Este informe expresa LDL en mmol/L. VitaMap debe conservar la medicion y su
procedencia, pero no unirla a la serie en mg/dL ni convertirla automaticamente.

## Casos adicionales cubiertos

- Rango bilateral: `70 - 99`.
- Rango unilateral: `< 116` y `< 3.0`.
- Marcador con porcentaje: HbA1c.
- Marcador inflamatorio que sube y vuelve a bajar: PCR.
- Rango de ferritina modificado por el laboratorio del cuarto informe.
- Laboratorios y fechas diferentes.

`expected.json` es la fuente de verdad de los valores esperados. Los `.txt` y
PDF se generan desde ese fichero con `scripts/generate-longitudinal-pdfs.py`.

Para regenerarlos:

```bash
python scripts/generate-longitudinal-pdfs.py
```
