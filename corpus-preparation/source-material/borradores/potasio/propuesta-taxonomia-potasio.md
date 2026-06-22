# Propuesta de taxonomía: potasio

Estado: borrador editorial histórico. No subir al corpus aprobado.

`potasio` ya está incorporado en `corpus-taxonomy.json` como marker canónico y
topic de laboratorio. Esta nota queda solo como rastro de revisión.

## Topic operativo

```json
{
  "potasio": {
    "dominio": "laboratorio",
    "tipo": ["analito", "mineral", "electrolito"],
    "marker": ["potasio"],
    "categoria": ["electrolitos", "minerales-micronutrientes"],
    "muestra": ["suero", "plasma"],
    "sistema": ["cardiovascular", "renal-urinario", "endocrino-metabolico"],
    "area_de_salud": ["salud-cardiovascular", "energia-fatiga", "rendimiento-deportivo"],
    "relacionado_con": [
      { "id": "creatinina", "relacion": "modifica_interpretacion" },
      { "id": "egfr", "relacion": "modifica_interpretacion" },
      { "id": "magnesio", "relacion": "modifica_interpretacion" }
    ]
  }
}
```

Nota: `sodio` no se enlaza todavía en `relacionado_con` hasta que exista como
marker canónico y tenga su propio dossier.
