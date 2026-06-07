import { requireUserId } from '@/lib/session'
import { getSubscription } from '@/lib/billing'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Suscripción' }

interface PageProps {
  searchParams: Promise<{ success?: string; cancelled?: string }>
}

export default async function BillingPage({ searchParams }: PageProps) {
  const userId = await requireUserId()
  const sp = await searchParams
  const sub = getSubscription(userId)

  const isActive = sub?.status === 'active'
  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString('es-ES')
    : null

  return (
    <div className="space-y-8 max-w-lg">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Suscripción</h1>
        <p className="text-sm text-neutral-500">
          Tu contribución cubre el coste del servidor compartido entre todos los miembros.
        </p>
      </header>

      {sp.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Pago realizado correctamente. Tu acceso está activo.
        </div>
      )}

      {sp.cancelled && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Pago cancelado. Puedes intentarlo de nuevo cuando quieras.
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Estado</span>
          {isActive ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
              Activo
            </span>
          ) : (
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
              {sub?.status === 'past_due' ? 'Pago pendiente' : 'Sin suscripción'}
            </span>
          )}
        </div>

        {isActive && periodEnd && (
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <span>Próxima renovación</span>
            <span>{periodEnd}</span>
          </div>
        )}

        {isActive && sub && (
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <span>Importe mensual</span>
            <span>{(sub.amount_cents / 100).toFixed(2)} €</span>
          </div>
        )}
      </div>

      {!isActive && (
        <SubscribeButton />
      )}
    </div>
  )
}

function SubscribeButton() {
  async function startCheckout() {
    'use server'
    const { requireUserId } = await import('@/lib/session')
    const { stripe, PRICE_ID } = await import('@/lib/stripe')
    const { getAuth } = await import('@/lib/auth')
    const { headers } = await import('next/headers')

    const session = await getAuth().api.getSession({ headers: await headers() })
    if (!session?.user) redirect('/login')

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      customer_email: session.user.email,
      subscription_data: { metadata: { user_id: session.user.id } },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?cancelled=1`,
    })

    if (checkoutSession.url) redirect(checkoutSession.url)
  }

  return (
    <form action={startCheckout}>
      <button
        type="submit"
        className="w-full rounded-lg bg-neutral-900 py-3 text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
      >
        Activar suscripción — 6 €/mes
      </button>
    </form>
  )
}
