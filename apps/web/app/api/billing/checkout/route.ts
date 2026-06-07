import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICE_ID } from '@/lib/stripe'
import { getSessionFromRequest } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { user } = session

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    customer_email: user.email,
    metadata: { user_id: user.id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?cancelled=1`,
  })

  return NextResponse.json({ url: checkoutSession.url })
}
