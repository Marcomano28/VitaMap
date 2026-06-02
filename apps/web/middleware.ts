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
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const hasSession = SESSION_COOKIE_NAMES.some((n) => req.cookies.has(n));
  if (hasSession) return NextResponse.next();

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
