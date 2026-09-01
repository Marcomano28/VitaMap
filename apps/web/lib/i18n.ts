import type { Locale } from "./language-contract";

export {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  isLocale,
  localeTag,
  type Locale,
} from "./language-contract";

export function localize<T extends Record<Locale, unknown>>(
  locale: Locale,
  values: T,
): T[Locale] {
  return values[locale];
}

export const copy = {
  es: {
    nav: {
      memory: "Memoria",
      map: "Mapa",
      upload: "Subir",
      assess: "Cuestionarios",
      chat: "Conversar",
      guide: "Guía",
      admin: "Corpus",
      subscription: "Suscripción",
      requestAccess: "Solicitar acceso",
      login: "Acceder",
      account: "Cuenta",
      settings: "Ajustes",
      logout: "Salir",
    },
    home: {
      eyebrow: "Herramienta educativa de salud",
      title: "Tu memoria de salud, bajo tu control.",
      body:
        "VitaMap reúne tus análisis, observaciones y valoraciones en una memoria privada cifrada, y un asistente reflexivo te ayuda a entender patrones contrastándolos con evidencia científica. Nunca diagnostica. Siempre cita la fuente.",
      primary: "Solicitar acceso al piloto",
      secondary: "Acceder",
      features: [
        {
          title: "Memoria propia",
          body:
            "Tus observaciones se guardan en una memoria privada que puedes exportar, revisar o borrar.",
        },
        {
          title: "Lectura con contexto",
          body:
            "El asistente mira tu historial y una base de evidencia para ayudarte a preparar mejores preguntas.",
        },
        {
          title: "Sin nube ajena",
          body:
            "El modelo corre en infraestructura controlada. Tus datos sensibles no se envían a proveedores externos.",
        },
        {
          title: "No diagnostica",
          body:
            "La herramienta es educativa y reflexiva. Te ayuda a ordenar información, no reemplaza a tu médico.",
        },
      ],
    },
    memory: {
      title: "Tu espacio de salud",
      body:
        "Guarda observaciones, analíticas, cuestionarios e imágenes para construir una memoria clara de tu salud. Puedes revisarla, exportarla o borrarla cuando quieras.",
      timeline: "Ver mi línea de tiempo",
      addEntries: "Añadir información",
      entries: [
        {
          href: "/upload",
          title: "Subir una analítica o documento",
          body:
            "Añade un PDF o una imagen para revisarlo antes de guardarlo en tu memoria.",
        },
        {
          href: "/assess",
          title: "Completar un cuestionario",
          body:
            "Registra escalas como PHQ-9 o GAD-7 y sigue su evolución con el tiempo.",
        },
        {
          href: "/observation/new",
          title: "Anotar una observación",
          body:
            "Sueño, dolor, energía, ánimo o cualquier detalle que quieras recordar.",
        },
        {
          href: "/image/new",
          title: "Guardar una imagen",
          body:
            "Conserva fotos relevantes de forma privada, sin análisis automático.",
        },
      ],
    },
    chat: {
      title: "Conversar",
      body:
        "Asistente reflexivo. Lee tu memoria personal y la base de evidencia. Cada afirmación va con su fuente.",
      empty:
        "Escribe una pregunta sobre tu propia salud. El asistente leerá fragmentos relevantes de tu memoria y de la base de evidencia, y responderá citando cada fuente. Nunca diagnostica.",
      // Variantes del modo demostración (ADR-020): los datos no son de quien
      // pregunta, sino de una persona ficticia. Decir "tu memoria" ahí sería
      // sencillamente falso.
      bodyDemo:
        "Asistente reflexivo. Lee la analítica ficticia de la demostración y la base de evidencia. Cada afirmación va con su fuente.",
      emptyDemo:
        "Pregunta sobre los valores de la analítica ficticia — por ejemplo, qué significa tener el LDL alto o la vitamina D baja. El asistente leerá fragmentos de esos datos y de la base de evidencia, y responderá citando cada fuente. Nunca diagnostica.",
      loading: "Consultando memoria y preparando una respuesta...",
      placeholder:
        "Pregunta lo que quieras explorar. Enter envía, Shift+Enter salto de línea.",
      send: "Enviar",
      depthLabel: "Profundidad",
      depth: {
        discover: "Fácil",
        understand: "Comprender",
        deep: "Detalle",
      },
      simpler: "Más sencillo",
      moreDetail: "Más detalle",
      openCuriosity: "Abrir una curiosidad",
      openingCuriosity: "Abriendo una curiosidad…",
      relatedCuriosity: "Relacionada con este tema",
      generalCuriosity: "Una ventana distinta",
      curiositySource: "Fuente",
      exploreThis: "Explorar esto",
      backToTopic: "Volver al tema",
      exploreCuriosity: "Cuéntame más sobre esta curiosidad",
      noCuriosity: "No queda otra curiosidad revisada disponible en esta sesión.",
      blocked: "respuesta bloqueada por el guardrail",
      rewritten: "respuesta reescrita en estilo socrático por el guardrail",
      sources: "Fuentes consultadas",
      requestFailed:
        "No se pudo obtener una respuesta. Inténtalo de nuevo en unos segundos.",
      requestTimedOut:
        "La respuesta tardó demasiado y se canceló. Inténtalo de nuevo con una pregunta más concreta.",
    },
    disclaimer: {
      label: "Aviso:",
      text:
        "VitaMap es una herramienta educativa. No emite diagnósticos ni recomendaciones de tratamiento. No sustituye consulta con profesional sanitario cualificado.",
      inline:
        "Información educativa. No constituye diagnóstico ni recomendación clínica. Consulta con un profesional sanitario.",
    },
    vitawende: {
      crystalSub: "Memoria · Evidencia · Preguntas",
      // Subtítulo alternativo cuando el visitante entra a la demostración
      // (DEMO_MODE, ADR-020): promete lo que hay, ni más ni menos.
      crystalSubDemo: "Demostración · Datos ficticios",
      nav: {
        semilla: "La semilla",
        manifiesto: "Manifiesto",
        centros: "Los centros",
      },
    },
    guide: {
      title: "¿Por dónde empiezo?",
      intro:
        "No hace falta saber nada técnico ni médico para usar VitaMap. Esta página explica qué documentos son útiles, cómo conseguirlos y qué hace la herramienta con ellos.",
      blocks: [
        {
          heading: "Qué documentos son útiles",
          body: "Cualquier cosa que tu médico, laboratorio u hospital te haya dado en algún momento:",
          items: [
            "Analíticas de sangre u orina",
            "Informes de consultas con especialistas",
            "Informes de alta tras un ingreso hospitalario",
            "Historial de medicación actual o pasada",
            "Resultados de pruebas de imagen (el informe escrito, no la imagen)",
            "Carnet de vacunación",
          ],
          note: "No hace falta tenerlos todos. Empieza por lo que tengas a mano.",
        },
        {
          heading: "Cómo conseguir los que no tienes",
          body: "Tienes derecho a pedir copias de todo tu historial médico. Algunas vías concretas:",
          items: [
            "Tu médico de cabecera puede darte un resumen de tu historial si se lo pides en consulta.",
            "Cualquier hospital está obligado a enviarte el informe de un ingreso anterior si lo solicitas por escrito.",
            "Si tienes seguro público en Alemania (AOK, TK, Barmer, DAK u otra): entra en la app de tu aseguradora, busca la sección «ePA» o «Meine Gesundheitsdaten», y descarga tu historial completo. Suele ser un botón visible desde el menú principal.",
            "Si tienes seguro privado: contacta con tu aseguradora y pide la exportación de tu historial en formato digital.",
          ],
          note: "Si tienes dudas con la app de tu aseguradora, el servicio de atención al cliente puede guiarte paso a paso por teléfono.",
        },
        {
          heading: "Qué hace VitaMap con esos documentos",
          body: "Cuando subes un documento, esto es exactamente lo que ocurre:",
          items: [
            "El archivo se cifra en cuanto llega al servidor — nadie más puede leerlo.",
            "Un proceso automático intenta leer los valores del documento (fechas, resultados, marcadores). Tú revisas esa lectura antes de confirmarla.",
            "Una vez confirmado, los datos pasan a tu memoria personal. El asistente puede referirse a ellos cuando le hagas preguntas.",
            "El documento original cifrado se conserva en tu carpeta. Puedes borrarlo cuando quieras.",
          ],
          note: "Nada de lo que subes sale de tu servidor. No se envía a ningún servicio externo ni se usa para entrenar ningún modelo.",
        },
        {
          heading: "Lo que no hace falta hacer",
          body: "",
          items: [
            "No hace falta digitalizar todos los documentos de golpe. Empieza con uno.",
            "No hace falta entender los valores médicos para subirlos — el asistente te ayuda a interpretarlos.",
            "No hace falta que los documentos sean perfectos ni recientes.",
            "No hace falta ningún conocimiento técnico.",
          ],
          note: "",
        },
      ],
      uploadCta: "Subir mi primer documento",
    },
  },
  de: {
    nav: {
      memory: "Gedächtnis",
      map: "Karte",
      upload: "Hochladen",
      assess: "Fragebögen",
      chat: "Gespräch",
      guide: "Leitfaden",
      admin: "Korpus",
      subscription: "Abonnement",
      // "Zugang anfragen" desbordaba la barra en modo demostración, donde hay
      // cinco enlaces más. "Zugang" junto a "Anmelden" se entiende igual.
      requestAccess: "Zugang",
      login: "Anmelden",
      account: "Konto",
      settings: "Einstellungen",
      logout: "Abmelden",
    },
    home: {
      eyebrow: "Pädagogisches Gesundheitstool",
      title: "Deine Gesundheitsdaten, unter deiner Kontrolle.",
      body:
        "VitaMap sammelt Analysen, Beobachtungen und Einschätzungen in einem privaten, verschlüsselten Gedächtnis. Ein reflektierender Assistent hilft dir, Muster zu erkennen und mit wissenschaftlicher Evidenz abzugleichen. Keine Diagnosen. Immer mit Quellen.",
      primary: "Zugang zum Piloten anfragen",
      secondary: "Anmelden",
      features: [
        {
          title: "Eigene Erinnerung",
          body:
            "Deine Beobachtungen liegen in einem privaten Bereich, den du exportieren, prüfen oder löschen kannst.",
        },
        {
          title: "Lesen mit Kontext",
          body:
            "Der Assistent betrachtet deine Historie und eine Evidenzbasis, damit du bessere Fragen vorbereiten kannst.",
        },
        {
          title: "Keine fremde Cloud",
          body:
            "Das Modell läuft auf kontrollierter Infrastruktur. Sensible Daten werden nicht an externe Anbieter gesendet.",
        },
        {
          title: "Keine Diagnose",
          body:
            "Das Werkzeug ist pädagogisch und reflektierend. Es ordnet Informationen, ersetzt aber keine ärztliche Beratung.",
        },
      ],
    },
    memory: {
      title: "Dein Gesundheitsbereich",
      body:
        "Speichere Beobachtungen, Laborwerte, Fragebögen und Bilder, um eine klare persönliche Gesundheitschronik aufzubauen. Du kannst sie jederzeit prüfen, exportieren oder löschen.",
      timeline: "Meine Zeitlinie ansehen",
      addEntries: "Information hinzufügen",
      entries: [
        {
          href: "/upload",
          title: "Laborwert oder Dokument hochladen",
          body:
            "Füge ein PDF oder Bild hinzu und prüfe es, bevor es in deiner Erinnerung gespeichert wird.",
        },
        {
          href: "/assess",
          title: "Fragebogen ausfüllen",
          body:
            "Erfasse Skalen wie PHQ-9 oder GAD-7 und beobachte die Entwicklung über die Zeit.",
        },
        {
          href: "/observation/new",
          title: "Beobachtung notieren",
          body:
            "Schlaf, Schmerz, Energie, Stimmung oder alles, was du festhalten möchtest.",
        },
        {
          href: "/image/new",
          title: "Bild speichern",
          body:
            "Bewahre relevante Fotos privat auf, ohne automatische Auswertung.",
        },
      ],
    },
    chat: {
      title: "Gespräch",
      body:
        "Reflektierender Assistent. Er liest deine persönliche Erinnerung und die Evidenzbasis. Jede Aussage wird mit Quelle angezeigt.",
      empty:
        "Stelle eine Frage zu deiner eigenen Gesundheit. Der Assistent liest relevante Ausschnitte aus deiner Erinnerung und der Evidenzbasis und antwortet mit Quellen. Er stellt keine Diagnosen.",
      bodyDemo:
        "Reflektierender Assistent. Er liest die fiktiven Laborwerte der Demonstration und die Evidenzbasis. Jede Aussage wird mit Quelle angezeigt.",
      emptyDemo:
        "Fragen Sie nach den Werten der fiktiven Laboranalyse — etwa, was ein erhöhtes LDL oder ein niedriger Vitamin-D-Wert bedeutet. Der Assistent liest Ausschnitte aus diesen Daten und der Evidenzbasis und antwortet mit Quellen. Er stellt keine Diagnosen.",
      loading: "Durchsucht den Speicher und bereitet eine Antwort vor...",
      placeholder:
        "Frage, was du erkunden möchtest. Enter sendet, Shift+Enter fügt einen Zeilenumbruch ein.",
      send: "Senden",
      depthLabel: "Tiefe",
      depth: {
        discover: "Einfach",
        understand: "Verstehen",
        deep: "Details",
      },
      simpler: "Einfacher",
      moreDetail: "Mehr Details",
      openCuriosity: "Eine Entdeckung öffnen",
      openingCuriosity: "Entdeckung wird geöffnet…",
      relatedCuriosity: "Mit diesem Thema verbunden",
      generalCuriosity: "Ein anderes Fenster",
      curiositySource: "Quelle",
      exploreThis: "Weiter erkunden",
      backToTopic: "Zurück zum Thema",
      exploreCuriosity: "Erzähle mir mehr über diese Entdeckung",
      noCuriosity: "In dieser Sitzung ist keine weitere geprüfte Entdeckung verfügbar.",
      blocked: "Antwort durch Guardrail blockiert",
      rewritten: "Antwort durch Guardrail in sokratischem Stil umgeschrieben",
      sources: "Genutzte Quellen",
      requestFailed:
        "Es konnte keine Antwort geladen werden. Bitte versuche es in einigen Sekunden erneut.",
      requestTimedOut:
        "Die Antwort hat zu lange gedauert und wurde abgebrochen. Versuche es erneut mit einer konkreteren Frage.",
    },
    disclaimer: {
      label: "Hinweis:",
      text:
        "VitaMap ist ein pädagogisches Werkzeug. Es stellt keine Diagnosen und gibt keine Behandlungsempfehlungen. Es ersetzt keine Beratung durch qualifiziertes medizinisches Fachpersonal.",
      inline:
        "Pädagogische Information. Keine Diagnose und keine klinische Empfehlung. Bitte sprich mit medizinischem Fachpersonal.",
    },
    vitawende: {
      crystalSub: "Gedächtnis · Evidenz · Fragen",
      crystalSubDemo: "Demonstration · Fiktive Daten",
      nav: {
        semilla: "Der Samen",
        manifiesto: "Manifest",
        centros: "Die Zentren",
      },
    },
    guide: {
      title: "Wo fange ich an?",
      intro:
        "Für VitaMap sind keine technischen oder medizinischen Vorkenntnisse nötig. Diese Seite erklärt, welche Unterlagen hilfreich sind, wie du sie bekommst und was das Tool damit macht.",
      blocks: [
        {
          heading: "Welche Unterlagen sind nützlich",
          body: "Alles, was dir dein Arzt, Labor oder Krankenhaus je ausgehändigt hat:",
          items: [
            "Blut- oder Urinuntersuchungen",
            "Befundberichte von Fachärzten",
            "Entlassungsbriefe nach einem Krankenhausaufenthalt",
            "Aktuelle oder frühere Medikationspläne",
            "Bildgebungsberichte (der schriftliche Befund, nicht das Bild selbst)",
            "Impfpass",
          ],
          note: "Du musst nicht alles haben. Fang mit dem an, was gerade griffbereit ist.",
        },
        {
          heading: "Wie du fehlende Unterlagen bekommst",
          body: "Du hast das Recht, deine gesamte Krankengeschichte anzufordern. Konkrete Wege:",
          items: [
            "Dein Hausarzt kann dir auf Anfrage eine Zusammenfassung deiner Krankengeschichte geben.",
            "Jedes Krankenhaus ist verpflichtet, dir den Entlassungsbrief eines früheren Aufenthalts auf schriftliche Anfrage zuzusenden.",
            "Bei gesetzlicher Krankenversicherung (AOK, TK, Barmer, DAK usw.): Öffne die App deiner Krankenkasse, suche den Bereich «ePA» oder «Meine Gesundheitsdaten» und lade deine komplette Akte herunter. Der Knopf dafür ist meist im Hauptmenü sichtbar.",
            "Bei privater Krankenversicherung: Kontaktiere deine Versicherung und bitte um einen digitalen Export deiner Krankenakte.",
          ],
          note: "Wenn du mit der App deiner Krankenkasse nicht weiterkommst, hilft dir der telefonische Kundenservice Schritt für Schritt.",
        },
        {
          heading: "Was VitaMap mit diesen Unterlagen macht",
          body: "Wenn du ein Dokument hochlädst, passiert genau Folgendes:",
          items: [
            "Die Datei wird sofort beim Eingang verschlüsselt — niemand sonst kann sie lesen.",
            "Ein automatischer Prozess versucht, die Werte im Dokument zu lesen (Daten, Ergebnisse, Marker). Du prüfst diese Auswertung, bevor du sie bestätigst.",
            "Nach der Bestätigung gehen die Daten in dein persönliches Gedächtnis. Der Assistent kann darauf Bezug nehmen, wenn du Fragen stellst.",
            "Das verschlüsselte Original bleibt in deinem Bereich. Du kannst es jederzeit löschen.",
          ],
          note: "Alles, was du hochlädst, verlässt deinen Server nicht. Es wird weder an externe Dienste gesendet noch zum Training eines Modells verwendet.",
        },
        {
          heading: "Was du nicht tun musst",
          body: "",
          items: [
            "Du musst nicht alle Unterlagen auf einmal digitalisieren. Fang mit einer an.",
            "Du musst die Laborwerte nicht verstehen, um sie hochzuladen — der Assistent hilft dir dabei.",
            "Die Unterlagen müssen nicht vollständig oder aktuell sein.",
            "Es sind keine technischen Kenntnisse erforderlich.",
          ],
          note: "",
        },
      ],
      uploadCta: "Mein erstes Dokument hochladen",
    },
  },
} as const;
