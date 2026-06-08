import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 'standalone' produce un bundle compacto en .next/standalone/ que el
  // Dockerfile copia. Trae automáticamente las dependencias necesarias y
  // genera server.js.
  output: "standalone",
  // QMD (@tobilu/qmd) y better-sqlite3 son módulos nativos: deben
  // tratarse como externos al bundle del servidor.
  serverExternalPackages: [
    "@tobilu/qmd",
    "better-auth",
    "better-sqlite3",
    "node-llama-cpp",
  ],
  experimental: {
    // Permite Server Actions con cuerpos algo más grandes (subida de PDFs).
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // En modo standalone Next.js incluye solo el workspace activo; le
  // indicamos la raíz del monorepo para que copie los node_modules
  // hoisteados correctamente.
  // npm ejecuta el workspace con cwd=apps/web. Resolver dos niveles hacia
  // arriba evita que el tracing deje una copia parcial de Next en el
  // node_modules local del workspace y rompa el siguiente build.
  outputFileTracingRoot:
    process.env.NEXT_OUTPUT_TRACING_ROOT ??
    path.resolve(process.cwd(), "..", ".."),
};

export default nextConfig;
