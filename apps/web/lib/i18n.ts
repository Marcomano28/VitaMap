export const LOCALES = ["es", "de"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_COOKIE = "vitamap_locale";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export const copy = {
  es: {
    nav: {
      memory: "Memoria",
      upload: "Subir",
      assess: "Cuestionarios",
      chat: "Conversar",
      requestAccess: "Solicitar acceso",
      login: "Acceder",
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
      loading: "Pensando... (puede tardar 15-30s sin GPU)",
      placeholder:
        "Pregunta lo que quieras explorar. Enter envía, Shift+Enter salto de línea.",
      send: "Enviar",
      blocked: "respuesta bloqueada por el guardrail",
      rewritten: "respuesta reescrita en estilo socrático por el guardrail",
      sources: "Fuentes consultadas",
    },
    disclaimer: {
      label: "Aviso:",
      text:
        "VitaMap es una herramienta educativa. No emite diagnósticos ni recomendaciones de tratamiento. No sustituye consulta con profesional sanitario cualificado.",
      inline:
        "Información educativa. No constituye diagnóstico ni recomendación clínica. Consulta con un profesional sanitario.",
    },
  },
  de: {
    nav: {
      memory: "Gedächtnis",
      upload: "Hochladen",
      assess: "Fragebögen",
      chat: "Gespräch",
      requestAccess: "Zugang anfragen",
      login: "Anmelden",
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
      loading: "Denkt nach... (kann ohne GPU 15-30s dauern)",
      placeholder:
        "Frage, was du erkunden möchtest. Enter sendet, Shift+Enter fügt einen Zeilenumbruch ein.",
      send: "Senden",
      blocked: "Antwort durch Guardrail blockiert",
      rewritten: "Antwort durch Guardrail in sokratischem Stil umgeschrieben",
      sources: "Genutzte Quellen",
    },
    disclaimer: {
      label: "Hinweis:",
      text:
        "VitaMap ist ein pädagogisches Werkzeug. Es stellt keine Diagnosen und gibt keine Behandlungsempfehlungen. Es ersetzt keine Beratung durch qualifiziertes medizinisches Fachpersonal.",
      inline:
        "Pädagogische Information. Keine Diagnose und keine klinische Empfehlung. Bitte sprich mit medizinischem Fachpersonal.",
    },
  },
} as const;
