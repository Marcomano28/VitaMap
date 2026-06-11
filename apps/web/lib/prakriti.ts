/**
 * Cuestionario de constitución ayurvédica (prakriti).
 *
 * 20 ítems en 3 niveles de peso, inspirado en la metodología CCRAS PAS
 * (Prasher et al. AYU 2022; SOP CCRAS 2023) y los textos clásicos de dominio público:
 * Caraka Saṃhitā Vimānasthāna 8.95–98 y Suśruta Saṃhitā Śārīrasthāna 4.
 *
 * Pesos por dominio (κ = kappa interevaluador publicado en estudios CCRAS):
 *   2   → físico observable  (κ ≥ 0.78; ojos κ=0.899, constitución κ=0.885)
 *   1.5 → fisiológico regulatorio
 *   1   → conductual / psicológico
 *
 * Clasificación basada en porcentajes ponderados:
 *   tridóshico  si (max% − mín%) ≤ 15
 *   bidóshico   si (1º% − 2º%) ≤ 10  con spread > 15
 *   monodóshico en el resto
 *
 * FONDO, no figura: retrato de constitución tradicional según el Ayurveda.
 * NO reproduce el CCRAS PAS (derechos reservados al Director General CCRAS).
 * NO es un instrumento clínico validado ni mide ni predice biomarcadores.
 * La priorización figura-fondo la resuelve el LLM en el chat; aquí solo
 * etiquetamos el dato como tradición al guardarlo en memoria.
 */

import type { Locale } from "@/lib/i18n";
import { localize } from "@/lib/i18n";

export type Dosha = "vata" | "pitta" | "kapha";
export const DOSHAS: readonly Dosha[] = ["vata", "pitta", "kapha"] as const;

export interface PrakritiItem {
  id: string;
  prompt: string;
  options: { dosha: Dosha; label: string }[];
}

export interface PrakritiProfile {
  counts: Record<Dosha, number>;
  percentages: Record<Dosha, number>;
  dominant: Dosha;
  secondary: Dosha | null;
  /** Etiqueta legible: "Vāta", "Vāta-Pitta", "Tridóshico". */
  type: string;
}

/**
 * Pesos por ítem (separados del display para que scoring y presentación
 * sean independientes). Los ítems físicos pesan el doble porque su fiabilidad
 * interevaluador es significativamente mayor en los estudios de validación.
 * Exportado para que los tests puedan verificar el sistema de puntuación.
 */
export const ITEM_WEIGHTS: Record<string, number> = {
  // Físico observable — peso 2
  complexion: 2,
  piel: 2,
  ojos: 2,
  cabello: 2,
  unas: 2,
  // Fisiológico regulatorio — peso 1.5
  apetito: 1.5,
  digestion: 1.5,
  heces: 1.5,
  sudoracion: 1.5,
  sed: 1.5,
  sueno: 1.5,
  // Conductual / psicológico — peso 1
  energia: 1,
  voz: 1,
  ritmo: 1,
  suenos_nocturnos: 1,
  mente: 1,
  memoria: 1,
  decisiones: 1,
  relaciones: 1,
  temperamento: 1,
};

/**
 * Provenance mostrada al usuario.
 */
export const PROVENANCE = {
  es: "Rasgos descritos en la Caraka Saṃhitā (Vimāna 8.95–98) y la Suśruta Saṃhitā (Śārīra 4), de dominio público. Metodología inspirada en CCRAS PAS (Prasher et al. 2022). No utiliza el instrumento CCRAS.",
  de: "Merkmale aus der Caraka Saṃhitā (Vimāna 8.95–98) und der Suśruta Saṃhitā (Śārīra 4), gemeinfrei. Methodik inspiriert von CCRAS PAS (Prasher et al. 2022). Verwendet nicht das CCRAS-Instrument.",
} as const;

