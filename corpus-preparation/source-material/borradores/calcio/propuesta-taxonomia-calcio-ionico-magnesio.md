# Propuesta de taxonomía: calcio iónico y magnesio

Estado: borrador editorial. No subir al corpus aprobado.

Notas:

- Alinea `categoria` y `area_de_salud` con los valores que ya usan la tarjeta de
  eje óseo `vitamina-d-calcio-fosfato-pth` y el topic `calcio` existente.
- `calcio-ionico` se propone como posible ampliación futura del topic `calcio`,
  no como topic separado.
- `magnesio` ya existe actualmente como marker canónico y topic del corpus.

## 1. Posible ampliación del topic `calcio`

```json
{
  "marker_a_anadir": ["calcio-ionico"],
  "alias_a_anadir": [
    "calcio ionico",
    "calcio ionizado",
    "calcio libre",
    "ionized calcium",
    "free calcium",
    "ionisiertes kalzium"
  ],
  "muestra_aplicable": ["suero", "plasma", "sangre-total"],
  "nota": "El calcio iónico mide la fracción libre/activa; por ahora se conserva como alias dentro del marker calcio para evitar abrir un nodo nuevo prematuro."
}
```

## 2. Nota sobre magnesio

`magnesio` ya está presente en `corpus-taxonomy.json` como analito/mineral:

```json
{
  "marker": ["magnesio"],
  "categoria": ["minerales-micronutrientes"],
  "area_de_salud": [
    "energia-fatiga",
    "salud-osea",
    "salud-cognitiva",
    "rendimiento-deportivo"
  ]
}
```

La tarjeta nueva de calcio no necesita proponer ese topic; solo enlazarlo.
