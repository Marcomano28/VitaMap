import Database from 'better-sqlite3'
import path from 'path'
import { getStripeMode, type StripeMode } from './stripe'

function getDbPath() {
  return process.env.AUTH_DB_PATH ?? path.join(process.env.DATA_ROOT ?? './data', 'auth.sqlite')
}

function getDb(dbPath = getDbPath()) {
  const db = new Database(dbPath)
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
    status_event_created    INTEGER NOT NULL DEFAULT 0,
    period_event_created    INTEGER NOT NULL DEFAULT 0,
    livemode                INTEGER NOT NULL DEFAULT 0,
    created_at              TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at              TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_billing_user ON billing_subscription(user_id);
  CREATE INDEX IF NOT EXISTS idx_billing_stripe ON billing_subscription(stripe_customer_id);
  CREATE TABLE IF NOT EXISTS stripe_webhook_event (
    event_id       TEXT PRIMARY KEY,
    event_type     TEXT NOT NULL,
    event_created  INTEGER NOT NULL,
    processed_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );
`

function ensureBillingSchema(db: Database.Database) {
  db.exec(CREATE_TABLE_SQL)
  const columns = db.prepare('PRAGMA table_info(billing_subscription)').all() as Array<{
    name: string
  }>
  if (!columns.some((column) => column.name === 'status_event_created')) {
    db.exec(
      'ALTER TABLE billing_subscription ADD COLUMN status_event_created INTEGER NOT NULL DEFAULT 0',
    )
  }
  if (!columns.some((column) => column.name === 'period_event_created')) {
    db.exec(
      'ALTER TABLE billing_subscription ADD COLUMN period_event_created INTEGER NOT NULL DEFAULT 0',
    )
  }
  if (!columns.some((column) => column.name === 'livemode')) {
    // Las filas anteriores a esta migracion proceden del piloto TEST.
    db.exec(
      'ALTER TABLE billing_subscription ADD COLUMN livemode INTEGER NOT NULL DEFAULT 0',
    )
  }
}

export function ensureBillingTable(dbPath?: string) {
  const db = getDb(dbPath)
  try {
    ensureBillingSchema(db)
  } finally {
    db.close()
  }
}

export function getSubscription(
  userId: string,
  dbPath?: string,
  mode: StripeMode = getStripeMode(),
) {
  const db = getDb(dbPath)
  try {
    ensureBillingSchema(db)
    return db.prepare(
      `SELECT *
       FROM billing_subscription
       WHERE user_id = ? AND livemode = ?
       ORDER BY
         status_event_created DESC,
         CASE status WHEN 'active' THEN 0 ELSE 1 END,
         updated_at DESC
       LIMIT 1`
    ).get(userId, mode === 'live' ? 1 : 0) as BillingSubscription | undefined
  } finally {
    db.close()
  }
}

export function hasStripeSubscription(
  customerId: string,
  subscriptionId: string,
  livemode: 0 | 1,
  dbPath?: string,
): boolean {
  const db = getDb(dbPath)
  try {
    ensureBillingSchema(db)
    return Boolean(
      db.prepare(
        `SELECT 1
         FROM billing_subscription
         WHERE stripe_customer_id = ?
           AND stripe_subscription_id = ?
           AND livemode = ?`,
      ).get(customerId, subscriptionId, livemode),
    )
  } finally {
    db.close()
  }
}

export function upsertSubscription(
  data: BillingSubscriptionUpdate,
  dbPath?: string,
) {
  const db = getDb(dbPath)
  try {
    ensureBillingSchema(db)
    db.prepare(`
      INSERT INTO billing_subscription (
        id,
        user_id,
        stripe_customer_id,
        stripe_subscription_id,
        status,
        amount_cents,
        currency,
        current_period_end,
        status_event_created,
        period_event_created,
        livemode,
        updated_at
      )
      VALUES (
        @id,
        @user_id,
        @stripe_customer_id,
        @stripe_subscription_id,
        @status,
        @amount_cents,
        @currency,
        @current_period_end,
        @event_created,
        CASE WHEN @current_period_end IS NULL THEN 0 ELSE @event_created END,
        @livemode,
        datetime('now')
      )
      ON CONFLICT(stripe_customer_id) DO UPDATE SET
        stripe_subscription_id = COALESCE(
          excluded.stripe_subscription_id,
          billing_subscription.stripe_subscription_id
        ),
        status = CASE
          WHEN billing_subscription.status = 'cancelled'
            AND excluded.stripe_subscription_id = billing_subscription.stripe_subscription_id
            THEN billing_subscription.status
          WHEN excluded.status = 'pending'
            AND billing_subscription.status != 'pending'
            THEN billing_subscription.status
          WHEN excluded.status_event_created < billing_subscription.status_event_created
            THEN billing_subscription.status
          ELSE excluded.status
        END,
        status_event_created = CASE
          WHEN billing_subscription.status = 'cancelled'
            AND excluded.stripe_subscription_id = billing_subscription.stripe_subscription_id
            THEN billing_subscription.status_event_created
          WHEN excluded.status = 'pending'
            AND billing_subscription.status != 'pending'
            THEN billing_subscription.status_event_created
          WHEN excluded.status_event_created < billing_subscription.status_event_created
            THEN billing_subscription.status_event_created
          ELSE excluded.status_event_created
        END,
        amount_cents = CASE
          WHEN excluded.amount_cents > 0
            THEN excluded.amount_cents
          ELSE billing_subscription.amount_cents
        END,
        currency = CASE
          WHEN excluded.currency != ''
            THEN excluded.currency
          ELSE billing_subscription.currency
        END,
        current_period_end = CASE
          WHEN excluded.current_period_end IS NOT NULL
            AND excluded.status_event_created >= billing_subscription.period_event_created
            THEN excluded.current_period_end
          ELSE billing_subscription.current_period_end
        END,
        period_event_created = CASE
          WHEN excluded.current_period_end IS NOT NULL
            AND excluded.status_event_created >= billing_subscription.period_event_created
            THEN excluded.status_event_created
          ELSE billing_subscription.period_event_created
        END,
        user_id = CASE
          WHEN excluded.user_id != ''
            THEN excluded.user_id
          ELSE billing_subscription.user_id
        END,
        livemode = excluded.livemode,
        updated_at = datetime('now')
      WHERE billing_subscription.livemode = excluded.livemode
    `).run(data)
  } finally {
    db.close()
  }
}

export function isStripeEventProcessed(eventId: string, dbPath?: string): boolean {
  const db = getDb(dbPath)
  try {
    ensureBillingSchema(db)
    return Boolean(
      db.prepare('SELECT 1 FROM stripe_webhook_event WHERE event_id = ?').get(eventId),
    )
  } finally {
    db.close()
  }
}

export function markStripeEventProcessed(
  eventId: string,
  eventType: string,
  eventCreated: number,
  dbPath?: string,
): void {
  const db = getDb(dbPath)
  try {
    ensureBillingSchema(db)
    db.prepare(
      `INSERT OR IGNORE INTO stripe_webhook_event
        (event_id, event_type, event_created)
       VALUES (?, ?, ?)`,
    ).run(eventId, eventType, eventCreated)
  } finally {
    db.close()
  }
}

export function hasActiveSubscription(
  userId: string,
  dbPath?: string,
  mode: StripeMode = getStripeMode(),
): boolean {
  const sub = getSubscription(userId, dbPath, mode)
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
  status_event_created: number
  period_event_created: number
  livemode: 0 | 1
  created_at: string
  updated_at: string
}

export interface BillingSubscriptionUpdate {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string | null
  status: BillingSubscription['status']
  amount_cents: number
  currency: string
  current_period_end: string | null
  event_created: number
  livemode: 0 | 1
}
