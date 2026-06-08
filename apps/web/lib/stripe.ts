import Stripe from 'stripe'

let _stripe: Stripe | null = null

function requireStripeEnv(
  name: 'STRIPE_SECRET_KEY' | 'STRIPE_PRICE_ID' | 'STRIPE_WEBHOOK_SECRET',
): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(requireStripeEnv('STRIPE_SECRET_KEY'), {
      apiVersion: '2026-05-27.dahlia',
    })
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

export type StripeMode = 'test' | 'live'

export function getStripeMode(): StripeMode {
  const key = requireStripeEnv('STRIPE_SECRET_KEY')
  if (key.startsWith('sk_live_')) return 'live'
  if (key.startsWith('sk_test_')) return 'test'
  throw new Error('STRIPE_SECRET_KEY must start with sk_live_ or sk_test_')
}
