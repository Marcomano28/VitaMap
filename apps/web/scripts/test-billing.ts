import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import Database from 'better-sqlite3'
import {
  ensureBillingTable,
  getSubscription,
  hasStripeSubscription,
  hasActiveSubscription,
  isStripeEventProcessed,
  markStripeEventProcessed,
  upsertSubscription,
} from '../lib/billing'

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vitamap-billing-'))
const dbPath = path.join(dir, 'auth.sqlite')
const base = {
  id: 'row-1',
  user_id: 'user_12345678',
  stripe_customer_id: 'cus_123',
  stripe_subscription_id: 'sub_123',
  amount_cents: 600,
  currency: 'eur',
  livemode: 0 as const,
}

try {
  upsertSubscription(
    {
      ...base,
      status: 'active',
      current_period_end: '2026-07-08T00:00:00.000Z',
      event_created: 200,
    },
    dbPath,
  )

  // Checkout tardío: asocia al usuario pero no degrada active a pending.
  upsertSubscription(
    {
      ...base,
      id: 'row-2',
      status: 'pending',
      amount_cents: 0,
      current_period_end: null,
      event_created: 100,
    },
    dbPath,
  )

  let subscription = getSubscription(base.user_id, dbPath, 'test')
  assert.equal(subscription?.status, 'active')
  assert.equal(subscription?.amount_cents, 600)
  assert.equal(subscription?.current_period_end, '2026-07-08T00:00:00.000Z')
  assert.equal(hasActiveSubscription(base.user_id, dbPath, 'test'), true)
  assert.equal(hasActiveSubscription(base.user_id, dbPath, 'live'), false)
  assert.equal(
    hasStripeSubscription(
      base.stripe_customer_id,
      base.stripe_subscription_id,
      0,
      dbPath,
    ),
    true,
  )
  assert.equal(
    hasStripeSubscription(
      base.stripe_customer_id,
      base.stripe_subscription_id,
      1,
      dbPath,
    ),
    false,
  )

  // Un evento de suscripción posterior no borra el periodo de factura.
  upsertSubscription(
    {
      ...base,
      id: 'row-3',
      status: 'active',
      current_period_end: null,
      event_created: 300,
    },
    dbPath,
  )
  subscription = getSubscription(base.user_id, dbPath, 'test')
  assert.equal(subscription?.current_period_end, '2026-07-08T00:00:00.000Z')

  // Una factura antigua no puede retroceder la fecha de renovación.
  upsertSubscription(
    {
      ...base,
      id: 'row-old-period',
      status: 'active',
      amount_cents: 0,
      current_period_end: '2026-06-08T00:00:00.000Z',
      event_created: 150,
    },
    dbPath,
  )
  assert.equal(
    getSubscription(base.user_id, dbPath, 'test')?.current_period_end,
    '2026-07-08T00:00:00.000Z',
  )

  // Un fallo antiguo no puede revocar un pago más reciente.
  upsertSubscription(
    {
      ...base,
      id: 'row-4',
      status: 'past_due',
      amount_cents: 0,
      current_period_end: null,
      event_created: 150,
    },
    dbPath,
  )
  assert.equal(getSubscription(base.user_id, dbPath, 'test')?.status, 'active')

  // Un fallo realmente posterior sí bloquea el acceso.
  upsertSubscription(
    {
      ...base,
      id: 'row-5',
      status: 'past_due',
      amount_cents: 0,
      current_period_end: null,
      event_created: 400,
    },
    dbPath,
  )
  assert.equal(getSubscription(base.user_id, dbPath, 'test')?.status, 'past_due')
  assert.equal(hasActiveSubscription(base.user_id, dbPath, 'test'), false)
  assert.equal(
    hasActiveSubscription('user_without_subscription', dbPath, 'test'),
    false,
  )

  // Si existen filas históricas para dos customers, manda el evento más
  // reciente. Una fila active antigua no puede conservar acceso.
  upsertSubscription(
    {
      ...base,
      id: 'multi-old',
      user_id: 'user_multi_123',
      stripe_customer_id: 'cus_multi_old',
      stripe_subscription_id: 'sub_multi_old',
      status: 'active',
      current_period_end: null,
      event_created: 100,
    },
    dbPath,
  )
  upsertSubscription(
    {
      ...base,
      id: 'multi-new',
      user_id: 'user_multi_123',
      stripe_customer_id: 'cus_multi_new',
      stripe_subscription_id: 'sub_multi_new',
      status: 'past_due',
      current_period_end: null,
      event_created: 200,
    },
    dbPath,
  )
  assert.equal(getSubscription('user_multi_123', dbPath, 'test')?.status, 'past_due')
  assert.equal(hasActiveSubscription('user_multi_123', dbPath, 'test'), false)

  for (const [status, suffix] of [
    ['pending', 'pending'],
    ['cancelled', 'cancelled'],
  ] as const) {
    upsertSubscription(
      {
        ...base,
        id: `row-${suffix}`,
        user_id: `user_${suffix}_123`,
        stripe_customer_id: `cus_${suffix}`,
        stripe_subscription_id: `sub_${suffix}`,
        status,
        current_period_end: null,
        event_created: 600,
      },
      dbPath,
    )
    assert.equal(
      hasActiveSubscription(`user_${suffix}_123`, dbPath, 'test'),
      false,
    )
  }

  upsertSubscription(
    {
      ...base,
      id: 'row-live',
      stripe_customer_id: 'cus_live_123',
      stripe_subscription_id: 'sub_live_123',
      status: 'active',
      event_created: 700,
      livemode: 1,
      current_period_end: null,
    },
    dbPath,
  )
  assert.equal(hasActiveSubscription(base.user_id, dbPath, 'test'), false)
  assert.equal(hasActiveSubscription(base.user_id, dbPath, 'live'), true)

  // Una coincidencia de IDs entre TEST y LIVE nunca convierte una fila.
  upsertSubscription(
    {
      ...base,
      id: 'row-mode-collision',
      user_id: 'user_collision_live',
      status: 'active',
      event_created: 750,
      livemode: 1,
      current_period_end: null,
    },
    dbPath,
  )
  assert.equal(
    getSubscription(base.user_id, dbPath, 'test')?.stripe_customer_id,
    base.stripe_customer_id,
  )
  assert.equal(
    getSubscription('user_collision_live', dbPath, 'live'),
    undefined,
  )

  upsertSubscription(
    {
      ...base,
      id: 'row-cancelled-late-invoice',
      user_id: 'user_cancelled_late',
      stripe_customer_id: 'cus_cancelled_late',
      stripe_subscription_id: 'sub_cancelled_late',
      status: 'cancelled',
      current_period_end: null,
      event_created: 800,
    },
    dbPath,
  )
  upsertSubscription(
    {
      ...base,
      id: 'row-cancelled-late-invoice-2',
      user_id: '',
      stripe_customer_id: 'cus_cancelled_late',
      stripe_subscription_id: 'sub_cancelled_late',
      status: 'active',
      current_period_end: '2026-08-08T00:00:00.000Z',
      event_created: 900,
    },
    dbPath,
  )
  assert.equal(
    getSubscription('user_cancelled_late', dbPath, 'test')?.status,
    'cancelled',
  )

  // Una suscripcion nueva del mismo customer si puede reactivar el acceso.
  upsertSubscription(
    {
      ...base,
      id: 'row-reactivated',
      user_id: 'user_cancelled_late',
      stripe_customer_id: 'cus_cancelled_late',
      stripe_subscription_id: 'sub_reactivated',
      status: 'active',
      current_period_end: null,
      event_created: 1000,
    },
    dbPath,
  )
  assert.equal(
    getSubscription('user_cancelled_late', dbPath, 'test')?.status,
    'active',
  )

  assert.equal(isStripeEventProcessed('evt_1', dbPath), false)
  markStripeEventProcessed('evt_1', 'invoice.payment_succeeded', 500, dbPath)
  assert.equal(isStripeEventProcessed('evt_1', dbPath), true)
  markStripeEventProcessed('evt_1', 'invoice.payment_succeeded', 500, dbPath)

  const legacyDbPath = path.join(dir, 'legacy-auth.sqlite')
  const legacyDb = new Database(legacyDbPath)
  legacyDb.exec(`
    CREATE TABLE billing_subscription (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      stripe_customer_id TEXT UNIQUE NOT NULL,
      stripe_subscription_id TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'eur',
      current_period_end TEXT,
      status_event_created INTEGER NOT NULL DEFAULT 0,
      period_event_created INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO billing_subscription (
      id, user_id, stripe_customer_id, stripe_subscription_id, status,
      amount_cents, currency, status_event_created, period_event_created
    ) VALUES (
      'legacy', 'user_legacy_123', 'cus_legacy', 'sub_legacy', 'active',
      600, 'eur', 100, 100
    );
  `)
  legacyDb.close()

  ensureBillingTable(legacyDbPath)
  assert.equal(
    hasActiveSubscription('user_legacy_123', legacyDbPath, 'test'),
    true,
  )
  assert.equal(
    hasActiveSubscription('user_legacy_123', legacyDbPath, 'live'),
    false,
  )

  console.log('Billing: todas las pruebas pasaron.')
} finally {
  fs.rmSync(dir, { recursive: true, force: true })
}
