/** Real LLM client + collector; fake HTTP only. No network or personal data. */
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
import { beginLlmMeasurement, measureChatStage, measureChatStageSync, withChatTelemetry, type ChatTelemetry } from "../lib/chat/telemetry";
import { LlmRateLimitError, parseRetryAfter } from "../lib/llm-errors";
import type { ChatRequest } from "../lib/llm";
import type { RagResult } from "../lib/qmd";

async function testRetrieval(emit: (summary: ChatTelemetry) => void) {
  // Execute the real QMD adapter with fake stores/files. Both search promises
  // must start before either completes: instrumentation must preserve parallelism.
  const realRequire = createRequire(new URL("../lib/qmd.ts", import.meta.url));
  let opened = 0;
  let searches = 0;
  let release!: () => void;
  const bothSearching = new Promise<void>(resolve => { release = resolve; });
  const dependencies: Record<string, unknown> = {
    "node:fs/promises": { mkdir: async () => {} },
    "./env": { getEnv: () => ({ DATA_ROOT: "/synthetic-private-root", KB_INDEX_PATH: "/synthetic-private-root/kb.sqlite" }) },
    "./frontmatter": { readPersonalFrontmatter: async () => ({}), readEvidenceFrontmatter: async () => ({}) },
    "./chat/telemetry": { measureChatStage, measureChatStageSync },
    "@tobilu/qmd": { createStore: async (options: { config: { collections: Record<string, unknown> } }) => {
      opened++;
      const collection = "memory" in options.config.collections ? "memory" : "kb";
      return { search: async (options: { rerank: boolean; candidateLimit: number }) => {
        assert.equal(options.rerank, false);
        assert.equal(options.candidateLimit, 10);
        searches++;
        if (searches >= 2) release();
        await bothSearching;
        return [{ displayPath: `${collection}/synthetic-private.md`, bestChunk: "synthetic-private-document", score: 0.9 }];
      } };
    } },
  };
  const exports: { queryMemoryAndKB?: (user: string, query: string) => Promise<RagResult> } = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL("../lib/qmd.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, {
    exports, process: { env: {} }, console: { info() {}, error() {} },
    require: (id: string) => Object.hasOwn(dependencies, id) ? dependencies[id] : realRequire(id),
  });
  let first: RagResult | undefined;
  for (let i = 0; i < 2; i++) {
    await withChatTelemetry(async () => {
      const result = await measureChatStage("qmd_retrieval", () => exports.queryMemoryAndKB!("synthetic-private-user", "synthetic-private-query"));
      assert.equal(result.personal[0].snippet, "synthetic-private-document");
      assert.equal(result.evidence[0].snippet, "synthetic-private-document");
      if (first) assert.deepEqual(result, first);
      first = result;
      return { status: 200 };
    }, emit);
  }
  assert.equal(opened, 2, "Store reuse survives instrumentation");
  assert.equal(searches, 4, "Exactly two searches per turn, without retries");
}

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
    assert.equal(await measureChatStage("query_resolution", () => chat("synthetic-private-A", "generation")), "synthetic-private-answer");
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
  assert.equal(summaries[0].spans.length, 0);
  assert.equal(summaries[1].spans[0].stage, "query_resolution");
  assert.equal(summaries[1].spans[0].outcome, "ok");
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

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      testRetrieval(emit),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Retrieval searches stopped running in parallel")), 5_000);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
  for (const summary of summaries.slice(-2)) {
    assert.equal(summary.schemaVersion, 2);
    assert.equal(summary.llmCalls, 0, "QMD spans must not inflate LLM calls or tokens");
    assert.equal(summary.tokens.total.reported, null);
    assert.deepEqual(summary.spans.map(s => s.stage), ["qmd_retrieval", "memory_store", "kb_store", "memory_search", "kb_search", "memory_documents", "kb_documents", "kb_lens_documents", "evidence_selection"]);
    assert.ok(summary.spans.every(s => s.outcome === "ok"));
  }

  // If one parallel branch fails, the other may outlive the response. It must
  // remain explicitly unfinished in the emitted snapshot, even after resolving.
  let finishPending!: () => void;
  const pending = new Promise<void>(resolve => { finishPending = resolve; });
  let lateWork!: Promise<void>;
  const originalError = new Error("synthetic-private-error");
  await assert.rejects(withChatTelemetry(async () => {
    await measureChatStage("qmd_retrieval", () => {
      lateWork = measureChatStage("memory_search", () => pending);
      return Promise.all([
        lateWork,
        measureChatStage("kb_search", async () => { throw originalError; }),
      ]);
    });
    return { status: 200 };
  }, emit), error => error === originalError);
  assert.deepEqual(summaries.at(-1)!.spans.map(s => s.outcome), ["error", "unfinished", "error"]);
  const snapshot = JSON.stringify(summaries.at(-1));
  finishPending();
  await lateWork;
  assert.equal(JSON.stringify(summaries.at(-1)), snapshot);
  await withChatTelemetry(async () => {
    const value = { content: "synthetic-private-value" };
    assert.equal(measureChatStageSync("prompt_preparation", () => value), value);
    assert.throws(() => measureChatStageSync("evidence_selection", () => { throw originalError; }), error => error === originalError);
    return { status: 200 };
  }, emit);
  assert.deepEqual(summaries.at(-1)!.spans.map(s => s.outcome), ["ok", "error"]);
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
    for (const span of summary.spans) {
      assert.ok(span.durationMs >= 0 && span.offsetMs >= 0);
    }
  }
  console.log("chat telemetry: isolation, privacy, usage coverage, errors and unchanged calls OK");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