const ITEMS = {
  es: [
    // ── Físico (peso 2) ───────────────────────────────────────────────────
    {
      id: "complexion",
      prompt: "Tu complexión y estructura corporal",
      options: [
        { dosha: "vata" as Dosha, label: "Delgada o ligera; me cuesta ganar peso y tengo huesos finos" },
        { dosha: "pitta" as Dosha, label: "Media y proporcionada; musculatura moderada sin gran esfuerzo" },
        { dosha: "kapha" as Dosha, label: "Sólida y robusta; gano peso con facilidad y tengo huesos gruesos" },
      ],
    },
    {
      id: "piel",
      prompt: "Tu piel, en general",
      options: [
        { dosha: "vata" as Dosha, label: "Seca, fina y fría al tacto; se agrieta en invierno" },
        { dosha: "pitta" as Dosha, label: "Cálida, suave y propensa a rojeces, eccemas o pecas" },
        { dosha: "kapha" as Dosha, label: "Gruesa, suave y húmeda; cicatriza bien" },
      ],
    },
    {
      id: "ojos",
      prompt: "Tus ojos",
      options: [
        { dosha: "vata" as Dosha, label: "Pequeños o secos; parpadeo frecuente y mirada muy móvil" },
        { dosha: "pitta" as Dosha, label: "Medianos y brillantes; sensibles a la luz intensa" },
        { dosha: "kapha" as Dosha, label: "Grandes, húmedos y de mirada tranquila; cejas y pestañas pobladas" },
      ],
    },
    {
      id: "cabello",
      prompt: "Tu cabello",
      options: [
        { dosha: "vata" as Dosha, label: "Seco, quebradizo o muy rizado; se cae con facilidad" },
        { dosha: "pitta" as Dosha, label: "Fino, liso; canas tempranas o con tono rojizo-castaño" },
        { dosha: "kapha" as Dosha, label: "Abundante, grueso, ondulado y con tendencia grasa; pocas canas" },
      ],
    },
    {
      id: "unas",
      prompt: "Tus uñas",
      options: [
        { dosha: "vata" as Dosha, label: "Quebradizas, rugosas y de crecimiento irregular; suelen agrietarse" },
        { dosha: "pitta" as Dosha, label: "Blandas, rosadas y lisas; crecen rápido y se doblan con facilidad" },
        { dosha: "kapha" as Dosha, label: "Gruesas, blancas y duras; crecen despacio y son muy resistentes" },
      ],
    },
    // ── Fisiológico (peso 1.5) ────────────────────────────────────────────
    {
      id: "apetito",
      prompt: "Tu apetito",
      options: [
        { dosha: "vata" as Dosha, label: "Irregular y variable; a veces mucho hambre y a veces sin ganas de nada" },
        { dosha: "pitta" as Dosha, label: "Fuerte y puntual; me irrita mucho saltarme o retrasar comidas" },
        { dosha: "kapha" as Dosha, label: "Estable y tranquilo; puedo saltar una comida sin problema" },
      ],
    },
    {
      id: "digestion",
      prompt: "Tu digestión",
      options: [
        { dosha: "vata" as Dosha, label: "Irregular; con gases, hinchazón o alternancia estreñimiento-diarrea" },
        { dosha: "pitta" as Dosha, label: "Rápida e intensa; a veces con acidez, ardor o reflujo" },
        { dosha: "kapha" as Dosha, label: "Lenta y pesada; tardo horas en sentirme ligero/a tras comer" },
      ],
    },
    {
      id: "heces",
      prompt: "Tu ritmo intestinal habitual",
      options: [
        { dosha: "vata" as Dosha, label: "Irregular; tiendo al estreñimiento, heces duras o secas" },
        { dosha: "pitta" as Dosha, label: "Frecuente (1–2 veces/día), suelto; a veces con urgencia o escozor" },
        { dosha: "kapha" as Dosha, label: "Una vez al día, bien formado, sin urgencia; tránsito muy regular" },
      ],
    },
    {
      id: "sudoracion",
      prompt: "Cómo sueles sudar",
      options: [
        { dosha: "vata" as Dosha, label: "Sudo poco aunque haga ejercicio; sin olor fuerte" },
        { dosha: "pitta" as Dosha, label: "Sudo con facilidad, incluso con poco esfuerzo; el olor puede ser marcado" },
        { dosha: "kapha" as Dosha, label: "Sudo moderadamente; olor suave y cuerpo fresco al tacto" },
      ],
    },
    {
      id: "sed",
      prompt: "Tu sed y tu relación con el clima",
      options: [
        { dosha: "vata" as Dosha, label: "Sed variable; el frío, el viento y la sequedad me afectan mucho" },
        { dosha: "pitta" as Dosha, label: "Mucha sed; el calor y el sol me agotan rápidamente" },
        { dosha: "kapha" as Dosha, label: "Poca sed; la humedad persistente y el frío húmedo son lo que más me molesta" },
      ],
    },
    {
      id: "sueno",
      prompt: "Tu sueño",
      options: [
        { dosha: "vata" as Dosha, label: "Ligero; me despierto con facilidad y me cuesta volver a dormir" },
        { dosha: "pitta" as Dosha, label: "Moderado (6–7 h); duermo bien salvo noches de mucho estrés" },
        { dosha: "kapha" as Dosha, label: "Profundo y largo (8–9 h o más); me cuesta mucho despertar por la mañana" },
      ],
    },
    // ── Conductual / psicológico (peso 1) ────────────────────────────────
    {
      id: "energia",
      prompt: "Tu energía a lo largo del día",
      options: [
        { dosha: "vata" as Dosha, label: "Va por rachas: arranques de actividad intensa seguidos de agotamiento" },
        { dosha: "pitta" as Dosha, label: "Intensa y constante; cuando me propongo algo soy muy productivo/a" },
        { dosha: "kapha" as Dosha, label: "Soy lento/a para arrancar pero una vez en marcha tengo mucha resistencia" },
      ],
    },
    {
      id: "voz",
      prompt: "Tu voz",
      options: [
        { dosha: "vata" as Dosha, label: "Rápida, de tono variable; a veces ronca o con dificultad para proyectarla" },
        { dosha: "pitta" as Dosha, label: "Clara, directa y penetrante; la gente me oye sin que suba el volumen" },
        { dosha: "kapha" as Dosha, label: "Grave, melodiosa y pausada; proyecta calma" },
      ],
    },
    {
      id: "ritmo",
      prompt: "Tu forma de hablar y moverte",
      options: [
        { dosha: "vata" as Dosha, label: "Rápido/a, gesticulo mucho, hablo sin parar y cambio de tema seguido" },
        { dosha: "pitta" as Dosha, label: "Preciso/a y enérgico/a; voy al grano y me oriento al objetivo" },
        { dosha: "kapha" as Dosha, label: "Pausado/a y metódico/a; prefiero acabar lo que empiezo antes de pasar a otra cosa" },
      ],
    },
    {
      id: "suenos_nocturnos",
      prompt: "El tipo de sueños que sueles tener",
      options: [
        { dosha: "vata" as Dosha, label: "Agitados: vuelo, caigo, corro, escenas que cambian muy rápido" },
        { dosha: "pitta" as Dosha, label: "Intensos: fuego, luz brillante, discusiones o colores vivos" },
        { dosha: "kapha" as Dosha, label: "Tranquilos: agua, naturaleza, escenas lentas o románticas" },
      ],
    },
    {
      id: "mente",
      prompt: "Tu mente bajo estrés",
      options: [
        { dosha: "vata" as Dosha, label: "Me preocupo en exceso, me pongo ansioso/a o con la mente acelerada" },
        { dosha: "pitta" as Dosha, label: "Me irrito, me enfado o me vuelvo muy crítico/a con lo que me rodea" },
        { dosha: "kapha" as Dosha, label: "Me retraigo, me quedo callado/a o me desconecto emocionalmente" },
      ],
    },
    {
      id: "memoria",
      prompt: "Tu memoria y forma de aprender",
      options: [
        { dosha: "vata" as Dosha, label: "Aprendo rápido y con curiosidad, pero olvido con la misma rapidez" },
        { dosha: "pitta" as Dosha, label: "Memoria nítida y selectiva; recuerdo bien lo que me importa" },
        { dosha: "kapha" as Dosha, label: "Me cuesta arrancar, pero lo que aprendo lo retengo durante años" },
      ],
    },
    {
      id: "decisiones",
      prompt: "Cómo tomas decisiones",
      options: [
        { dosha: "vata" as Dosha, label: "Decido rápido pero cambio de opinión con frecuencia; me cuesta mantenerme" },
        { dosha: "pitta" as Dosha, label: "Analizo, decido y suelo mantenerme firme en mi elección" },
        { dosha: "kapha" as Dosha, label: "Necesito tiempo para decidir, pero una vez decidido raramente lo cambio" },
      ],
    },
    {
      id: "relaciones",
      prompt: "Tu estilo social y relaciones",
      options: [
        { dosha: "vata" as Dosha, label: "Me relaciono con facilidad y conozco a mucha gente; mis vínculos cambian con el tiempo" },
        { dosha: "pitta" as Dosha, label: "Elijo mis amistades con cuidado y suelo ser directo/a y exigente" },
        { dosha: "kapha" as Dosha, label: "Mantengo pocas relaciones, pero suelen ser profundas y duraderas" },
      ],
    },
    {
      id: "temperamento",
      prompt: "Tu temperamento habitual",
      options: [
        { dosha: "vata" as Dosha, label: "Entusiasta, imaginativo/a y curioso/a; cambio de intereses con facilidad" },
        { dosha: "pitta" as Dosha, label: "Decidido/a, organizado/a y orientado/a a resultados; tiendo a exigirme" },
        { dosha: "kapha" as Dosha, label: "Calmado/a, paciente y constante; valoro la cercanía y la estabilidad" },
      ],
    },
  ],
  de: [
    // ── Physisch (Gewicht 2) ──────────────────────────────────────────────
    {
      id: "complexion",
      prompt: "Deine Körperstatur",
      options: [
        { dosha: "vata" as Dosha, label: "Schlank und leicht; nehme schwer zu, habe feine Knochen" },
        { dosha: "pitta" as Dosha, label: "Mittel und proportioniert; moderate Muskulatur ohne großen Aufwand" },
        { dosha: "kapha" as Dosha, label: "Kräftig und robust; nehme leicht zu, habe kräftige Knochen" },
      ],
    },
    {
      id: "piel",
      prompt: "Deine Haut im Allgemeinen",
      options: [
        { dosha: "vata" as Dosha, label: "Trocken, dünn und kalt; springt im Winter auf oder reißt ein" },
        { dosha: "pitta" as Dosha, label: "Warm, weich und neigt zu Rötungen, Ekzemen oder Sommersprossen" },
        { dosha: "kapha" as Dosha, label: "Dick, glatt und feucht; heilt schnell und gut ab" },
      ],
    },
    {
      id: "ojos",
      prompt: "Deine Augen",
      options: [
        { dosha: "vata" as Dosha, label: "Klein oder trocken; häufiges Blinzeln und ein sehr beweglicher Blick" },
        { dosha: "pitta" as Dosha, label: "Mittelgroß und leuchtend; empfindlich bei starkem Licht" },
        { dosha: "kapha" as Dosha, label: "Groß, feucht und mit ruhigem Blick; dichte Brauen und Wimpern" },
      ],
    },
    {
      id: "cabello",
      prompt: "Dein Haar",
      options: [
        { dosha: "vata" as Dosha, label: "Trocken, brüchig oder sehr lockig; fällt leicht aus" },
        { dosha: "pitta" as Dosha, label: "Fein, glatt; früh grau oder mit rötlich-braunem Ton" },
        { dosha: "kapha" as Dosha, label: "Dicht, kräftig, wellig und fettig; kaum graue Haare" },
      ],
    },
    {
      id: "unas",
      prompt: "Deine Nägel",
      options: [
        { dosha: "vata" as Dosha, label: "Brüchig, rau und unregelmäßig wachsend; reißen leicht ein" },
        { dosha: "pitta" as Dosha, label: "Weich, rosa und glatt; wachsen schnell und biegen sich leicht" },
        { dosha: "kapha" as Dosha, label: "Dick, weiß und hart; wachsen langsam und sind sehr widerstandsfähig" },
      ],
    },
    // ── Physiologisch (Gewicht 1.5) ───────────────────────────────────────
    {
      id: "apetito",
      prompt: "Dein Appetit",
      options: [
        { dosha: "vata" as Dosha, label: "Unregelmäßig und wechselhaft; mal sehr hungrig, mal ohne Appetit" },
        { dosha: "pitta" as Dosha, label: "Stark und pünktlich; verzögerte Mahlzeiten irritieren mich sehr" },
        { dosha: "kapha" as Dosha, label: "Stabil und ruhig; kann eine Mahlzeit problemlos auslassen" },
      ],
    },
    {
      id: "digestion",
      prompt: "Deine Verdauung",
      options: [
        { dosha: "vata" as Dosha, label: "Unregelmäßig; mit Blähungen, Krämpfen oder wechselndem Stuhlgang" },
        { dosha: "pitta" as Dosha, label: "Schnell und intensiv; manchmal Sodbrennen, Säure oder Reflux" },
        { dosha: "kapha" as Dosha, label: "Langsam und schwer; es dauert Stunden bis ich mich leicht fühle" },
      ],
    },
    {
      id: "heces",
      prompt: "Dein normaler Stuhlgang",
      options: [
        { dosha: "vata" as Dosha, label: "Unregelmäßig; neige zu Verstopfung, hartem oder trockenem Stuhl" },
        { dosha: "pitta" as Dosha, label: "Häufig (1–2×/Tag), weich; manchmal mit Drang oder Brennen" },
        { dosha: "kapha" as Dosha, label: "Einmal täglich, gut geformt, ohne Drang; sehr regelmäßiger Transit" },
      ],
    },
    {
      id: "sudoracion",
      prompt: "Wie du schwitzt",
      options: [
        { dosha: "vata" as Dosha, label: "Ich schwitze wenig, auch beim Sport; kein starker Geruch" },
        { dosha: "pitta" as Dosha, label: "Ich schwitze leicht, auch bei wenig Anstrengung; der Geruch kann ausgeprägt sein" },
        { dosha: "kapha" as Dosha, label: "Ich schwitze mäßig; leichter Geruch, Haut fühlt sich kühl an" },
      ],
    },
    {
      id: "sed",
      prompt: "Dein Durst und Verhältnis zum Klima",
      options: [
        { dosha: "vata" as Dosha, label: "Wechselnder Durst; Kälte, Wind und Trockenheit belasten mich sehr" },
        { dosha: "pitta" as Dosha, label: "Großer Durst; Hitze und Sonne erschöpfen mich schnell" },
        { dosha: "kapha" as Dosha, label: "Wenig Durst; anhaltende Feuchtigkeit und nasse Kälte sind das Schlimmste" },
      ],
    },
    {
      id: "sueno",
      prompt: "Dein Schlaf",
      options: [
        { dosha: "vata" as Dosha, label: "Leicht; ich wache leicht auf und habe Mühe, wieder einzuschlafen" },
        { dosha: "pitta" as Dosha, label: "Mäßig (6–7 Std.); ich schlafe gut außer bei sehr stressigen Nächten" },
        { dosha: "kapha" as Dosha, label: "Tief und lang (8–9 Std. oder mehr); morgens aufzuwachen fällt mir sehr schwer" },
      ],
    },
    // ── Behavioral / psychologisch (Gewicht 1) ───────────────────────────
    {
      id: "energia",
      prompt: "Deine Energie im Tagesverlauf",
      options: [
        { dosha: "vata" as Dosha, label: "Schubweise: intensive Aktivitätsphasen gefolgt von Erschöpfung" },
        { dosha: "pitta" as Dosha, label: "Intensiv und konstant; wenn ich mir etwas vornehme, bin ich sehr produktiv" },
        { dosha: "kapha" as Dosha, label: "Langsam in Gang, aber mit viel Ausdauer wenn ich einmal drin bin" },
      ],
    },
    {
      id: "voz",
      prompt: "Deine Stimme",
      options: [
        { dosha: "vata" as Dosha, label: "Schnell, wechselnde Tonhöhe; manchmal heiser oder schwer zu projizieren" },
        { dosha: "pitta" as Dosha, label: "Klar, direkt und durchdringend; die Leute hören mich ohne lauter zu werden" },
        { dosha: "kapha" as Dosha, label: "Tief, melodisch und ruhig; meine Stimme strahlt Gelassenheit aus" },
      ],
    },
    {
      id: "ritmo",
      prompt: "Deine Art zu sprechen und dich zu bewegen",
      options: [
        { dosha: "vata" as Dosha, label: "Schnell, ich gestikuliere viel, rede viel und wechsle häufig das Thema" },
        { dosha: "pitta" as Dosha, label: "Präzise und energisch; ich komme auf den Punkt und bin zielorientiert" },
        { dosha: "kapha" as Dosha, label: "Gemächlich und methodisch; ich beende lieber etwas, bevor ich weitermache" },
      ],
    },
    {
      id: "suenos_nocturnos",
      prompt: "Die Art deiner Träume",
      options: [
        { dosha: "vata" as Dosha, label: "Lebhaft: fliegen, fallen, rennen, Szenen die sich schnell verändern" },
        { dosha: "pitta" as Dosha, label: "Intensiv: Feuer, grelles Licht, Auseinandersetzungen oder leuchtende Farben" },
        { dosha: "kapha" as Dosha, label: "Ruhig: Wasser, Natur, langsame oder romantische Szenen" },
      ],
    },
    {
      id: "mente",
      prompt: "Dein Geist unter Stress",
      options: [
        { dosha: "vata" as Dosha, label: "Ich mache mir zu viele Sorgen, werde ängstlich oder mein Kopf dreht sich" },
        { dosha: "pitta" as Dosha, label: "Ich werde reizbar, ärgerlich oder sehr kritisch gegenüber meiner Umgebung" },
        { dosha: "kapha" as Dosha, label: "Ich ziehe mich zurück, werde still oder schalte emotional ab" },
      ],
    },
    {
      id: "memoria",
      prompt: "Dein Gedächtnis und deine Art zu lernen",
      options: [
        { dosha: "vata" as Dosha, label: "Ich lerne schnell und neugierig, vergesse aber genauso schnell wieder" },
        { dosha: "pitta" as Dosha, label: "Scharfes, selektives Gedächtnis; ich erinnere mich gut an das, was mich interessiert" },
        { dosha: "kapha" as Dosha, label: "Ich brauche länger zum Starten, aber was ich lerne, behalte ich jahrelang" },
      ],
    },
    {
      id: "decisiones",
      prompt: "Wie du Entscheidungen triffst",
      options: [
        { dosha: "vata" as Dosha, label: "Ich entscheide schnell, ändere aber oft meine Meinung; es fällt mir schwer, dabei zu bleiben" },
        { dosha: "pitta" as Dosha, label: "Ich analysiere, entscheide und bleibe meist bei meiner Wahl" },
        { dosha: "kapha" as Dosha, label: "Ich brauche Zeit zum Entscheiden, ändere es danach aber kaum" },
      ],
    },
    {
      id: "relaciones",
      prompt: "Dein sozialer Stil und deine Beziehungen",
      options: [
        { dosha: "vata" as Dosha, label: "Ich komme leicht mit Menschen in Kontakt und kenne viele; meine Verbindungen verändern sich mit der Zeit" },
        { dosha: "pitta" as Dosha, label: "Ich wähle Freundschaften sorgfältig und bin meist direkt und anspruchsvoll" },
        { dosha: "kapha" as Dosha, label: "Ich pflege wenige Beziehungen, die meist tief und beständig sind" },
      ],
    },
    {
      id: "temperamento",
      prompt: "Dein gewohntes Temperament",
      options: [
        { dosha: "vata" as Dosha, label: "Begeistert, einfallsreich und neugierig; meine Interessen wechseln leicht" },
        { dosha: "pitta" as Dosha, label: "Entschlossen, organisiert und ergebnisorientiert; ich stelle hohe Ansprüche an mich" },
        { dosha: "kapha" as Dosha, label: "Ruhig, geduldig und beständig; Nähe und Stabilität sind mir wichtig" },
      ],
    },
  ],
} as const;

