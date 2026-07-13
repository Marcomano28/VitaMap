# Informe de backfill de idiomas · 13 de julio de 2026

Estado: inventario de solo lectura. No se ha modificado ninguna tarjeta.

## Resultado

La auditoría de `corpus-preparation/approved-current-structure` encontró:

- 354 tarjetas en 354 archivos Markdown recuperables;
- 0 tarjetas con `content_locale` explícito;
- 354 tarjetas legacy candidatas a revisión y backfill;
- 0 tarjetas sin `tarjeta_id`;
- 0 locales inválidos;
- 0 contratos multilingües parciales;
- 0 rendiciones duplicadas;
- idiomas de fuente: 317 `en`, 12 `es`, 3 `zh` y 22 sin declarar.

`source_language` no describe el idioma del cuerpo. Por eso esos recuentos no
se utilizan para decidir `content_locale`.

## Qué garantiza y qué no

La herramienta garantiza que el inventario no escribe archivos y que detecta
IDs ausentes, locales inválidos, contratos parciales y duplicados explícitos.

Para el informe se asume que el corpus legacy tiene cuerpo español, de acuerdo
con la arquitectura histórica y la auditoría previa. El script no pretende
detectar automáticamente el idioma natural de 354 textos; antes de aplicar el
backfill debe hacerse una comprobación editorial o por lotes de esa hipótesis.

## Backfill propuesto para una tarjeta legacy confirmada

```yaml
canonical_card_id: <mismo valor que tarjeta_id>
content_locale: es
localization_kind: original
localization_status: reviewed
editorial_schema_version: 1
```

Las tres tarjetas piloto con anchors usan `editorial_schema_version: 2`. El
backfill no debe convertir automáticamente una tarjeta clásica en v2.

## Condiciones antes de aplicar

1. Revisar que el cuerpo y el título estén realmente en español.
2. Hacer copia y comprobar que el repositorio y el corpus vivo del VPS están
   alineados.
3. Desplegar primero el contrato multilingüe y sus gates.
4. Ejecutar el cambio por lotes pequeños y volver a auditar después de cada uno.
5. Reindexar y ejecutar regresión de retrieval antes de continuar.

## Ejecución del informe

Desde `apps/web`:

```bash
npm run corpus:locale-audit
```

El comando rechaza `--apply`: esta primera herramienta es deliberadamente de
solo lectura.
