import Link from "next/link";

export const metadata = { title: "Manifiesto · VitaWende" };

export default function ManifiestoPage() {
  return (
    <div className="max-w-2xl space-y-10 py-4">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
          VitaWende
        </p>
        <h1 className="text-3xl font-semibold leading-snug">Manifiesto</h1>
      </header>

      <section className="space-y-5 text-[var(--color-muted)] leading-relaxed">
        <p className="text-[var(--color-foreground)] text-lg">
          En Alemania, los coches tienen una revisión técnica obligatoria cada
          dos años. Las personas, no.
        </p>
        <p>
          No es que sea imposible organizarlo. Es que nadie lo ha propuesto
          todavía como un derecho concreto, financiado y accesible para todos.
        </p>
        <p>
          El sistema sanitario funciona razonablemente bien cuando uno ya está
          enfermo. Funciona mucho peor cuando uno quiere saber cómo está antes
          de estarlo.
        </p>

        <hr className="border-[var(--color-border)]" />

        <p>
          VitaMap es la herramienta personal que ya existe hoy. Guarda tu
          historial cifrado en un servidor bajo tu control. Un asistente lee
          ese historial y la evidencia científica, responde citando siempre la
          fuente, y no diagnostica.
        </p>
        <p>
          VitaWende es el marco mayor. La promesa de que lo que VitaMap hace
          para quien lo busca por su cuenta debería existir como derecho para
          todos — respaldado por centros de salud integral donde cada ciudadano
          pueda recibir, una vez al año, un mapa real de su estado de salud.
        </p>

        <hr className="border-[var(--color-border)]" />

        <div className="space-y-3">
          <p className="font-medium text-[var(--color-foreground)]">
            Lo que VitaWende no es:
          </p>
          <ul className="space-y-1 text-sm list-none pl-0">
            {[
              "No es un movimiento de medicina alternativa.",
              "No es un partido ni tiene posición sobre ningún otro tema.",
              "No es una empresa que vende salud.",
              "No promete resultados extraordinarios.",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[var(--color-border)]">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p>
          Tiene una pregunta concreta: ¿por qué el Estado financia el
          tratamiento de enfermedades que podrían haberse detectado antes, y no
          financia la detección?
        </p>
        <p className="text-xs text-[var(--color-muted)] italic">
          Quien quiera ir más allá de usar la herramienta encontrará en
          VitaWende la forma de hacerlo. Quien no quiera, tiene igualmente todo
          lo que necesita.
        </p>
      </section>

      <footer className="flex gap-4 text-sm pt-2">
        <Link
          href="/centros"
          className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
        >
          Los centros →
        </Link>
        <Link
          href="/semilla"
          className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
        >
          ← La semilla
        </Link>
      </footer>
    </div>
  );
}
