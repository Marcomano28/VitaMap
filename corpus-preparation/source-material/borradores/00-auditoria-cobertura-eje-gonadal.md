# Auditoría de cobertura — eje gonadal / esteroides sexuales

## Nota de taxonomía

No se adjuntó `corpus-preparation/corpus-taxonomy.json` en esta conversación. Por tanto, el facetado de estas tarjetas se entrega como **propuesta editorial provisional**, no como vocabulario canónico validado. Conviene reconciliar `marker`, `categoria`, `sistema`, `area_de_salud`, `alias` y `relacionado_con` con la taxonomía real antes de publicar.

## Propuesta de entrada o ampliación de taxonomía

```json
{
  "eje-gonadal": {
    "dominio": "laboratorio",
    "tipo": ["panel", "hormona"],
    "marker": [
      "testosterona-total",
      "testosterona-libre",
      "testosterona-biodisponible",
      "shbg",
      "estradiol",
      "lh",
      "fsh",
      "prolactina"
    ],
    "categoria": ["hormonas-sexuales", "perfil-gonadal"],
    "muestra": ["suero", "plasma", "saliva", "orina"],
    "sistema": ["endocrino-metabolico", "reproductivo", "osteoarticular"],
    "area_de_salud": ["salud-hormonal", "fertilidad", "salud-sexual", "salud-osea", "energia-fatiga"],
    "alias": [
      "testosterona",
      "testosterona total",
      "testosterona libre",
      "globulina fijadora de hormonas sexuales",
      "sex hormone binding globulin",
      "estradiol",
      "e2",
      "hormona luteinizante",
      "hormona foliculoestimulante",
      "prl"
    ],
    "relacionado_con": [
      { "id": "shbg", "relacion": "modifica_interpretacion" },
      { "id": "estradiol", "relacion": "lectura_conjunta" },
      { "id": "lh", "relacion": "eje_hipofisis_gonada" },
      { "id": "fsh", "relacion": "eje_hipofisis_gonada" },
      { "id": "prolactina", "relacion": "modifica_interpretacion" }
    ]
  }
}
```

## Mini-auditoría por tarjeta

### 1. Testosterona total

Grupo: eje gonadal / hormonas sexuales  
Estado en taxonomía: falta entrada adjunta; se propone `testosterona-total`.  
Tarjetas existentes revisadas: no consta lote previo adjunto para este eje.  
Hueco que se propone cubrir: interpretación individual de testosterona total, libre y biodisponible.  
Motivo de recuperación: “¿qué mide mi testosterona?”, “¿qué significa testosterona total?”, “¿por qué aparece libre o biodisponible?”.  
Facets base: marker `[testosterona-total]`, categoría `[hormonas-sexuales, perfil-gonadal]`, sistema `[endocrino-metabolico, reproductivo, osteoarticular]`, área `[salud-hormonal, fertilidad, salud-sexual, salud-osea, energia-fatiga]`, sección `interpretacion`.  
Relaciones necesarias: SHBG y albúmina como proteínas de unión; LH/FSH como eje de contexto.  
Fuente candidata: https://medlineplus.gov/lab-tests/testosterone-levels-test/  
Decisión: redactar.

### 2. SHBG

Grupo: transporte de hormonas sexuales.  
Estado en taxonomía: falta entrada adjunta; se propone `shbg`.  
Hueco que se propone cubrir: explicar por qué testosterona total y actividad hormonal pueden no coincidir.  
Motivo de recuperación: “¿qué es SHBG?”, “¿por qué mi testosterona total no explica mis síntomas?”, “¿qué relación tiene SHBG con testosterona y estradiol?”.  
Facets base: marker `[shbg]`, categoría `[hormonas-sexuales, perfil-gonadal]`, sistema `[endocrino-metabolico, reproductivo]`, área `[salud-hormonal, fertilidad, salud-sexual]`, sección `interpretacion`.  
Relaciones necesarias: testosterona total, testosterona libre, estradiol.  
Fuente candidata: https://medlineplus.gov/lab-tests/shbg-blood-test/  
Decisión: redactar.

### 3. Estradiol

Grupo: estrógenos / eje gonadal.  
Estado en taxonomía: falta entrada adjunta; se propone `estradiol`.  
Hueco que se propone cubrir: interpretación individual de estradiol dentro de los estrógenos.  
Motivo de recuperación: “¿qué mide el estradiol?”, “¿por qué miran estrógenos?”, “¿qué significa E2?”.  
Facets base: marker `[estradiol]`, categoría `[hormonas-sexuales, perfil-gonadal]`, sistema `[endocrino-metabolico, reproductivo, osteoarticular]`, área `[salud-hormonal, fertilidad, salud-osea]`, sección `interpretacion`.  
Relaciones necesarias: testosterona, SHBG, LH/FSH, ciclo menstrual/menopausia cuando aplique.  
Fuente candidata: https://medlineplus.gov/lab-tests/estrogen-levels-test/  
Decisión: redactar.

### 4. Prolactina

