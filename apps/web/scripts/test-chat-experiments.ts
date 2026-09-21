/** Offline integration checks. No network, credentials, real reports or QMD. */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
import { z } from "zod";
import * as telemetry from "../lib/chat/telemetry";
import * as fixtures from "../lib/chat/experiments/fixtures";
import * as storeModule from "../lib/chat/experiments/store";
import { parseRetryAfter } from "../lib/llm-errors";
import type { Decisions, Questions } from "../lib/chat/experiments/typesafe";

function load<T>(file: string, dependencies: Record<string, unknown>, extra: Record<string, unknown> = {}): T {
  const url = new URL(file, import.meta.url);
  const require = createRequire(url);
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(url, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, {
    exports, AbortSignal, Date, URL, console: { info() {}, warn() {}, error() {} }, process: { env: {} },
    require: (id: string) => Object.hasOwn(dependencies, id) ? dependencies[id] : require(id), ...extra,
  });
  return exports as T;
}

function decision(questions: Questions, choices: Record<string, string> = {}): Decisions {
  return { model: "jev-1.13.0", usage: { input_tokens: 10, output_tokens: 3 }, answers: Object.fromEntries(Object.entries(questions).map(([id, q]) => {
    const choice = choices[id] ?? Object.keys(q.criteria)[0];
    return [id, { type: "choice", choice, probabilities: Object.fromEntries(Object.keys(q.criteria).map(key => [key, key === choice ? 1 : 0])), confidence: 1 }];
  })) };
}

