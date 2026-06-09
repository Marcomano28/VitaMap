"use client";

import { useFormStatus } from "react-dom";

/**
 * Botón de envío que se deshabilita y muestra "procesando…" mientras la
 * Server Action asociada al formulario está en curso. Evita los envíos
 * duplicados por doble clic, frecuentes cuando el reindexado es lento.
 *
 * Debe renderizarse DENTRO del <form> cuyo estado quiere observar.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
  disabled = false,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending || disabled}
      aria-busy={pending}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
