/**
 * Versión y texto del documento de consentimiento informado.
 *
 * Cuando se modifica el texto, INCREMENTAR `CONSENT_VERSION`. Los
 * usuarios existentes deben volver a aceptar la nueva versión antes de
 * seguir usando la herramienta.
 */

export const CONSENT_VERSION = "2026-06-08";

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

Bases legales propuestas: la cuenta y el servicio se gestionan conforme al
Art. 6.1.b RGPD; las obligaciones contables y fiscales conforme al Art.
6.1.c; y la seguridad del sistema conforme al Art. 6.1.f, tras la
ponderación correspondiente. El tratamiento de datos de salud se basa en
tu consentimiento explícito conforme a los Arts. 6.1.a y 9.2.a RGPD.
Puedes retirarlo en cualquier momento desde Ajustes. La retirada detiene
el tratamiento de salud y activa el borrado de tu memoria, sin eliminar
los registros contables que deban conservarse por obligación legal.

Encargados y destinatarios: Hetzner aloja el VPS europeo; Stripe procesa
los datos de cuenta y pago necesarios para la suscripción; las entidades
bancarias reciben los datos financieros necesarios para liquidación y
contabilidad. Si se habilitan backups externos, Backblaze B2 almacena
copias cifradas. Los proveedores de DNS, correo o soporte pueden tratar
datos de contacto, IP y metadatos técnicos según se detalle en la política
de privacidad. Stripe y los proveedores financieros no reciben documentos,
observaciones ni otros datos de salud. El asistente de IA se ejecuta en el
VPS y los datos no se utilizan para entrenar modelos externos.

Plazo de conservación: la memoria activa se conserva mientras dure tu
cuenta y tu consentimiento. Al revocarlo o eliminar la cuenta, se borra
del almacenamiento activo. Las copias cifradas quedan aisladas, no se
utilizan para ningún otro fin y expiran conforme a la política de
retención de backups publicada y probada. Los eventos de auditoría
asociados al borrado se conservan solo con identificadores
pseudonimizados; los registros fiscales y de pago se conservan durante
los plazos exigidos por la ley.

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

Vorgesehene Rechtsgrundlagen: Konto und Leistungserbringung beruhen auf
Art. 6 Abs. 1 lit. b DSGVO, gesetzlich erforderliche Buchhaltung auf Art.
6 Abs. 1 lit. c und Systemsicherheit auf Art. 6 Abs. 1 lit. f nach der
erforderlichen Interessenabwägung. Gesundheitsdaten werden auf Grundlage
deiner ausdrücklichen Einwilligung nach Art. 6 Abs. 1 lit. a und Art. 9
Abs. 2 lit. a DSGVO verarbeitet. Du kannst sie jederzeit unter
Einstellungen widerrufen. Der Widerruf beendet die Verarbeitung deiner
Gesundheitsdaten und löst die Löschung deines persönlichen Speichers aus;
gesetzlich aufzubewahrende Buchungsunterlagen bleiben davon getrennt.

Auftragsverarbeiter und Empfänger: Hetzner hostet den europäischen VPS;
Stripe verarbeitet die für Abonnement und Zahlung erforderlichen Konto-
und Zahlungsdaten. Banken erhalten die für Abrechnung und Buchhaltung
erforderlichen Finanzdaten. Falls externe Backups aktiviert werden,
speichert Backblaze B2 verschlüsselte Kopien. Anbieter für DNS, E-Mail
oder Support können Kontakt-, IP- und technische Metadaten verarbeiten,
wie in der Datenschutzerklärung beschrieben. Stripe und Finanzdienstleister
erhalten keine Dokumente, Beobachtungen oder sonstigen Gesundheitsdaten.
Der KI-Assistent läuft auf dem VPS; die Daten werden nicht zum Training
externer Modelle verwendet.

Speicherdauer: Der aktive persönliche Speicher bleibt bestehen, solange
dein Konto und deine Einwilligung bestehen. Nach Widerruf oder Löschung
des Kontos wird er aus dem aktiven Speicher entfernt. Verschlüsselte
Sicherungskopien bleiben isoliert, werden für keinen anderen Zweck
verwendet und verfallen nach der veröffentlichten und geprüften
Aufbewahrungsregel für Backups. Audit-Ereignisse zur Löschung werden nur
mit pseudonymisierten Kennungen aufbewahrt; steuerlich und handelsrechtlich
erforderliche Zahlungsunterlagen bleiben für die gesetzlichen Fristen
erhalten.

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
