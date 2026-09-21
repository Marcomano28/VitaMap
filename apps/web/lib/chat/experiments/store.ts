import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { MAX_EXPERIMENT_CALLS, type CaseId, type ExperimentLocale, type ExperimentVariant } from "./fixtures";

const TTL = 30 * 60_000;
const LEASE = 6 * 60_000;
export type ExperimentSession = {
  id: string; owner: string; caseId: CaseId; locale: ExperimentLocale; variant: ExperimentVariant;
  version: string; expiresAt: number; step: number; status: "ready" | "running" | "done" | "failed";
  results: unknown[];
};
type Row = Omit<ExperimentSession, "results"> & { results: string };
export class ExperimentStoreError extends Error {
  constructor(readonly code: "not_found" | "stale_session" | "busy" | "budget_exhausted" | "session_limit") { super(code); }
}

/** Separate synthetic sessions only. Never reads or grants access to user memory.
 * SQLite transactions serialize reservations across processes sharing this DB. */
export class ExperimentStore {
  private db: Database.Database;
  constructor(filename: string) {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    this.db = new Database(filename);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("busy_timeout = 5000");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chat_experiment_session (
        id TEXT PRIMARY KEY, owner TEXT NOT NULL, caseId TEXT NOT NULL, locale TEXT NOT NULL,
        variant TEXT NOT NULL, version TEXT NOT NULL, expiresAt INTEGER NOT NULL,
        step INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'ready',
        startedAt INTEGER, results TEXT NOT NULL DEFAULT '[]'
      );
      CREATE TABLE IF NOT EXISTS chat_experiment_budget (day TEXT PRIMARY KEY, reserved INTEGER NOT NULL);
    `);
  }
  close() { this.db.close(); }
  private prune(now: number) {
    this.db.prepare("UPDATE chat_experiment_session SET status='failed' WHERE status='running' AND startedAt < ?").run(now - LEASE);
    this.db.prepare("DELETE FROM chat_experiment_session WHERE expiresAt < ? AND status != 'running'").run(now);
    this.db.prepare("DELETE FROM chat_experiment_budget WHERE day < ?").run(new Date(now - 7 * 86400_000).toISOString().slice(0, 10));
  }
  create(owner: string, caseId: CaseId, locale: ExperimentLocale, variant: ExperimentVariant, version: string, now = Date.now()) {
    return this.db.transaction(() => {
      this.prune(now);
      const { n } = this.db.prepare("SELECT count(*) AS n FROM chat_experiment_session").get() as { n: number };
      if (n >= 200) throw new ExperimentStoreError("session_limit");
      const id = randomUUID();
      this.db.prepare("INSERT INTO chat_experiment_session(id,owner,caseId,locale,variant,version,expiresAt) VALUES(?,?,?,?,?,?,?)")
        .run(id, owner, caseId, locale, variant, version, now + TTL);
      return this.read(id, owner, now);
    }).immediate();
  }
  read(id: string, owner: string, now = Date.now()): ExperimentSession {
    const row = this.db.prepare("SELECT id,owner,caseId,locale,variant,version,expiresAt,step,status,results FROM chat_experiment_session WHERE id=? AND owner=? AND expiresAt>?").get(id, owner, now) as Row | undefined;
    if (!row) throw new ExperimentStoreError("not_found");
    return { ...row, results: JSON.parse(row.results) };
  }
  claim(id: string, owner: string, step: number, version: string, dailyMax: number, now = Date.now()) {
    return this.db.transaction(() => {
      this.prune(now);
      const session = this.read(id, owner, now);
      if (session.version !== version || session.step !== step || session.status !== "ready") throw new ExperimentStoreError("stale_session");
      const running = this.db.prepare("SELECT id FROM chat_experiment_session WHERE status='running' LIMIT 1").get();
      if (running) throw new ExperimentStoreError("busy");
      const day = new Date(now).toISOString().slice(0, 10);
      const used = (this.db.prepare("SELECT reserved FROM chat_experiment_budget WHERE day=?").get(day) as { reserved: number } | undefined)?.reserved ?? 0;
      if (used + MAX_EXPERIMENT_CALLS > dailyMax) throw new ExperimentStoreError("budget_exhausted");
      this.db.prepare("INSERT INTO chat_experiment_budget(day,reserved) VALUES(?,?) ON CONFLICT(day) DO UPDATE SET reserved=reserved+excluded.reserved").run(day, MAX_EXPERIMENT_CALLS);
      this.db.prepare("UPDATE chat_experiment_session SET status='running',startedAt=? WHERE id=?").run(now, id);
      return session;
    }).immediate();
  }
  finish(id: string, owner: string, step: number, result: unknown, failed: boolean, totalSteps: number) {
    this.db.transaction(() => {
      const row = this.db.prepare("SELECT results FROM chat_experiment_session WHERE id=? AND owner=? AND step=? AND status='running'").get(id, owner, step) as { results: string } | undefined;
      if (!row) throw new ExperimentStoreError("stale_session");
      const results = [...JSON.parse(row.results), result];
      const encoded = JSON.stringify(results);
      if (encoded.length > 150_000) throw new Error("experiment_result_too_large");
      this.db.prepare("UPDATE chat_experiment_session SET results=?,step=step+1,status=?,startedAt=NULL WHERE id=? AND owner=?")
        .run(encoded, failed ? "failed" : step + 1 >= totalSteps ? "done" : "ready", id, owner);
    }).immediate();
  }
}
