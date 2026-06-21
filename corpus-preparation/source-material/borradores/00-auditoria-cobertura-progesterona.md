# Auditoría de cobertura — progesterona y eje gonadal

Grupo: eje-gonadal / progesterona  
Estado en taxonomía: falta `corpus-taxonomy.json` adjunto; se propone facetado compatible con el vocabulario usado en el brief y con el lote previo de eje gonadal.  
Tarjetas existentes revisadas: lote previo de eje gonadal con testosterona total, SHBG, estradiol, prolactina, LH/FSH, lectura conjunta y seguimiento temporal.  
Hueco que se propone cubrir: progesterona como marcador propio y como pieza de lectura conjunta con estradiol, LH/FSH y ciclo menstrual/embarazo.  
Motivo de recuperación: consultas como “¿qué significa mi progesterona?”, “¿por qué se mide progesterona con estradiol?”, “¿cómo sé si ovulé?”, “¿se puede comparar progesterona entre días del ciclo?” o “¿qué aporta progesterona al eje gonadal?”.  

## Propuesta de entrada o ampliación de taxonomía

```json
{
  "progesterona": {
    "dominio": "laboratorio",
    "tipo": ["analito", "hormona"],
    "marker": ["progesterona"],
    "categoria": ["hormonas-sexuales", "eje-gonadal"],
    "muestra": ["suero", "plasma"],
    "sistema": ["endocrino-metabolico", "reproductor"],
    "area_de_salud": ["salud-hormonal", "fertilidad", "salud-reproductiva"],
    "alias": [
      "progesterone",
      "progesterona serica",
      "progesterona en sangre",
      "p4",
      "PGSN",
      "luteal progesterone",
      "progesteron"
    ],
    "relacionado_con": [
      { "id": "estradiol", "relacion": "lectura_conjunta" },
      { "id": "lh", "relacion": "lectura_conjunta" },
      { "id": "fsh", "relacion": "lectura_conjunta" },
      { "id": "prolactina", "relacion": "modifica_interpretacion" },
      { "id": "testosterona-total", "relacion": "mismo_eje" },
      { "id": "shbg", "relacion": "mismo_eje" }
    ]
  }
}
```

## Decisiones editoriales

### 1. Redactar tarjeta A
**Decisión:** sí.  
**Archivo:** `progesterona-interpretacion-medlineplus.md`  
**Fuente candidata:** MedlinePlus Medical Test — Progesterone Test.  
**Motivo:** la fuente define qué mide la prueba, para qué se usa, qué factores cambian la interpretación y por qué un resultado depende del ciclo menstrual o embarazo.

### 2. Redactar tarjeta D: progesterona + estradiol
**Decisión:** sí.  
**Archivo:** `progesterona-estradiol-ciclo-menstrual-lectura-conjunta-medlineplus.md`  
**Fuente candidata:** MedlinePlus Progesterone Test + MedlinePlus Estrogen Levels Test.  
**Motivo:** progesterona y estradiol se alternan dentro del ciclo: MedlinePlus explica que estrógeno engrosa el endometrio en la primera mitad del ciclo y progesterona prepara el endometrio en la segunda mitad.

### 3. Redactar tarjeta D: progesterona + LH/FSH
**Decisión:** sí.  
**Archivo:** `progesterona-lh-fsh-ovulacion-lectura-conjunta-medlineplus.md`  
**Fuente candidata:** MedlinePlus Progesterone Test + MedlinePlus LH + MedlinePlus FSH.  
**Motivo:** MedlinePlus indica que la progesterona puede ayudar a ver si los ovarios liberan óvulos normalmente, y que LH/FSH trabajan juntas para controlar desarrollo sexual y reproducción.

### 4. Redactar tarjeta D: eje gonadal con progesterona
**Decisión:** sí, como extensión del lote previo.  
**Archivo:** `eje-gonadal-con-progesterona-lectura-conjunta-medlineplus.md`  
**Motivo:** progesterona completa la lectura del eje ya creado: hipófisis, ovario/testículo, esteroides sexuales y moduladores.

### 5. Redactar tarjeta E
**Decisión:** sí.  
**Archivo:** `progesterona-seguimiento-temporal-medlineplus.md`  
**Fuente candidata:** MedlinePlus Progesterone Test.  
**Motivo:** la fuente declara expresamente que los niveles cambian durante el ciclo menstrual y el embarazo y que puede ser necesario medir varias veces.

## Huecos no cubiertos

- `17-hidroxiprogesterona`: no se incluye en este lote porque es otro analito y abre el eje suprarrenal/congénito, especialmente hiperplasia suprarrenal congénita. Debe tratarse en lote separado.
- `AMH`: no se incluye porque abre reserva ovárica/fertilidad.
- `progesterona en saliva`: no se incluye porque la fuente principal elegida es prueba sanguínea de MedlinePlus.
- `rangos por fase del ciclo`: no se añaden porque MedlinePlus no publica rangos numéricos generales en la página principal y el brief indica no inventarlos.

## Fuentes principales verificadas

- MedlinePlus Medical Test: Progesterone Test. https://medlineplus.gov/lab-tests/progesterone-test/
- MedlinePlus Medical Test: Estrogen Levels Test. https://medlineplus.gov/lab-tests/estrogen-levels-test/
- MedlinePlus Medical Test: Luteinizing Hormone (LH) Levels Test. https://medlineplus.gov/lab-tests/luteinizing-hormone-lh-levels-test/
- MedlinePlus Medical Test: Follicle-Stimulating Hormone (FSH) Levels Test. https://medlineplus.gov/lab-tests/follicle-stimulating-hormone-fsh-levels-test/
- MedlinePlus: Linking to and Using Content from MedlinePlus. https://medlineplus.gov/about/using/usingcontent/

## Derechos

Las páginas utilizadas pertenecen a `Medical test information` de MedlinePlus. La página de uso de contenido de MedlinePlus indica que la información de pruebas médicas forma parte del contenido de dominio público producido por NLM. Se marca `rights_status: permitted`.
