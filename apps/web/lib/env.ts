import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

/**
 * Validación de variables de entorno en arranque. Falla rápido si falta
 * algo crítico. Importar SOLO desde código de servidor.
 */
const EnvSchema = z.object({
  // LLM principal
  LLM_BASE_URL: z.string().url(),
  LLM_MODEL: z.string().min(1),
  LLM_API_KEY: z.string().min(1),

  // QMD embeddings (multilingüe fijado desde Fase 0)
  QMD_EMBED_MODEL: z.string().min(1),

  // Rutas de datos
  DATA_ROOT: z.string().min(1),
  KB_INDEX_PATH: z.string().min(1),
  AUTH_DB_PATH: z.string().min(1),

  // Cifrado
  MASTER_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, "MASTER_KEY debe ser 64 hex (32 bytes)"),

  // BetterAuth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),

  // App
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  loadDotenvIfPresent();
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Variables de entorno inválidas:", parsed.error.flatten().fieldErrors);
    throw new Error("Configuración inválida — revisa .env contra .env.example");
  }
  cached = parsed.data;
  return cached;
}

let dotenvLoaded = false;

function loadDotenvIfPresent() {
  if (dotenvLoaded) return;
  dotenvLoaded = true;

  for (const file of [
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "..", "..", ".env"),
  ]) {
    loadDotenvFile(file);
  }
}

function loadDotenvFile(file: string) {
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
