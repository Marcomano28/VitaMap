import Link from "next/link";

export const metadata = { title: "La semilla · VitaWende" };

export default function SemillaPage() {
  return (
    <div className="max-w-2xl space-y-10 py-4">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
          VitaWende
        </p>
        <h1 className="text-3xl font-semibold leading-snug">
          La semilla y el árbol
        </h1>
      </header>

      <section className="space-y-5 text-[var(--color-muted)] leading-relaxed">
        <p>
          El trigo sarraceno no es un trigo. Es una planta que aprendió a
          parecer grano para que la sembraran. Su semilla tiene forma de
          pirámide de tres caras — la forma más estable que puede adoptar un
          cuerpo pequeño para ser llevado por el viento y encontrar tierra
          donde caer de pie.
        </p>
        <p>Esta semilla tiene tres caras. También las tiene VitaWende.</p>

        <div className="space-y-4 pl-4 border-l border-[var(--color-border)]">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--color-foreground)]">
              Primera cara — el individuo
            </p>
            <p className="text-sm">
              Una persona con su historial. VitaMap es esta cara: la más
              pequeña, la más íntima, la que toca directamente la palma de la
              mano. Aquí empieza todo porque aquí es donde todo tiene sentido
              para alguien concreto: este cuerpo, esta memoria, este momento.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--color-foreground)]">
              Segunda cara — la comunidad
            </p>
            <p className="text-sm">
              Personas que reconocen en la experiencia del otro la propia. Que
              entienden, al usar la herramienta, que lo que les falta no es
              mala suerte individual sino ausencia de un derecho que todavía
              no existe.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--color-foreground)]">
              Tercera cara — el descubrimiento colectivo
            </p>
            <p className="text-sm">
              Cuando suficientes personas han tenido la misma experiencia y se
              reconocen en ella, lo que cada uno vivió en privado se convierte,
              sumado, en un argumento compartido. Esa posibilidad existe. No se
              impone. Se encuentra.
            </p>
          </div>
        </div>

        <p>
          VitaWende no convence a nadie de nada. Crea las condiciones para que
          cada persona llegue a su propia convicción a través de su propia
          experiencia.
        </p>
        <p>
          La semilla no le explica al árbol cómo crecer. Le da el impulso
          inicial y confía en que la naturaleza hace el resto.
        </p>
      </section>

      <footer className="flex gap-4 text-sm pt-2">
        <Link
          href="/manifiesto"
          className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
        >
          Manifiesto →
        </Link>
        <Link
          href="/"
          className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
        >
          ← Volver
        </Link>
      </footer>
    </div>
  );
}