async function main() {
  const env = { TYPESAFE_API_KEY: "synthetic-key", TYPESAFE_MODEL: "jev-1.13.0", TYPESAFE_TIMEOUT_MS: 5000,
    CHAT_EXPERIMENTS_ENABLED: true, NEXT_PUBLIC_APP_URL: "https://test.invalid", CHAT_EXPERIMENT_DAILY_CALLS: 120 };
  let response: unknown;
  let status = 200;
  let networkCalls = 0;
  const provider = load<typeof import("../lib/chat/experiments/typesafe")>("../lib/chat/experiments/typesafe.ts", {
    zod: { z }, "../../env": { getEnv: () => env }, "../telemetry": telemetry, "../../llm-errors": { parseRetryAfter },
  }, { fetch: async (url: string, init: RequestInit) => {
    networkCalls++;
    assert.equal(url, "https://api.typesafe.ai/v1/systemone");
    assert.equal(init.redirect, "error");
    assert.equal((init.headers as Record<string, string>).Authorization, "Bearer synthetic-key");
    if (init.signal?.aborted) throw new Error("synthetic-private-error");
    return Response.json(response, { status, headers: { "Retry-After": "7" } });
  } });
  const questions: Questions = { route: { type: "choice", instructions: "Route?", criteria: { facts: "facts", unclear: "unclear" } } };
  response = decision(questions);
  const measurements: telemetry.ChatTelemetry[] = [];
  await telemetry.withChatTelemetry(async () => {
    const result = await provider.evaluateChoices("synthetic-only", questions, "jev_route", new AbortController().signal);
    assert.equal(provider.acceptedChoice(result.answers.route), "facts");
    return { status: 200 };
  }, s => measurements.push(s), { maxCalls: 1 });
  assert.equal(measurements[0].calls[0].provider, "typesafe");
  assert.equal(measurements[0].tokens.total.reported, 13);
  assert.equal(networkCalls, 1);
  const invalid = [
    { ...decision(questions), model: "unexpected" },
    { ...decision(questions), answers: {} },
    { ...decision(questions), answers: { route: { type: "choice", choice: "invented", probabilities: { facts: 1, unclear: 0 }, confidence: 1 } } },
    { ...decision(questions), answers: { route: { type: "choice", choice: "facts", probabilities: { facts: 0.8, unclear: 0.8 }, confidence: 1 } } },
    { ...decision(questions), answers: { route: { type: "choice", choice: "facts", probabilities: { facts: 0.2, unclear: 0.8 }, confidence: 1 } } },
  ];
  for (const item of invalid) assert.throws(() => provider.validateDecisions(item, questions, env.TYPESAFE_MODEL), provider.TypeSafeError);
  assert.equal(provider.acceptedChoice({ type: "choice", choice: "facts", probabilities: { facts: 0.51, unclear: 0.49 }, confidence: 0.5 }), null);
  for (const code of [429, 529, 401, 422]) {
    status = code; response = { message: "synthetic-private-error" };
    await assert.rejects(provider.evaluateChoices({}, questions, "jev_route", new AbortController().signal), (error: unknown) => error instanceof provider.TypeSafeError && !error.message.includes("private"));
  }
  status = 200; response = decision(questions);
  await assert.rejects(provider.evaluateChoices({}, questions, "jev_route", AbortSignal.abort()), (error: unknown) => error instanceof provider.TypeSafeError && error.code === "timeout");
  const before = networkCalls;
  env.TYPESAFE_API_KEY = "";
  await assert.rejects(provider.evaluateChoices({}, questions, "jev_route", new AbortController().signal), provider.TypeSafeError);
  assert.equal(networkCalls, before);
  env.TYPESAFE_API_KEY = "synthetic-key";
  await telemetry.withChatTelemetry(async () => {
    await provider.evaluateChoices({}, questions, "jev_route", new AbortController().signal);
    await assert.rejects(provider.evaluateChoices({}, questions, "jev_route", new AbortController().signal), telemetry.InferenceBudgetError);
    return { status: 200 };
  }, () => {}, { maxCalls: 1 });
  assert.equal(networkCalls, before + 1, "Budget checked before sending request");

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vitamap-experiments-"));
  const store = new storeModule.ExperimentStore(path.join(tmp, "test.sqlite"));
  const now = Date.now();
  try {
    const a = store.create("owner-a", "education", "es", "jev", "v1", now);
    assert.throws(() => store.read(a.id, "owner-b", now), storeModule.ExperimentStoreError);
    assert.throws(() => store.read(a.id, "owner-a", now + 31 * 60_000), storeModule.ExperimentStoreError);
    assert.throws(() => store.claim(a.id, "owner-a", 0, "v2", 120, now), storeModule.ExperimentStoreError);
    assert.throws(() => store.claim(a.id, "owner-a", 0, "v1", 5, now), storeModule.ExperimentStoreError);
    store.claim(a.id, "owner-a", 0, "v1", 6, now);
    const b = store.create("owner-b", "latest", "de", "control", "v1", now);
    assert.throws(() => store.claim(b.id, "owner-b", 0, "v1", 120, now), (e: unknown) => e instanceof storeModule.ExperimentStoreError && e.code === "busy");
    store.finish(a.id, "owner-a", 0, { text: "synthetic" }, false, 2);
    assert.equal(store.read(a.id, "owner-a").step, 1);
    assert.throws(() => store.claim(a.id, "owner-a", 0, "v1", 120, now), storeModule.ExperimentStoreError);
    assert.throws(() => store.claim(b.id, "owner-b", 0, "v1", 6, now), (e: unknown) => e instanceof storeModule.ExperimentStoreError && e.code === "budget_exhausted");
    const second = new storeModule.ExperimentStore(path.join(tmp, "test.sqlite"));
    assert.throws(() => second.claim(b.id, "owner-b", 0, "v1", 6, now), storeModule.ExperimentStoreError);
    second.close();

    let actor: string | null = "admin";
    let quota = true;
    let claims = 0;
    let runs = 0;
    let refunds = 0;
    const route = load<{ POST: (req: Request) => Promise<Response>; GET: (req: Request) => Promise<Response> }>("../app/api/admin/chat-experiments/route.ts", {
      "next/server": { NextResponse: { json: (body: unknown, init: ResponseInit) => Response.json(body, init) } },
      "@/lib/session": { getSessionFromRequest: async () => actor ? { user: { id: actor, email: actor } } : null },
      "@/lib/admin": { isAdminEmail: (email: string) => email === "admin" || email === "other-admin" },
      "@/lib/env": { getEnv: () => env }, "@/lib/rate-limit": { checkRateLimit: () => ({ allowed: true }) },
      "@/lib/llm-quota": { consumeLlmQuota: () => { claims++; return { allowed: quota }; }, refundLlmQuota: () => { refunds++; }, llmDisabled: () => false },
      "@/lib/chat/telemetry": telemetry, "@/lib/chat/experiments/fixtures": fixtures,
      "@/lib/chat/experiments/config": { experimentStore: () => store, experimentConfigurationId: () => "v1" },
      "@/lib/chat/experiments/store": storeModule, "@/lib/chat/experiments/typesafe": provider,
      "@/lib/chat/experiments/runner": { runExperiment: async () => { runs++; return { text: "synthetic" }; } },
    });
    const post = (body: unknown, origin = "https://test.invalid") => route.POST(new Request("https://test.invalid/api/admin/chat-experiments", {
      method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body),
    }));
    const create = { action: "create", caseId: "latest", locale: "es", variant: "jev" };
    actor = null; assert.equal((await post(create)).status, 403);
    actor = "user"; assert.equal((await post(create)).status, 403);
    actor = "admin"; assert.equal((await post(create, "https://evil.invalid")).status, 403);
    env.CHAT_EXPERIMENTS_ENABLED = false; assert.equal((await post(create)).status, 503); env.CHAT_EXPERIMENTS_ENABLED = true;
    assert.equal((await post({ ...create, message: "private" })).status, 400);
    assert.equal((await post({ ...create, subject: "victim" })).status, 400);
    assert.equal((await post({ ...create, caseId: "../../private" })).status, 400);
    assert.equal(runs, 0); assert.equal(claims, 0);
    const created = await (await post(create)).json();
    assert.ok(created.session.id); assert.equal(created.session.owner, undefined);
    actor = "other-admin";
    assert.equal((await post({ action: "run", sessionId: created.session.id, step: 0 })).status, 404);
    actor = "admin";
    quota = false; assert.equal((await post({ action: "run", sessionId: created.session.id, step: 0 })).status, 429); quota = true;
    assert.equal(runs, 0);
    const success = await post({ action: "run", sessionId: created.session.id, step: 0 });
    assert.equal(success.status, 200); assert.equal(runs, 1);
    assert.equal((await success.json()).session.status, "done");
    assert.equal((await post({ action: "run", sessionId: created.session.id, step: 0 })).status, 409);
    assert.equal(runs, 1); assert.equal(refunds, 1);
  } finally { store.close(); fs.rmSync(tmp, { recursive: true, force: true }); }

  const events: string[] = [];
  let intent = "knowledge";
  let guardrail = "safe";
  let classifierError = false;
  let crisis = false;
  let invalidDraft = false;
  const runner = load<typeof import("../lib/chat/experiments/runner")>("../lib/chat/experiments/runner.ts", {
    "../../llm": { SOCRATIC_SYSTEM_PROMPT: "test", chat: async (req: { messages: unknown; stage: string }) => {
      events.push(req.stage);
      assert.ok(!JSON.stringify(req.messages).includes("42"), "Personal magnitude excluded from free-text generation");
      return JSON.stringify({ statements: [{ id: "a1", text: "La ferritina almacena hierro.", sourceIds: [invalidDraft ? "s9" : "s1"] }] });
    } },
    "../../crisis": { detectCrisis: async () => { events.push("crisis"); return { crisis, classifierError }; }, crisisResourcesText: () => "synthetic crisis notice" },
    "../../guardrail": { checkResponse: async () => { events.push("guardrail"); return { verdict: guardrail, flags: [] }; } },
    "./typesafe": { acceptedChoice: provider.acceptedChoice, evaluateChoices: async (_state: unknown, q: Questions, stage: string) => {
      events.push(stage);
      return decision(q, stage === "jev_route" ? { intent, perspective: "biomedical", reference: "self_contained" }
        : stage === "jev_evidence" ? { s1: "direct", s2: "irrelevant", s3: "irrelevant" } : { a1: "contradicted" });
    } },
    "../current": { runCurrentChat: async (_ctx: unknown, services: Record<string, (...args: unknown[]) => Promise<unknown>>) => {
      assert.equal(Object.keys(services).length, 5);
      const data = await services.queryMemoryAndKB("ignored", "ignored") as { personal: unknown[] };
      assert.equal(data.personal.length, 2);
      await services.latestLabContext(); await services.getLabSeriesSet(); await services.logAuditEventSafe();
      return { status: 200, body: { text: "baseline synthetic", guardrail: { verdict: "safe" }, citations: [] } };
    } },
  });
  const run = (caseId: fixtures.CaseId, variant: fixtures.ExperimentVariant = "jev", locale: fixtures.ExperimentLocale = "es") => runner.runExperiment(caseId, locale, variant, 0, new AbortController().signal);
  for (const locale of ["es", "de"] as const) {
    events.length = 0; intent = "personal_facts";
    const factual = await run("latest", "jev", locale);
    assert.match(factual.text, /42/); assert.ok(!factual.text.includes("38"));
    assert.deepEqual(events, ["crisis", "jev_route"]);
    intent = "knowledge"; events.length = 0;
    const explanation = await run("education", "jev", locale);
    assert.equal(explanation.disposition, "answer");
    assert.equal(explanation.supportMode, "offline");
    assert.ok(explanation.sources.some(s => s.endsWith("s2.md")), "A relevant caution cannot be removed by J2");
    assert.deepEqual(events, ["crisis", "jev_route", "jev_evidence", "generation", "guardrail", "jev_support"]);
  }
  invalidDraft = true; assert.equal((await run("education")).route, "invalid_contract"); invalidDraft = false;
  guardrail = "block"; events.length = 0; assert.equal((await run("education")).route, "guardrail_rejected"); assert.ok(!events.includes("jev_support")); guardrail = "safe";
  classifierError = true; events.length = 0; await assert.rejects(run("education"), /safety_unavailable/); assert.deepEqual(events, ["crisis"]); classifierError = false;
  crisis = true; events.length = 0; assert.equal((await run("crisis")).disposition, "crisis"); assert.deepEqual(events, ["crisis"]); crisis = false;
  assert.equal((await run("education", "current")).route, "current_fixed_sources");
  assert.equal((await run("ambiguous", "control")).disposition, "abstain");
  assert.equal((await run("insufficient", "control")).disposition, "abstain");
  assert.ok(!JSON.stringify(measurements).includes("synthetic-key"));
  console.log("chat experiments: adapter, budget, sessions, authorization, synthetic-only routing and safety OK");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
