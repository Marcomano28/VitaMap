---
name: vitamap-package
description: Entrega paquetes Markdown VitaMap por email o como documentos adjuntos en Hermes.
metadata:
  hermes:
    requires_toolsets: [file]
---

# VitaMap Package

## Uso

Usa esta skill al final del flujo, despues de `vitamap-validator`.

## Procedimiento

1. Lee `MANIFEST.md`.
2. Confirma que existen las tarjetas `.md` y `MANIFEST.md`.
3. Si `email:himalaya` esta disponible y configurado, envia email con todos los
   `.md` como adjuntos.
4. Si el email falla o no esta disponible, responde con las rutas absolutas de
   los `.md` y agrega `[[as_document]]` para que Hermes los entregue como
   documentos descargables en la plataforma.

## Email

Asunto:

```text
VitaMap Ayurveda - <tema> - tarjetas candidatas
```

Cuerpo breve:

- archivos adjuntos;
- capas bloqueadas;
- advertencia principal;
- ruta local.

No pegues tarjetas completas en el cuerpo.

## Salida Final

Responde solo:

```markdown
## Paquete generado
- Tema:
- Archivos:
- Email enviado a:
- T1 bloqueada: si/no
- Ruta:
- Advertencia principal:
```

Si entregas por plataforma, incluye cada ruta absoluta en lineas separadas y
termina con:

```text
[[as_document]]
```
