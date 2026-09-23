import { createHash } from "node:crypto";
import { getEnv } from "../../env";
import { CASES, EXPERIMENT_VERSION, fixture } from "./fixtures";
import { THRESHOLDS } from "./typesafe";
import { routeQuestions } from "./questions";
import { ExperimentStore } from "./store";

export function experimentConfigurationId() {
  const env = getEnv();
  return createHash("sha256").update(JSON.stringify({
    policy: EXPERIMENT_VERSION, thresholds: THRESHOLDS, routeQuestions, model: env.LLM_MODEL, provider: env.LLM_PROVIDER,
    jev: env.TYPESAFE_MODEL, timeout: env.TYPESAFE_TIMEOUT_MS,
    edu: process.env.ASSISTANT_EDU_GUIDE === "true", markerScope: process.env.KB_MARKER_SCOPE === "true",
    fixtures: CASES.map(c => [fixture(c.id, "es"), fixture(c.id, "de")]),
  })).digest("hex").slice(0, 16);
}
let cached: { path: string; store: ExperimentStore } | undefined;
export function experimentStore() {
  const filename = getEnv().AUTH_DB_PATH;
  if (cached?.path !== filename) {
    cached?.store.close();
    cached = { path: filename, store: new ExperimentStore(filename) };
  }
  return cached.store;
}
