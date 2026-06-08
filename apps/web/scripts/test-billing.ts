import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  getSubscription,
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

  let subscription = getSubscription(base.user_id, dbPath)
  assert.equal(subscription?.status, 'active')
  assert.equal(subscription?.amount_cents, 600)
  assert.equal(subscription?.current_period_end, '2026-07-08T00:00:00.000Z')
  assert.equal(hasActiveSubscription(base.user_id, dbPath), true)

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
  subscription = getSubscription(base.user_id, dbPath)
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
    getSubscription(base.user_id, dbPath)?.current_period_end,
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
  assert.equal(getSubscription(base.user_id, dbPath)?.status, 'active')

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
  assert.equal(getSubscription(base.user_id, dbPath)?.status, 'past_due')
  assert.equal(hasActiveSubscription(base.user_id, dbPath), false)
  assert.equal(hasActiveSubscription('user_without_subscription', dbPath), false)

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
  assert.equal(getSubscription('user_multi_123', dbPath)?.status, 'past_due')
  assert.equal(hasActiveSubscription('user_multi_123', dbPath), false)

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
    assert.equal(hasActiveSubscription(`user_${suffix}_123`, dbPath), false)
  }

  assert.equal(isStripeEventProcessed('evt_1', dbPath), false)
  markStripeEventProcessed('evt_1', 'invoice.payment_succeeded', 500, dbPath)
  assert.equal(isStripeEventProcessed('evt_1', dbPath), true)
  markStripeEventProcessed('evt_1', 'invoice.payment_succeeded', 500, dbPath)

  console.log('Billing: todas las pruebas pasaron.')
} finally {
  fs.rmSync(dir, { recursive: true, force: true })
}
