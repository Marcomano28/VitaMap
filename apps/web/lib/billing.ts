import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = process.env.AUTH_DB_PATH ?? path.join(process.env.DATA_ROOT ?? './data', 'auth.sqlite')

function getDb() {
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  return db
}

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS billing_subscription (
    id                      TEXT PRIMARY KEY,
    user_id                 TEXT NOT NULL,
    stripe_customer_id      TEXT UNIQUE NOT NULL,
    stripe_subscription_id  TEXT UNIQUE,
    status                  TEXT NOT NULL DEFAULT 'pending',
    amount_cents            INTEGER NOT NULL,
    currency                TEXT NOT NULL DEFAULT 'eur',
    current_period_end      TEXT,
    created_at              TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at              TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_billing_user ON billing_subscription(user_id);
  CREATE INDEX IF NOT EXISTS idx_billing_stripe ON billing_subscription(stripe_customer_id);
`

export function ensureBillingTable() {
  const db = getDb()
  db.exec(CREATE_TABLE_SQL)
  db.close()
}

export function getSubscription(userId: string) {
  const db = getDb()
  db.exec(CREATE_TABLE_SQL)
  const row = db.prepare(
    `SELECT * FROM billing_subscription WHERE user_id = ? LIMIT 1`
  ).get(userId) as BillingSubscription | undefined
  db.close()
  return row
}

export function upsertSubscription(data: Partial<BillingSubscription> & { stripe_customer_id: string }) {
  const db = getDb()
  db.exec(CREATE_TABLE_SQL)
  db.prepare(`
    INSERT INTO billing_subscription (id, user_id, stripe_customer_id, stripe_subscription_id, status, amount_cents, currency, current_period_end, updated_at)
    VALUES (@id, @user_id, @stripe_customer_id, @stripe_subscription_id, @status, @amount_cents, @currency, @current_period_end, datetime('now'))
    ON CONFLICT(stripe_customer_id) DO UPDATE SET
      stripe_subscription_id = excluded.stripe_subscription_id,
      status                 = excluded.status,
      amount_cents           = excluded.amount_cents,
      current_period_end     = excluded.current_period_end,
      updated_at             = datetime('now')
  `).run(data)
  db.close()
}

export function hasActiveSubscription(userId: string): boolean {
  const sub = getSubscription(userId)
  return sub?.status === 'active'
}

export interface BillingSubscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string | null
  status: 'pending' | 'active' | 'past_due' | 'cancelled'
  amount_cents: number
  currency: string
  current_period_end: string | null
  created_at: string
  updated_at: string
}
