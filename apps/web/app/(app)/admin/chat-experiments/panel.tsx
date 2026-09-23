"use client";

import { useState } from "react";
import { CASES, type CaseId, type ExperimentLocale, type ExperimentVariant } from "@/lib/chat/experiments/fixtures";
import type { ExperimentAnswer } from "@/lib/chat/experiments/runner";
import type { ChatTelemetry } from "@/lib/chat/telemetry";

type Result = { status: number; answer?: ExperimentAnswer; error?: string; metrics?: ChatTelemetry };
type Session = {
  id: string; variant: ExperimentVariant; locale: ExperimentLocale; caseId: CaseId; version: string;
  step: number; status: "ready" | "running" | "done" | "failed"; expiresAt: number;
  turns: Array<{ message: string; history: Array<{ role: string; content: string }> }>; results: Result[];
};
const errors: Record<string, string> = {
  forbidden: "Acceso reservado al administrador.", experiments_disabled: "Las pruebas están desactivadas.",
  invalid_origin: "El dominio no coincide con NEXT_PUBLIC_APP_URL.", typesafe_not_configured: "Falta configurar TYPESAFE_API_KEY en el servidor.",
  typesafe_rate_limited: "TypeSafe ha limitado las peticiones. Espera antes de iniciar otra prueba.",
  typesafe_timeout: "TypeSafe no respondió dentro del tiempo configurado.", typesafe_invalid: "TypeSafe devolvió una respuesta incompatible; no se aceptó.",
  typesafe_unavailable: "TypeSafe no está disponible. Revisa la configuración del proveedor.",
  busy: "Hay una prueba en curso. Espera a que termine.", budget_exhausted: "Se alcanzó el presupuesto diario de pruebas.",
  quota_exhausted: "Se alcanzó una cuota de inferencia de la aplicación.", stale_session: "Esta prueba ya se ejecutó o cambió la configuración. Crea una nueva.",
  not_found: "La sesión no está disponible o ha caducado.", rate_limited: "Demasiadas peticiones. Espera un minuto.",
  session_limit: "Hay demasiadas sesiones activas. Espera a que caduquen.",
};

