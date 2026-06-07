import { NextRequest, NextResponse } from 'next/server'
import { stripe, WEBHOOK_SECRET } from '@/lib/stripe'
import { upsertSubscription, ensureBillingTable } from '@/lib/billing'
import { randomUUID } from 'crypto'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return new NextResponse('Missing signature', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
  } catch {
    return new NextResponse('Invalid signature', { status: 400 })
  }

  ensureBillingTable()

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id ?? ''
      upsertSubscription({
        id: randomUUID(),
        user_id: userId,
        stripe_customer_id: sub.customer as string,
        stripe_subscription_id: sub.id,
        status: sub.status === 'active' ? 'active' : 'past_due',
        amount_cents: sub.items.data[0]?.price.unit_amount ?? 0,
        currency: sub.currency,
        current_period_end: null,
      })
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      upsertSubscription({
        id: randomUUID(),
        user_id: sub.metadata?.user_id ?? '',
        stripe_customer_id: sub.customer as string,
        stripe_subscription_id: sub.id,
        status: 'cancelled',
        amount_cents: 0,
        currency: sub.currency,
        current_period_end: null,
      })
      break
    }
  }

  return new NextResponse('ok', { status: 200 })
}
