/** Route-level authorization/dispatch tests. All external dependencies are fakes;
 * the real route, request schema and variant policy execute without network/DB.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { ChatBody } from "../lib/chat/request";
import { resolveChatVariant } from "../lib/chat/variant";
import { llmRateLimitResult } from "../lib/chat/rate-limit-response";
import { languageContext } from "../lib/language-contract";
import type { ChatExecutionContext } from "../lib/chat/contract";

class UnauthorizedError extends Error {}
class SubscriptionRequiredError extends Error {}
const source = fs.readFileSync(new URL("../app/api/chat/route.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function harness(options: {
  enabled?: boolean;
  anonymous?: boolean;
  admin?: boolean;
  sessionActor?: string;
  noSession?: boolean;
  authError?: Error;
  killSwitch?: boolean;
  rateLimited?: boolean;
  crisis?: boolean;
  providerLimited?: boolean;
  runnerStatus?: 200 | 500 | 502 | 503;
} = {}) {
  const events: string[] = [];
  const calls: ChatExecutionContext[] = [];
  const subject = { actor: "actor_123", subject: "subject_456", anonymous: !!options.anonymous, quotaKey: "quota_123", quotaTier: "user" };
  const answer = { text: "Respuesta sintética", citations: [], guardrail: { verdict: "safe", flags: [] }, depth: "understand", editorialComposed: false, topics: [] };
  const dependencies: Record<string, unknown> = {
    "next/server": { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } },
    "@/lib/editorial-composition": { inferEditorialDepth: (_message: string, depth: string) => depth },
    "@/lib/audit": { logAuditEventSafe: async () => { events.push("audit"); } },
    "@/lib/session": { UnauthorizedError, getSessionFromRequest: async () => {
      events.push("admin-session");
      return options.noSession ? null : { user: { id: options.sessionActor ?? subject.actor, email: options.admin ? "admin@example.org" : "user@example.org" } };
    } },
    "@/lib/admin": { isAdminEmail: (email: string) => email === "admin@example.org" },
    "@/lib/env": { getEnv: () => ({ CHAT_EXPERIMENTS_ENABLED: options.enabled ?? false }) },
    "@/lib/subscription-access": { SubscriptionRequiredError },
    "@/lib/data-access-guards": { requireChatContext: async () => {
      events.push("authorize");
      if (options.authError) throw options.authError;
      return subject;
    } },
    "@/lib/language-contract": { languageContext },
    "@/lib/crisis": {
      detectCrisis: async () => { events.push("crisis"); return { crisis: !!options.crisis, classifierError: !!options.providerLimited, ...(options.providerLimited ? { rateLimit: { retryAfterSec: 45 } } : {}) }; },
      crisisResourcesText: () => "Recursos de prueba",
    },
    "@/lib/rate-limit": { checkRateLimit: () => { events.push("rate"); return { allowed: !options.rateLimited, retryAfterSec: 60 }; } },
    "@/lib/llm-quota": {
      consumeLlmQuota: () => { events.push("quota"); return { allowed: !options.killSwitch, reason: "kill_switch", resetsInSec: 60 }; },
      refundLlmQuota: (key: string) => { assert.equal(key, subject.quotaKey); events.push("refund"); },
    },
    "@/lib/chat/request": { ChatBody },
    "@/lib/chat/variant": { resolveChatVariant },
    "@/lib/chat/rate-limit-response": { llmRateLimitResult },
    "@/lib/chat/current": { runCurrentChat: async (context: ChatExecutionContext) => {
      events.push("runner"); calls.push(context);
      const status = options.runnerStatus ?? 200;
      if (status === 503) return llmRateLimitResult(45);
      return { status, body: status === 200 ? answer : { error: status === 500 ? "retrieval_failed" : "llm_failed" } };
    } },
  };
  const exports: { POST?: (req: Request) => Promise<Response> } = {};
  vm.runInNewContext(compiled, {
    exports, AbortSignal, Date,
    console: { info() {}, error() {} },
    require: (id: string) => {
      assert.ok(Object.hasOwn(dependencies, id), `Unexpected dependency: ${id}`);
      return dependencies[id];
    },
  }, { filename: "chat-route-test.cjs" });
  return {
    events, calls, subject, answer,
    post: (body: Record<string, unknown> = {}) => exports.POST!(new Request("https://vitamap.test/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Pregunta sintética", locale: "es", ...body }),
    })),
  };
}

async function main() {
  for (const enabled of [false, true]) {
    const h = harness({ enabled });
    const response = await h.post();
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), h.answer);
    assert.deepEqual(h.events, ["authorize", "rate", "quota", "crisis", "runner"]);
    assert.equal(h.calls[0].subject, h.subject);
    assert.equal(h.calls[0].input.variant, "current");
    assert.equal(h.calls[0].language.answerLocale, "es");
    assert.ok(h.calls[0].deadline instanceof AbortSignal);
  }
  console.log("ok: default/current retains payload, subject, controls and no admin lookup");

  for (const options of [
    {}, { enabled: true }, { enabled: true, admin: true, noSession: true },
    { enabled: true, admin: true, sessionActor: "another_actor" },
    { enabled: true, admin: true, anonymous: true },
  ]) {
    const h = harness(options);
    const response = await h.post({ variant: "jev", demoConsent: true, isAdmin: true, email: "admin@example.org", subject: "spoofed_subject" });
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error, "chat_experiment_forbidden");
    assert.ok(h.events.includes("refund"));
    assert.ok(!h.events.includes("crisis") && !h.events.includes("runner"));
  }
  console.log("ok: disabled, non-admin, missing/mismatched session and anonymous requests denied; spoofing grants nothing");

  const admin = harness({ enabled: true, admin: true });
  const unavailable = await admin.post({ variant: "jev" });
  assert.equal(unavailable.status, 503);
  assert.equal((await unavailable.json()).error, "chat_variant_unavailable");
  assert.deepEqual(admin.events, ["authorize", "rate", "quota", "admin-session", "refund"]);
  // Same harness, next ordinary request: selecting a variant changed no global state.
  assert.equal((await admin.post({ variant: "current" })).status, 200);
  assert.equal(admin.calls.length, 1);
  console.log("ok: authorized Jev is explicitly unavailable, never runs current and does not alter the next turn");

  for (const variant of ["unknown", null, true, { isAdmin: true }]) {
    const h = harness({ enabled: true, admin: true });
    assert.equal((await h.post({ variant })).status, 400);
    assert.deepEqual(h.events, ["authorize", "rate", "quota", "refund"]);
  }
  const demo = harness({ anonymous: true });
  assert.equal((await demo.post()).status, 403);
  assert.ok(!demo.events.includes("runner"));
  assert.equal((await demo.post({ demoConsent: true })).status, 200);
  console.log("ok: invalid variants rejected and anonymous demo still requires consent");

  for (const [options, status] of [
    [{ authError: new UnauthorizedError() }, 401],
    [{ authError: new SubscriptionRequiredError() }, 402],
    [{ killSwitch: true }, 503],
    [{ rateLimited: true }, 429],
  ] as const) {
    const h = harness({ ...options, enabled: true, admin: true });
    assert.equal((await h.post({ variant: "jev" })).status, status);
    assert.ok(!h.events.includes("admin-session") && !h.events.includes("runner") && !h.events.includes("crisis"));
  }
  const limited = harness({ providerLimited: true });
  const limitedResponse = await limited.post();
  assert.equal(limitedResponse.status, 503);
  assert.equal(limitedResponse.headers.get("retry-after"), "45");
  assert.equal((await limitedResponse.json()).error, "llm_rate_limited");
  assert.ok(!limited.events.includes("runner"));
  assert.ok(!limited.events.includes("refund")); // An inference was attempted.
  const generatedLimit = harness({ runnerStatus: 503 });
  const generatedResponse = await generatedLimit.post();
  assert.equal(generatedResponse.status, 503);
  assert.equal(generatedResponse.headers.get("retry-after"), "45");
  console.log("ok: provider 429 stops after crisis and propagates Retry-After from any runner stage");
  const crisis = harness({ crisis: true });
  assert.equal((await (await crisis.post()).json()).crisis, true);
  assert.ok(!crisis.events.includes("runner"));
  for (const runnerStatus of [500, 502] as const) {
    const h = harness({ runnerStatus });
    assert.equal((await h.post()).status, runnerStatus);
  }
  console.log("ok: auth, billing, global kill switch, rate limit, crisis and runner error responses preserved");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
