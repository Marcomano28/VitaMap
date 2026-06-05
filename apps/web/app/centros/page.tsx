import Link from "next/link";

export const metadata = { title: "Los centros · VitaWende" };

export default function CentrosPage() {
  return (
    <div className="max-w-2xl space-y-10 py-4">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
          VitaWende
        </p>
        <h1 className="text-3xl font-semibold leading-snug">
          Los centros de salud integral
        </h1>
        <p className="text-[var(--color-muted)]">
          No son hospitales. No son balnearios. Son un tercer tipo de lugar —
          el que todavía no existe pero cuya geometría ya está trazada.
        </p>
      </header>

      <section className="space-y-8">
        <div className="space-y-3">
          <h2 className="font-medium">Dos condiciones deliberadas</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Infraestructura técnica",
                body: "Laboratorio completo, marcadores de longevidad, diagnóstico por imagen, diagnóstico funcional. Unidades de medicina tradicional china y Ayurveda certificadas — no como alternativa a la ciencia, sino como marcos que capturan lo que los análisis de sangre no miden.",
              },
              {
                title: "Entorno natural",
                body: "Ubicación en bosque, montaña o costa. No por estética — porque el proceso de conocerse a uno mismo requiere tiempo y quietud que un ambulatorio urbano no puede ofrecer. El entorno es parte del protocolo, no un accesorio.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-2"
              >
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-sm text-[var(--color-muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-medium">Una visita</h2>
          <ol className="space-y-3 text-sm text-[var(--color-muted)]">
            {[
              "Llegada y entrevista de contexto. Si usas VitaMap, tu historial ya está organizado y puedes compartirlo en ese momento.",
              "Análisis completo: laboratorio, imagen, diagnóstico funcional, y los sistemas de diagnóstico tradicional que hayas elegido.",
              "Lectura cruzada del equipo interdisciplinar. No para diagnosticar — para leer el conjunto desde marcos distintos.",
              "Un informe que te llevas. Los datos vuelven a VitaMap si lo autorizas. Lo que el centro genera en un día, VitaMap lo mantiene los 364 días restantes.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full border border-[var(--color-border)] flex items-center justify-center text-xs">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-sm text-[var(--color-muted)] space-y-1">
          <p className="font-medium text-[var(--color-foreground)]">
            VitaMap y los centros son el mismo proyecto visto a distancias
            distintas.
          </p>
          <p>
            VitaMap es el altar personal — el espacio de reunificación
            cotidiana con el propio cuerpo. Los centros son el templo mayor
            que lo rodea y le da escala. Uno sin el otro es incompleto.
          </p>
        </div>
      </section>

      <footer className="flex gap-4 text-sm pt-2">
        <Link
          href="/register"
          className="rounded-md bg-[var(--color-foreground)] text-[var(--color-background)] px-4 py-2 text-sm font-medium hover:opacity-90 transition"
        >
          Entrar a VitaMap
        </Link>
        <Link
          href="/manifiesto"
          className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition self-center"
        >
          ← Manifiesto
        </Link>
      </footer>
    </div>
  );
}
