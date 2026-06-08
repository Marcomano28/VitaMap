import { NextRequest, NextResponse } from 'next/server'
import {
  getStripeMode,
  getStripePriceId,
  getStripeWebhookSecret,
  stripe,
} from '@/lib/stripe'
import {
  ensureBillingTable,
  hasStripeSubscription,
  isStripeEventProcessed,
  markStripeEventProcessed,
  upsertSubscription,
} from '@/lib/billing'
import type { BillingSubscription } from '@/lib/billing'
import { randomUUID } from 'crypto'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

function mapStatus(s: string): BillingSubscription['status'] {
  switch (s) {
    case 'active':
      return 'active'
    case 'past_due':
    case 'unpaid':
    case 'paused':
      return 'past_due'
    case 'canceled':
    case 'incomplete_expired':
      return 'cancelled'
    case 'incomplete':
    case 'trialing':
    default:
      return 'pending'
  }
}

function extractId(ref: { id: string } | string | undefined | null): string | null {
  if (!ref) return null
  return typeof ref === 'string' ? ref : ref.id
}

function safeUserId(value: string | null | undefined): string {
  return value && /^[a-zA-Z0-9_-]{8,64}$/.test(value) ? value : ''
}

function isExpectedSubscription(sub: Stripe.Subscription): boolean {
  return sub.items.data.some((item) => item.price.id === getStripePriceId())
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return new NextResponse('Missing signature', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, getStripeWebhookSecret())
  } catch {
    return new NextResponse('Invalid signature', { status: 400 })
  }
  if (event.livemode !== (getStripeMode() === 'live')) {
    return new NextResponse('Stripe mode mismatch', { status: 400 })
  }
  const livemode = event.livemode ? 1 : 0

  ensureBillingTable()
  if (isStripeEventProcessed(event.id)) {
    return new NextResponse('ok', { status: 200 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = safeUserId(
        session.client_reference_id ?? session.metadata?.user_id,
      )
      const customerId = extractId(session.customer)
      const subscriptionId = extractId(session.subscription)
      if (session.mode === 'subscription' && userId && customerId && subscriptionId) {
        upsertSubscription({
          id: randomUUID(),
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: 'pending',
          amount_cents: 0,
          currency: session.currency ?? 'eur',
          current_period_end: null,
          event_created: event.created,
          livemode,
        })
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = extractId(sub.customer)
      if (!customerId || !isExpectedSubscription(sub)) break
      upsertSubscription({
        id: randomUUID(),
        user_id: safeUserId(sub.metadata?.user_id),
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        status: mapStatus(sub.status),
        amount_cents: sub.items.data[0]?.price.unit_amount ?? 0,
        currency: sub.currency,
        // current_period_end fue eliminado de Subscription en la API v22.
        // Se rellena con precisión desde invoice.period_end en los eventos de factura.
        current_period_end: null,
        event_created: event.created,
        livemode,
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = extractId(sub.customer)
      if (!customerId || !isExpectedSubscription(sub)) break
      upsertSubscription({
        id: randomUUID(),
        user_id: safeUserId(sub.metadata?.user_id),
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        status: 'cancelled',
        amount_cents: 0,
        currency: sub.currency,
        current_period_end: null,
        event_created: event.created,
        livemode,
      })
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const subRef = invoice.parent?.subscription_details?.subscription
      const customerId = extractId(invoice.customer)
      const subscriptionId = extractId(subRef)
      if (
        !customerId ||
        !subscriptionId ||
        !hasStripeSubscription(customerId, subscriptionId, livemode)
      ) break
      upsertSubscription({
        id: randomUUID(),
        user_id: '',
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        status: 'active',
        // El importe contractual viene del Price de la suscripción. Una factura
        // puede incluir impuestos, créditos o prorrateos.
        amount_cents: 0,
        currency: invoice.currency,
        // period_end está directamente en el objeto Invoice en la API v22.
        current_period_end: new Date(invoice.period_end * 1000).toISOString(),
        event_created: event.created,
        livemode,
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subRef = invoice.parent?.subscription_details?.subscription
      const customerId = extractId(invoice.customer)
      const subscriptionId = extractId(subRef)
      if (
        !customerId ||
        !subscriptionId ||
        !hasStripeSubscription(customerId, subscriptionId, livemode)
      ) break
      upsertSubscription({
        id: randomUUID(),
        user_id: '',
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        status: 'past_due',
        amount_cents: 0,
        currency: invoice.currency,
        current_period_end: null,
        event_created: event.created,
        livemode,
      })
      break
    }
  }

  markStripeEventProcessed(event.id, event.type, event.created)
  return new NextResponse('ok', { status: 200 })
}
