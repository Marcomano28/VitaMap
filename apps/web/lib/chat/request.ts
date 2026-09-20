import { z } from "zod";
import { LOCALES } from "../i18n";
import { ChatVariantSchema } from "./variant";

export const ChatBody = z.object({
  variant: ChatVariantSchema.default("current"),
  message: z.string().min(1).max(4000),
  locale: z.enum(LOCALES).default("de"),
  depth: z.enum(["discover", "understand", "deep"]).default("understand"),
  forceDepth: z.boolean().default(false),
  // Solo lo envía la demostración anónima, tras aceptar el aviso previo. Un
  // visitante sin cuenta no recibe respuesta si falta (ADR-020).
  demoConsent: z.boolean().default(false),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(20)
    .default([]),
});

export type ChatInput = z.infer<typeof ChatBody>;