Grupo: hipófisis / eje gonadal.  
Estado en taxonomía: falta entrada adjunta; se propone `prolactina`.  
Hueco que se propone cubrir: modulador hipofisario que puede explicar problemas de libido, fertilidad o ciclo cuando se combina con otros datos.  
Motivo de recuperación: “¿por qué piden prolactina con hormonas sexuales?”, “¿qué significa PRL?”.  
Facets base: marker `[prolactina]`, categoría `[hormonas-hipofisarias, perfil-gonadal]`, sistema `[endocrino-metabolico, reproductivo]`, área `[salud-hormonal, fertilidad, salud-sexual]`, sección `interpretacion`.  
Relaciones necesarias: LH/FSH, testosterona, estradiol.  
Fuente candidata: https://medlineplus.gov/lab-tests/prolactin-levels/  
Decisión: redactar.

### 5. LH y FSH

Grupo: gonadotropinas.  
Estado en taxonomía: falta entrada adjunta; se propone `lh` y `fsh`.  
Hueco que se propone cubrir: lectura conjunta de señales hipofisarias.  
Motivo de recuperación: “¿por qué me han pedido LH y FSH juntos?”, “¿qué aportan respecto a testosterona o estradiol?”.  
Facets base: marker `[lh, fsh]`, categoría `[hormonas-hipofisarias, perfil-gonadal]`, sistema `[endocrino-metabolico, reproductivo]`, área `[salud-hormonal, fertilidad, salud-sexual]`, sección `lectura-conjunta`.  
Relaciones necesarias: estradiol, testosterona, progesterona según fuente.  
Fuente candidata: https://medlineplus.gov/lab-tests/luteinizing-hormone-lh-levels-test/  
Decisión: redactar.

### 6. Testosterona, SHBG y estradiol

Grupo: esteroides sexuales y proteínas de transporte.  
Estado en taxonomía: falta entrada adjunta; se propone panel relacional.  
Hueco que se propone cubrir: lectura conjunta de cantidad total, fracción disponible y estrógenos.  
Motivo de recuperación: “¿cómo leo testosterona con SHBG y estradiol?”, “¿por qué puede cambiar la testosterona libre?”.  
Facets base: marker `[testosterona-total, shbg, estradiol]`, categoría `[hormonas-sexuales, perfil-gonadal]`, sistema `[endocrino-metabolico, reproductivo, osteoarticular]`, área `[salud-hormonal, fertilidad, salud-sexual, salud-osea]`, sección `lectura-conjunta`.  
Relaciones necesarias: SHBG modifica interpretación de testosterona y estradiol.  
Fuente candidata: https://medlineplus.gov/lab-tests/shbg-blood-test/  
Decisión: redactar.

### 7. Eje gonadal completo

Grupo: hipófisis-gónadas-esteroides-prolactina.  
Estado en taxonomía: falta entrada adjunta; se propone panel `eje-gonadal`.  
Hueco que se propone cubrir: lectura conjunta de eje central y respuesta gonadal.  
Motivo de recuperación: “¿por qué me pidieron testosterona, estradiol, LH, FSH, SHBG y prolactina a la vez?”.  
Facets base: marker `[testosterona-total, estradiol, shbg, lh, fsh, prolactina]`, categoría `[perfil-gonadal]`, sistema `[endocrino-metabolico, reproductivo]`, área `[salud-hormonal, fertilidad, salud-sexual]`, sección `lectura-conjunta`.  
Relaciones necesarias: LH/FSH con estrogen/testosterone/progesterone; prolactina con ovarios/testículos/libido/fertilidad; SHBG con disponibilidad hormonal.  
Fuentes candidatas: MedlinePlus LH, FSH, SHBG, testosterona, estrógenos y prolactina.  
Decisión: redactar.

### 8. Seguimiento temporal

Grupo: hormonas sexuales seriadas.  
Estado en taxonomía: falta entrada adjunta; se propone tarjeta E transversal.  
Hueco que se propone cubrir: comparabilidad de mediciones, hora de extracción, ciclo, repetición y tendencia.  
Motivo de recuperación: “¿puedo comparar mis hormonas de dos analíticas?”, “¿importa la hora o el ciclo?”, “¿qué significa que suba o baje?”.  
Facets base: marker `[testosterona-total, estradiol, shbg, lh, fsh, prolactina]`, categoría `[perfil-gonadal]`, sistema `[endocrino-metabolico, reproductivo]`, área `[salud-hormonal, fertilidad, salud-sexual]`, sección `seguimiento`.  
Relaciones necesarias: testosterona matinal; estrógenos variables y tendencia; medicación que afecta SHBG.  
Fuente candidata: https://medlineplus.gov/lab-tests/testosterone-levels-test/ y fuentes complementarias MedlinePlus.  
Decisión: redactar.

## Huecos deliberadamente no cubiertos

- **DHEA-S**: se deja para un lote suprarrenal/andrógenos porque MedlinePlus lo sitúa principalmente en glándulas suprarrenales. Mezclarlo aquí ampliaría demasiado la intención.
- **Progesterona**: relacionada con LH/estrógenos y ciclo, pero no fue el foco de la solicitud. Puede producirse después si el corpus cubre ciclo, fertilidad o menopausia.
- **AMH**: útil en fertilidad/ovario, pero no cierra el eje testosterona–estradiol–SHBG.
- **Rangos numéricos**: no se añaden rangos de memoria. Las tarjetas remiten a laboratorio, edad, sexo, motivo de prueba y otros resultados.