export function ExperimentPanel(props: {
  enabled: boolean; jevConfigured: boolean; mainModel: string; jevModel: string;
  configurationId: string; initialLocale: ExperimentLocale; dailyLimit: number;
}) {
  const [locale, setLocale] = useState<ExperimentLocale>(props.initialLocale);
  const [caseId, setCaseId] = useState<CaseId>("education");
  const [variant, setVariant] = useState<ExperimentVariant>("current");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const de = props.initialLocale === "de";
  async function request(body: unknown) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/chat-experiments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (data.session) setSessions(previous => [data.session, ...previous.filter(s => s.id !== data.session.id)].slice(0, 12));
      if (!response.ok) setError(de ? `Test nicht verfügbar (${data.error ?? "error"}).` : errors[data.error] ?? "No se pudo completar la prueba. Crea una nueva cuando el servicio esté disponible.");
    } catch { setError(de ? "Verbindungsfehler. Der Test kann auf dem Server noch laufen; bitte warten." : "Se perdió la conexión. La prueba puede seguir en el servidor; espera antes de iniciar otra."); }
    finally { setBusy(false); }
  }
  function download(session: Session) {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), mainModel: props.mainModel, jevModel: props.jevModel, session }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `jev-${session.caseId}-${session.locale}-${session.variant}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <>
    <h1 className="text-2xl font-semibold">{de ? "Gesprächslabor · Jev" : "Laboratorio conversacional · Jev"}</h1>
    <p>{de ? "Nur festgelegte synthetische Fälle. Keine Eingabe persönlicher Daten. Jede Variante läuft einzeln mit denselben Quellen und vorgegebenen Gesprächsverläufen." : "Solo casos sintéticos predefinidos. Cada variante se ejecuta por separado con las mismas fuentes e historiales fijados. No se envían datos personales ni se cambia el chat de los usuarios."}</p>
    <p className="text-sm opacity-75">{de ? "Keine QMD-Geschwindigkeitsmessung: feste Testquellen. J3 ist nur eine experimentelle Auswertung, keine medizinische Sicherheit." : "Esta comparación usa fuentes fijas: no mide la velocidad de QMD. J3 se observa como evaluación experimental, no como garantía médica."}</p>
    <p className="text-sm">{props.mainModel} · {props.jevModel} · {props.configurationId}<br />
      {de ? "Reservierung: maximal 6 Aufrufe je Schritt; Tageslimit" : "Reserva: hasta 6 llamadas por paso; límite diario"}: {props.dailyLimit}. {de ? "Sitzungen verfallen nach 30 Minuten." : "Las sesiones caducan a los 30 minutos."}</p>
    {!props.enabled && <p role="status">{de ? "Tests deaktiviert. CHAT_EXPERIMENTS_ENABLED und LLM_DISABLED prüfen." : "Pruebas desactivadas. Configura CHAT_EXPERIMENTS_ENABLED=true y comprueba que LLM_DISABLED no esté activo."}</p>}
    {!props.jevConfigured && <p role="status">{de ? "Jev ist nicht konfiguriert: TYPESAFE_API_KEY fehlt." : "Jev no está configurado: falta TYPESAFE_API_KEY en el servidor."}</p>}
    <div className="flex flex-wrap items-end gap-4">
      <label className="grid gap-1">{de ? "Fall" : "Caso"}<select className="rounded border bg-transparent p-2" value={caseId} onChange={e => setCaseId(e.target.value as CaseId)}>{CASES.map(c => <option key={c.id} value={c.id}>{c[props.initialLocale]}</option>)}</select></label>
      <label className="grid gap-1">{de ? "Testsprache" : "Idioma de prueba"}<select className="rounded border bg-transparent p-2" value={locale} onChange={e => setLocale(e.target.value as ExperimentLocale)}><option value="es">Español</option><option value="de">Deutsch</option></select></label>
      <label className="grid gap-1">{de ? "Variante" : "Variante"}<select className="rounded border bg-transparent p-2" value={variant} onChange={e => setVariant(e.target.value as ExperimentVariant)}>
        <option value="current">A · {de ? "Aktuell (feste Quellen)" : "Actual (fuentes fijas)"}</option>
        <option value="control">B · {de ? "Regeln + Vorlagen" : "Reglas + plantillas"}</option>
        <option value="jev" disabled={!props.jevConfigured}>C · Jev</option>
      </select></label>
      <button className="rounded border px-4 py-2 disabled:opacity-40" disabled={busy || !props.enabled || (variant === "jev" && !props.jevConfigured)} onClick={() => request({ action: "create", caseId, locale, variant })}>{de ? "Neue Testsitzung" : "Nueva sesión de prueba"}</button>
    </div>
    {error && <p role="alert">{error}</p>}
    <div className="grid gap-6 lg:grid-cols-2">{sessions.map(session => <section key={session.id} className="space-y-3 rounded-xl border p-4">
      <h2 className="font-semibold">{session.variant} · {session.caseId} · {session.locale}</h2>
      <p className="text-sm">{session.status} · {session.step}/{session.turns.length}</p>
      {session.results.map((result, index) => <article key={index} className="space-y-2 border-t pt-3">
        <p className="font-medium">{session.turns[index].message}</p>
        <p className="whitespace-pre-wrap">{result.answer?.text ?? result.error}</p>
        {result.answer && <p className="text-sm">{result.answer.route} · {result.answer.disposition} · {result.answer.routingSource ?? "current"} · J3: {result.answer.supportMode}</p>}
        {result.answer?.perspectivePolicy && <p className="text-sm">{de ? "Perspektive" : "Perspectiva"}: {result.answer.perspectivePolicy.selected} · {result.answer.perspectivePolicy.source}</p>}
        {result.answer?.probe && <div className="space-y-2 rounded border p-3 text-sm">
          <p className="font-medium">{de ? "Feste Aussage zur Prüfung" : "Afirmación fija para evaluar"}</p>
          <blockquote>{result.answer.probe.statement}</blockquote>
          <p>{de ? "Erwartet" : "Resultado esperado"}: <strong>{result.answer.probe.expected}</strong></p>
          <p>Mistral guardrail: {result.answer.probe.guardrail.verdict} · {de ? "Annahme/Ablehnung korrekt" : "Aceptación/rechazo correcto"}: {result.answer.probe.guardrail.matchesExpectedAcceptance ? "✓" : "✗"}</p>
          {result.answer.probe.jev && <p>Jev: {result.answer.probe.jev.chosen} · {de ? "Nach Schwellenwert" : "Tras aplicar umbral"}: {result.answer.probe.jev.accepted ?? (de ? "Enthaltung" : "abstención")} · {de ? "Erwartete Kategorie akzeptiert" : "Categoría esperada aceptada"}: {result.answer.probe.jev.matchesExpectedAcceptedLabel ? "✓" : "✗"}</p>}
          <p>{de ? "A/B prüfen mit Mistral; C prüft denselben Text mit Mistral und Jev. Mistral entscheidet über Freigabe, Jev unterscheidet drei Kategorien." : "A/B revisan con Mistral; C revisa el mismo texto con Mistral y Jev. Mistral decide si lo acepta; Jev distingue tres categorías."}</p>
        </div>}
        {result.answer?.observations && <details className="text-sm"><summary>{de ? "Beobachtete Signale (steuern den Ablauf noch nicht)" : "Señales observadas (todavía no cambian el recorrido)"}</summary>
          <ul>{Object.entries(result.answer.observations).map(([name, signal]) => <li key={name}>{name}: {signal.decision} · {signal.probability.toFixed(2)}</li>)}</ul>
        </details>}
        {result.metrics && <table className="w-full text-left text-sm"><thead><tr><th>{de ? "Anbieter" : "Proveedor"}</th><th>{de ? "Aufrufe" : "Llamadas"}</th><th>Tokens*</th></tr></thead><tbody>{["external", "local", "typesafe"].map(provider => {
          const calls = result.metrics!.calls.filter(c => c.provider === provider);
          if (!calls.length) return null;
          const known = calls.filter(c => c.totalTokens !== null);
          return <tr key={provider}><td>{provider}</td><td>{calls.length}</td><td>{known.length ? known.reduce((sum, c) => sum + c.totalTokens!, 0) : "?"}{known.length !== calls.length ? " (parcial)" : ""}</td></tr>;
        })}</tbody></table>}
        {result.metrics && <p className="text-sm">{(result.metrics.durationMs / 1000).toFixed(2)} s · *{de ? "Gemeldete Tokens, keine Kostenberechnung." : "Tokens informados; no equivalen al coste facturado."}</p>}
        <details><summary>{de ? "Details und Quellen" : "Decisiones y fuentes"}</summary><pre className="max-h-80 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(result, null, 2)}</pre></details>
      </article>)}
      {session.status === "ready" && <><p>{session.turns[session.step]?.message}</p><button className="rounded border px-3 py-2 disabled:opacity-40" disabled={busy || !props.enabled} onClick={() => request({ action: "run", sessionId: session.id, step: session.step })}>{busy ? (de ? "Läuft…" : "En curso…") : (de ? "Diesen Schritt ausführen" : "Ejecutar este paso")}</button></>}
      {session.results.length > 0 && <button className="ml-3 underline" onClick={() => download(session)}>{de ? "JSON herunterladen" : "Descargar JSON"}</button>}
    </section>)}</div>
  </>;
}
