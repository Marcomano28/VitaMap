---
name: curiosities-package
description: Entrega paquetes de tarjetas de curiosidad VitaMap por email o como documentos adjuntos en Hermes.
metadata:
  hermes:
    requires_toolsets: [file]
---

# Curiosities Package

## Uso

Usa esta skill al final del flujo, despues de `curiosities-validator`.

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
VitaMap Curiosidades - <tema> - tarjeta candidata
```

Cuerpo breve:

- archivos adjuntos;
- alcance de la tarjeta;
- certeza declarada;
- limite principal;
- ruta local.

No pegues las tarjetas completas en el cuerpo.

## Salida final

Responde solo:

```markdown
## Paquete generado
- Tema:
- Alcance:
- Archivos:
- Email enviado a:
- Curiosidad bloqueada: si/no
- Ruta:
- Limite que debe conservarse:
```

Si entregas por plataforma, incluye cada ruta absoluta en lineas separadas y
termina con:

```text
[[as_document]]
```
