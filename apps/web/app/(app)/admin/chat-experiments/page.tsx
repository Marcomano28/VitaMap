import Link from "next/link";
import { requireAdminSession } from "@/lib/admin";
import { getEnv } from "@/lib/env";
import { getLocale } from "@/lib/locale";
import { llmDisabled } from "@/lib/llm-quota";
import { experimentConfigurationId } from "@/lib/chat/experiments/config";
import { ExperimentPanel } from "./panel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ChatExperimentsPage() {
  await requireAdminSession();
  const env = getEnv();
  const locale = await getLocale();
  return <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
    <Link href="/admin/corpus" className="underline">← {locale === "de" ? "Administration" : "Administración"}</Link>
    <ExperimentPanel enabled={env.CHAT_EXPERIMENTS_ENABLED && !llmDisabled()} jevConfigured={Boolean(env.TYPESAFE_API_KEY)}
      mainModel={env.LLM_MODEL} jevModel={env.TYPESAFE_MODEL} configurationId={experimentConfigurationId()}
      initialLocale={locale} dailyLimit={env.CHAT_EXPERIMENT_DAILY_CALLS} />
  </main>;
}