const TYPE_LABELS = {
  es: {
    vata: "Vāta",
    pitta: "Pitta",
    kapha: "Kapha",
    tridoshic: "Tridóshico (equilibrio de los tres)",
    join: "-",
  },
  de: {
    vata: "Vāta",
    pitta: "Pitta",
    kapha: "Kapha",
    tridoshic: "Tridoshisch (Gleichgewicht der drei)",
    join: "-",
  },
} as const;

export function getPrakritiItems(locale: Locale): PrakritiItem[] {
  return localize(locale, ITEMS) as unknown as PrakritiItem[];
}

export function isDosha(v: unknown): v is Dosha {
  return v === "vata" || v === "pitta" || v === "kapha";
}

export const PRAKRITI_ITEM_COUNT = ITEMS.es.length;

/**
 * Respuesta a un ítem: primary obligatorio, secondary opcional.
 * Si secondary está presente y es diferente a primary, el peso del ítem
 * se reparte 75 % primary / 25 % secondary.
 * Si secondary === primary o es null, primary recibe el peso completo.
 */
export interface ItemAnswer {
  primary: Dosha;
  secondary: Dosha | null;
}

// Reparto de peso entre primary y secondary.
const PRIMARY_SHARE = 0.75;
const SECONDARY_SHARE = 0.25;

