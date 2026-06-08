/**
 * Versión y texto del documento de consentimiento informado.
 *
 * Cuando se modifica el texto, INCREMENTAR `CONSENT_VERSION`. Los
 * usuarios existentes deben volver a aceptar la nueva versión antes de
 * seguir usando la herramienta.
 */

export const CONSENT_VERSION = "2026-06-01";

export const CONSENT_TEXT_ES = `
Información sobre el tratamiento de tus datos de salud

Responsable del tratamiento: el operador de esta instancia de VitaMap
(consulta el aviso legal del sitio para detalles concretos).

Finalidad: ofrecerte una herramienta educativa y reflexiva que te ayude
a entender patrones en tu propia información de salud. Esta plataforma
NO emite diagnósticos, NO recomienda tratamientos y NO sustituye la
consulta con un profesional sanitario.

Categorías de datos tratados: datos de identificación (email),
observaciones que tú decidas registrar, resultados de analíticas,
respuestas a cuestionarios validados, imágenes que tú subas y, en
general, datos de salud bajo el Art. 9 del RGPD.

Base legal: consentimiento explícito (Art. 9.2.a RGPD). Puedes retirar
tu consentimiento en cualquier momento desde la sección Ajustes, lo que
provoca el borrado inmediato de toda tu memoria.

Destinatarios: ninguno. Esta plataforma es auto-alojada en infraestructura
europea controlada por el operador. Tus datos no se ceden a terceros, ni
se utilizan para entrenar modelos. El asistente de IA se ejecuta dentro
del mismo servidor.

Plazo de conservación: mientras dure tu cuenta y tu consentimiento. Al
revocar consentimiento o eliminar tu cuenta, tu memoria se borra de
forma irreversible (los eventos de auditoría asociados al borrado se
conservan únicamente con identificadores pseudonimizados para acreditar
el cumplimiento del derecho al olvido).

Tus derechos: acceso, rectificación, supresión, oposición, limitación y
portabilidad. Puedes ejercerlos directamente desde la aplicación
(exportar memoria, eliminar cuenta) o escribiendo al responsable.

Reconocimientos obligatorios:
1. Confirmo que esta es una herramienta educativa, no un dispositivo
   médico, y que sus respuestas no constituyen consejo clínico.
2. Doy mi consentimiento explícito al tratamiento de mis datos de salud
   conforme al Art. 9.2.a RGPD en los términos descritos.
`.trim();

export const CONSENT_TEXT_DE = `
Informationen zur Verarbeitung deiner Gesundheitsdaten

Verantwortlicher: der Betreiber dieser VitaMap-Instanz
(konkrete Angaben findest du im Impressum dieser Website).

Zweck: Bereitstellung eines pädagogischen und reflektierenden Werkzeugs,
das dir hilft, Muster in deinen eigenen Gesundheitsinformationen besser
zu verstehen. Diese Plattform stellt KEINE Diagnosen, empfiehlt KEINE
Behandlungen und ersetzt KEINE Beratung durch medizinisches Fachpersonal.

Verarbeitete Datenkategorien: Identifikationsdaten (E-Mail-Adresse),
Beobachtungen, die du selbst einträgst, Laborergebnisse, Antworten auf
validierte Fragebögen, von dir hochgeladene Bilder und allgemein
Gesundheitsdaten im Sinne von Art. 9 DSGVO.

Rechtsgrundlage: ausdrückliche Einwilligung (Art. 9 Abs. 2 lit. a DSGVO).
Du kannst deine Einwilligung jederzeit im Bereich Einstellungen
widerrufen. Dadurch wird dein gesamter persönlicher Speicher gelöscht.

Empfänger: keine. Diese Plattform wird auf europäischer Infrastruktur
betrieben, die vom Betreiber kontrolliert wird. Deine Daten werden nicht
an Dritte weitergegeben und nicht zum Trainieren von Modellen verwendet.
Der KI-Assistent läuft auf demselben Server.

Speicherdauer: solange dein Konto und deine Einwilligung bestehen. Beim
Widerruf der Einwilligung oder beim Löschen deines Kontos wird dein
persönlicher Speicher unwiderruflich gelöscht. Mit der Löschung
verbundene Audit-Ereignisse werden ausschließlich mit pseudonymisierten
Kennungen aufbewahrt, um die Erfüllung des Löschanspruchs nachzuweisen.

Deine Rechte: Auskunft, Berichtigung, Löschung, Widerspruch,
Einschränkung der Verarbeitung und Datenübertragbarkeit. Du kannst diese
Rechte direkt in der Anwendung ausüben (Speicher exportieren, Konto
löschen) oder dich an den Verantwortlichen wenden.

Erforderliche Bestätigungen:
1. Ich bestätige, dass VitaMap ein pädagogisches Werkzeug und kein
   Medizinprodukt ist und dass seine Antworten keine medizinische
   Beratung darstellen.
2. Ich willige gemäß Art. 9 Abs. 2 lit. a DSGVO ausdrücklich in die
   Verarbeitung meiner Gesundheitsdaten zu den beschriebenen Bedingungen
   ein.
`.trim();

export function getConsentText(locale: "es" | "de"): string {
  return locale === "de" ? CONSENT_TEXT_DE : CONSENT_TEXT_ES;
}
