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