/**
 * Calcula el perfil ponderado a partir de las respuestas.
 *
 * Puntuación: ITEM_WEIGHTS × PRIMARY_SHARE para primary,
 *             ITEM_WEIGHTS × SECONDARY_SHARE para secondary (si existe y difiere).
 * Porcentajes: sobre el peso total contestado (invariante = 28 con 20 ítems).
 *
 * Reglas de clasificación (sobre porcentajes ponderados):
 *   tridóshico  si (max% − mín%) ≤ 15  — ningún dosha domina con claridad
 *   bidóshico   si (1º% − 2º%)  ≤ 10  (con spread > 15)
 *   monodóshico en el resto
 *
 * El orden canónico vāta < pitta < kapha desempata pares idénticos.
 */
export function scorePrakriti(answers: ItemAnswer[], locale: Locale): PrakritiProfile {
  const itemIds = ITEMS.es.map((it) => it.id);
  const rawScores: Record<Dosha, number> = { vata: 0, pitta: 0, kapha: 0 };
  let totalWeight = 0;

  for (let i = 0; i < answers.length; i++) {
    const id = itemIds[i] ?? "";
    const w = ITEM_WEIGHTS[id] ?? 1;
    const { primary, secondary } = answers[i];
    if (secondary && secondary !== primary) {
      rawScores[primary] += w * PRIMARY_SHARE;
      rawScores[secondary] += w * SECONDARY_SHARE;
    } else {
      rawScores[primary] += w;
    }
    totalWeight += w;
  }
  if (totalWeight === 0) totalWeight = 1;

  const percentages: Record<Dosha, number> = {
    vata: Math.round((rawScores.vata / totalWeight) * 100),
    pitta: Math.round((rawScores.pitta / totalWeight) * 100),
    kapha: Math.round((rawScores.kapha / totalWeight) * 100),
  };

  // Ordenar por puntuación desc, con desempate canónico
  const ranked = [...DOSHAS].sort(
    (a, b) => rawScores[b] - rawScores[a] || DOSHAS.indexOf(a) - DOSHAS.indexOf(b),
  );
  const [d1, d2] = ranked;
  const labels = localize(locale, TYPE_LABELS);

  const spread = percentages[d1] - percentages[ranked[2]];
  const lead = percentages[d1] - percentages[d2];

  let type: string;
  let dominant: Dosha = d1;
  let secondary: Dosha | null = null;

  if (spread <= 15) {
    type = labels.tridoshic;
  } else if (lead <= 10) {
    const pair = [d1, d2].sort(
      (a, b) => rawScores[b] - rawScores[a] || DOSHAS.indexOf(a) - DOSHAS.indexOf(b),
    );
    dominant = pair[0];
    secondary = pair[1];
    type = `${labels[pair[0]]}${labels.join}${labels[pair[1]]}`;
  } else {
    type = labels[d1];
  }

  return { counts: rawScores, percentages, dominant, secondary, type };
}
