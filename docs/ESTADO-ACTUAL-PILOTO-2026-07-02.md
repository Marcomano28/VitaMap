# Estado actual del piloto — 2026-07-02 (una página)

Instantánea tras la sesión de auditoría y remediación. Detalle en
`CHECKLIST-GO-LIVE-PILOTO-REAL.md`, `PLAN-REMEDIACION-BLOQUEANTES.md` y
`BORRADOR-TRANSFERENCIA-LLM-MISTRAL.md`.

## Cerrado hoy ✅

- **#3 · `next` parcheado** → 15.5.20 desplegado; `docker top` confirma
  `next-server` con UID 1000 (no-root); tests invitations/billing/auth-email en
  verde; logs sin errores de `better-auth`.
- **#5 · Billing reconciliado** → eran 1 LIVE + 2 TEST (sin cobro múltiple).
  Backup + `DELETE WHERE livemode=0` → una sola fila LIVE del admin.
- **#1 · Flags de módulo cerrados** → `ASSESSMENTS_ENABLED` y `KB_MARKER_SCOPE`
  a `false` (los 4 en false). Escalas PHQ/GAD desactivadas.
- **Email** → funciona desde producción; dominio autenticado (DKIM 1/2 + DMARC
  publicados y verificados con `dig`); sin enumeración de cuentas.
- **`web` no-root** → falso positivo del audit #5: ya baja a `node` vía `setpriv`.

## Decisiones ya documentadas (no son bloqueantes) 🧭

- **LLM external = Mistral** (FR/UE, `mistral-small-latest`) → **ADR-014**.
  Borradores de consentimiento/privacidad/Art.30 listos en
  `BORRADOR-TRANSFERENCIA-LLM-MISTRAL.md`. El chat envía memoria Art. 9 en hasta
  5 pasadas/turno; requiere DPA + ZDR antes de datos reales.
- **Cifrado de disco diferido** → **ADR-015** (Fase 2, riesgo aceptado con
  mitigaciones). Pendiente: que la DSFA acepte el riesgo residual.

## Pendiente — técnico (recomendado, no bloqueante duro) 🟡

- SSH endurecido (`PermitRootLogin`/`PasswordAuthentication`) + swap (paso 2).
- Prueba de **restauración** real de backup (integridad `restic check` OK; restore
  sin probar) + backup consistente de SQLite en caliente (audit #2).
- `/admin/corpus` 404 con cuenta autenticada no-admin (falta 2ª cuenta).
- Reintento del PDF sintético (11 marcadores) tras el despliegue.
- Confirmar payout de Stripe al IBAN; vigilar `period_end` (P1).
- Deliverability del email: warm-up para salir de spam; desactivar tracking de
  apertura (RGPD).

## Pendiente — legal (Frente C, BLOQUEA datos reales) 🔴

Requiere revisión profesional (guía legal §7). Nada de esto es código:

- DSFA/DPIA firmada · Registro Art. 30 · decisión DPO (§38 BDSG).
- Clasificación **MDR** por módulo (escalas, crisis, interpretación).
- Privacidad, Impressum, condiciones y desistimiento publicados.
- Consentimiento con responsable + encargados reales (incl. **DPA de Mistral +
  ZDR**) y mecanismo de reconsentimiento.
- Botón de cancelación **§312k BGB** separado del borrado.
- Contratos Art. 28 · procedimiento de brechas 72 h · nota de alfabetización IA.

## Puertas

- **Puerta 0** (solo sintético) — ✅ estable; admin en solitario.
- **Puerta 1** (técnica) — casi: faltan SSH+swap y verificaciones menores.
- **Puerta 2** (producción E2E) — falta restore real, aislamiento y borrado probados.
- **Puerta 3** (legal) — 🔴 el grueso del trabajo restante.
- **Puerta 4** (autorización escrita) + **Puerta 5** (invitar voluntarios 2 y 3).

**Titular:** el lado técnico está encaminado (3 bloqueantes cerrados hoy; los otros
2 son decisiones documentadas). El camino crítico a datos reales es ahora el
**Frente C (legal/regulatorio)** — y para eso los borradores de Mistral ya
adelantan trabajo.
