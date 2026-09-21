import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

const optionalString = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

/**
 * Validación de variables de entorno en arranque. Falla rápido si falta
 * algo crítico. Importar SOLO desde código de servidor.
 */
const EnvSchema = z.object({
  // LLM principal
  LLM_BASE_URL: z.string().url(),
  LLM_MODEL: z.string().min(1),
  LLM_API_KEY: z.string().min(1),
  // "local" = llama.cpp en el VPS (campos extra llama.cpp en las
  // peticiones). "external" = API OpenAI-compatible estricta (Mistral,
  // etc.) durante el piloto — ver ADR-014. Volver a "local" en el
  // blindaje final.
  LLM_PROVIDER: z.enum(["local", "external"]).default("local"),

  // Solo el laboratorio administrativo sintético usa TypeSafe.
  TYPESAFE_API_KEY: optionalString(z.string().min(1)),
  TYPESAFE_MODEL: z.literal("jev-1.13.0").default("jev-1.13.0"),
  TYPESAFE_TIMEOUT_MS: z.coerce.number().int().min(500).max(30000).default(5000),
  CHAT_EXPERIMENT_DAILY_CALLS: z.coerce.number().int().min(0).max(600).default(120),

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

  // Email transaccional. Opcional para herramientas administrativas que
  // comparten este schema; lib/email.ts lo exige al intentar enviar en prod.
  BREVO_API_KEY: optionalString(z.string().startsWith("xkeysib-")),
  EMAIL_FROM: optionalString(z.string().min(3)),
  EMAIL_REPLY_TO: optionalString(z.string().email()),

  // App
  ADMIN_EMAILS: z.string().default(""),
  // Habilita el laboratorio sintético administrativo; no cambia el chat público.
  CHAT_EXPERIMENTS_ENABLED: z.enum(["true", "false"])
    .default("false").transform((value) => value === "true"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Stripe — opcionales (el contenedor admin no las recibe), pero si
  // están presentes se valida el formato para fallar en arranque y no
  // en mitad de un checkout. lib/stripe.ts sigue siendo quien las exige
  // en tiempo de uso.
  STRIPE_SECRET_KEY: z
    .string()
    .regex(/^sk_(live|test)_/, "STRIPE_SECRET_KEY debe empezar por sk_live_ o sk_test_")
    .optional(),
  STRIPE_PRICE_ID: z.string().regex(/^price_/).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().regex(/^whsec_/).optional(),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;
const envValueBaseDirs = new Map<string, string>();

export function getEnv(): Env {
  loadDotenvIfPresent();
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Variables de entorno inválidas:", parsed.error.flatten().fieldErrors);
    throw new Error("Configuración inválida — revisa .env contra .env.example");
  }
  cached = {
    ...parsed.data,
    DATA_ROOT: resolveConfiguredPath("DATA_ROOT", parsed.data.DATA_ROOT),
    KB_INDEX_PATH: resolveConfiguredPath(
      "KB_INDEX_PATH",
      parsed.data.KB_INDEX_PATH,
    ),
    AUTH_DB_PATH: resolveConfiguredPath("AUTH_DB_PATH", parsed.data.AUTH_DB_PATH),
  };
  if (
    cached.NODE_ENV === "production" &&
    (!cached.STRIPE_SECRET_KEY || !cached.STRIPE_PRICE_ID || !cached.STRIPE_WEBHOOK_SECRET)
  ) {
    // Aviso, no error: el contenedor admin opera sin Stripe.
    console.warn(
      "[env] Variables Stripe incompletas en producción — el flujo de suscripción fallará si este proceso las necesita.",
    );
  }
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
  const baseDir = path.dirname(path.resolve(file));
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
      envValueBaseDirs.set(key, baseDir);
    }
  }
}

function resolveConfiguredPath(key: string, value: string): string {
  if (path.isAbsolute(value)) return path.normalize(value);
  return path.resolve(envValueBaseDirs.get(key) ?? process.cwd(), value);
}
