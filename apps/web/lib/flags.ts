/**
 * Interruptores de módulo por configuración.
 *
 * Cumple el requisito B.1 de la guía operativa del piloto: los módulos no
 * aprobados deben poder desactivarse por configuración. Por defecto APAGADO:
 * un módulo solo se enciende cuando su variable de entorno vale exactamente
 * "true". Cualquier otro valor (o ausencia) lo deja apagado.
 */

function isOn(value: string | undefined): boolean {
  return value === "true";
}

/**
 * Cuestionarios / escalas (`/assess`): PHQ-9, GAD-7 y constitución (prakriti).
 * Apagado hasta que la revisión por módulo de la sección B esté cerrada.
 */
export function assessmentsEnabled(): boolean {
  return isOn(process.env.ASSESSMENTS_ENABLED);
}

/**
 * Acceso cruzado supporter → sujeto de datos (ADR-018, Variante A).
 * Mientras esté apagado, resolveDataSubject deniega TODO acceso cruzado
 * aunque existan grants activos en la BD. Encender solo cuando el flujo
 * de supporters esté aprobado (estatutos + guía legal).
 */
export function supporterAccessEnabled(): boolean {
  return isOn(process.env.SUPPORTER_ACCESS_ENABLED);
}

/**
 * Modo demostración pública (ADR-020).
 *
 * Encendido, la instancia deja de comportarse como servicio y pasa a ser una
 * muestra de arquitectura: un visitante sin cuenta puede consultar al asistente
 * sobre un conjunto de datos **sintéticos y de solo lectura**, con las cuotas
 * de ADR-019. No se puede subir nada, no se registra nadie y no se cobra.
 *
 * No relaja ninguna garantía: el piloto con datos reales sigue tras las mismas
 * puertas del checklist de go-live, que este modo no toca porque no procesa
 * datos de salud de ninguna persona real.
 *
 * Apagado (por defecto) la aplicación funciona como el piloto de siempre.
 */
export function demoModeEnabled(): boolean {
  return isOn(process.env.DEMO_MODE);
}
