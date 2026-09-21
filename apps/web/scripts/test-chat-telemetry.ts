/** Real LLM client + collector; fake HTTP only. No network or personal data. */
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { beginLlmMeasurement, withChatTelemetry, type ChatTelemetry } from "../lib/chat/telemetry";
import { LlmRateLimitError, parseRetryAfter } from "../lib/llm-errors";
import type { ChatRequest } from "../lib/llm";

async function main() {
  const summaries: ChatTelemetry[] = [];
  const emit = (summary: ChatTelemetry) => { summaries.push(summary); };
  let release!: () => void;
  const paused = new Promise<void>(resolve => { release = resolve; });
  let entered!: () => void;
  const firstEntered = new Promise<void>(resolve => { entered = resolve; });
  let fetches = 0;
  const fakeFetch = async (_url: string, init: RequestInit) => {
    fetches++;
    const body = JSON.parse(String(init.body));
    assert.equal(body.stage, undefined, "Instrumentation must not enter the provider payload");
    const scenario = body.messages[0].content;
    if (scenario === "synthetic-private-A") { entered(); await paused; }
    if (scenario === "limited") return new Response("private-provider-error", { status: 429, headers: { "Retry-After": "12" } });
    if (scenario === "broken") throw new Error("private-transport-error");
    if (scenario === "aborted") throw new DOMException("private-abort", "AbortError");
    const usage = scenario === "no-usage" ? undefined : scenario === "invalid-usage"
      ? { prompt_tokens: -1, completion_tokens: "5", total_tokens: 1.5 }
      : { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 };
    return Response.json({ choices: [{ message: { role: "assistant", content: "synthetic-private-answer" } }], usage });
  };
  const dependencies: Record<string, unknown> = {
    "./env": { getEnv: () => ({ LLM_PROVIDER: "external", LLM_BASE_URL: "https://private-endpoint.invalid", LLM_MODEL: "test", LLM_API_KEY: "private-key" }) },
    "./llm-errors": { LlmRateLimitError, parseRetryAfter },
    "./chat/telemetry": { beginLlmMeasurement },
  };
  const exports: { chat?: (req: ChatRequest) => Promise<string> } = {};
  const source = fs.readFileSync(new URL("../lib/llm.ts", import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports, AbortSignal, fetch: fakeFetch,
    require: (id: string) => { assert.ok(id in dependencies, id); return dependencies[id]; },
  });
  const chat = (content: string, stage: ChatRequest["stage"], signal?: AbortSignal) =>
    exports.chat!({ messages: [{ role: "user", content }], stage, signal });

  // Deliberately interleave two turns: B finishes while A is waiting on HTTP.
  const a = withChatTelemetry(async () => {
    assert.equal(await chat("synthetic-private-A", "generation"), "synthetic-private-answer");
    await chat("no-usage", "guardrail");
    return { status: 200 };
  }, emit);
  await firstEntered;
  await withChatTelemetry(async () => {
    await assert.rejects(chat("limited", "crisis"), (error: unknown) => error instanceof LlmRateLimitError && error.retryAfterSec === 12);
    return { status: 503 };
  }, emit);
  release();
  await a;
  assert.deepEqual(summaries.map(s => [s.responseStatus, s.llmCalls]), [[503, 1], [200, 2]]);
  assert.equal(summaries[0].calls[0].outcome, "rate_limited");
  assert.equal(summaries[0].calls[0].httpStatus, 429);
  assert.deepEqual(summaries[0].tokens.total, { reported: null, callsWithUsage: 0, callsWithoutUsage: 1 });
  assert.deepEqual(summaries[1].calls.map(c => c.stage), ["generation", "guardrail"]);
  assert.deepEqual(summaries[1].tokens.total, { reported: 12, callsWithUsage: 1, callsWithoutUsage: 1 });
  assert.equal(summaries[1].tokens.input.reported, 10);
  assert.equal(summaries[1].tokens.output.reported, 2);
  assert.equal(fetches, 3, "Instrumentation must not add requests or retries");

  await assert.rejects(withChatTelemetry(async () => {
    await chat("broken", "query_rewrite");
    return { status: 200 };
  }, emit), /private-transport-error/);
  assert.equal(summaries.at(-1)!.responseStatus, 500);
  assert.equal(summaries.at(-1)!.calls[0].outcome, "error");
  assert.equal(summaries.at(-1)!.calls[0].httpStatus, null);
  await withChatTelemetry(async () => {
    await chat("invalid-usage", "response_rewrite");
    return { status: 200 };
  }, emit);
  assert.equal(summaries.at(-1)!.tokens.input.reported, null);
  assert.equal(summaries.at(-1)!.tokens.output.reported, null);
  assert.equal(summaries.at(-1)!.tokens.total.reported, null);
  await assert.rejects(withChatTelemetry(async () => {
    await chat("aborted", "generation", AbortSignal.abort());
    return { status: 200 };
  }, emit));
  assert.equal(summaries.at(-1)!.calls[0].outcome, "aborted");

  const count = summaries.length;
  await withChatTelemetry(async () => ({ status: 403 }), emit);
  await chat("outside-route", undefined);
  assert.equal(summaries.length, count, "No telemetry for pre-inference denials or unrelated callers");
  assert.equal((await withChatTelemetry(async () => {
    await chat("ok", "crisis");
    return { status: 200 };
  }, () => { throw new Error("logger failed"); })).status, 200);
  const serialized = JSON.stringify(summaries);
  for (const secret of ["private", "messages", "content", "Authorization", "LLM_API_KEY"]) {
    assert.ok(!serialized.includes(secret), `Telemetry leaked ${secret}`);
  }
  for (const summary of summaries) {
    assert.ok(Number.isFinite(Date.parse(summary.startedAt)));
    assert.ok(summary.durationMs >= 0);
    for (const call of summary.calls) {
      assert.ok(call.durationMs >= 0 && call.offsetMs >= 0);
    }
  }
  console.log("chat telemetry: isolation, privacy, usage coverage, errors and unchanged calls OK");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
