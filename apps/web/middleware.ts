/**
 * Middleware de protección de rutas.
 *
 * Estrategia ligera: comprueba la presencia de la cookie de sesión de
 * BetterAuth para decidir si redirigir a /login. La verificación REAL
 * de la sesión vive en cada page/route via requireUserId() — el
 * middleware solo evita un viaje inútil al servidor para usuarios
 * obviamente no autenticados.
 *
 * Importante: este middleware corre en Edge runtime. No importa
 * BetterAuth ni better-sqlite3 aquí (no funcionan en Edge).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

const PROTECTED_PREFIXES = [
  "/memory",
  "/upload",
  "/inbox",
  "/observation",
  "/assess",
  "/image",
  "/chat",
  "/settings",
  "/admin",
];

/**
 * Rutas que el visitante sin cuenta puede ver con `DEMO_MODE=true` (ADR-020).
 *
 * Duplica a propósito la lista de `DEMO_VISIBLE_PREFIXES` en
 * `lib/data-access-guards.ts`: este middleware corre en Edge runtime y no puede
 * importar de ahí sin arrastrar dependencias nativas que no funcionan en Edge.
 * **Si cambias una, cambia la otra.** La comprobación fuerte vive en las
 * páginas, mediante `requireViewSubject`; esto solo evita la redirección.
 *
 * `/admin` queda fuera de forma deliberada: la superficie administrativa se
 * oculta, no se desactiva.
 */
const DEMO_VISIBLE_PREFIXES = ["/memory", "/chat", "/upload"];

/**
 * Se lee `process.env` directamente porque en Edge no está disponible
 * `lib/flags.ts` (arrastra módulos de Node). Mismo criterio que allí: solo el
 * valor exacto "true" enciende el modo.
 */
function demoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const hasSession = SESSION_COOKIE_NAMES.some((n) => req.cookies.has(n));
  if (hasSession) return NextResponse.next();

  // Visitante sin cuenta en modo demostración: se le deja pasar a las rutas
  // del escaparate. Cada página resuelve el sujeto de demostración por su
  // cuenta y se renderiza en modo solo lectura.
  if (
    demoMode() &&
    DEMO_VISIBLE_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    )
  ) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Excluir assets, API auth, healthcheck y favicon. El resto pasa
    // por el middleware (los públicos retornan rápido en la guarda
    // anterior).
    "/((?!_next/static|_next/image|api/auth|api/health|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
