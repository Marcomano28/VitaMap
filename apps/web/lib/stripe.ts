import Stripe from 'stripe'

let _stripe: Stripe | null = null

function requireStripeEnv(name: 'STRIPE_PRICE_ID' | 'STRIPE_WEBHOOK_SECRET'): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set')
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-05-27.dahlia' })
  }
  return _stripe
}

export const stripe = new Proxy({} as Stripe, {
  get: (_, prop) => getStripe()[prop as keyof Stripe],
})

export function getStripePriceId(): string {
  return requireStripeEnv('STRIPE_PRICE_ID')
}

export function getStripeWebhookSecret(): string {
  return requireStripeEnv('STRIPE_WEBHOOK_SECRET')
}
