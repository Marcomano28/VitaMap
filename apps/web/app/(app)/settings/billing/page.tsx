import { requireUserId } from '@/lib/session'
import { getSubscription } from '@/lib/billing'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getLocale } from '@/lib/locale'
import { localeTag, localize, type Locale } from '@/lib/i18n'

const TEXT = {
  es: {
    title: 'Suscripción',
    intro: 'Tu contribución cubre el coste del servidor compartido entre todos los miembros.',
    success: 'Pago realizado correctamente. Tu acceso está activo.',
    confirming: 'Stripe está confirmando el pago. El estado se actualizará en unos instantes.',
    cancelled: 'Pago cancelado. Puedes intentarlo de nuevo cuando quieras.',
    required: 'Necesitas una suscripción activa para acceder a las funciones de salud.',
    status: 'Estado',
    active: 'Activo',
    pending: 'Confirmando pago',
    pastDue: 'Pago pendiente',
    cancelledStatus: 'Cancelada',
    none: 'Sin suscripción',
    renewal: 'Próxima renovación',
    amount: 'Importe mensual',
    activate: 'Activar suscripción — 6 €/mes',
    reactivate: 'Reactivar suscripción — 6 €/mes',
    manage: 'Gestionar pago o cancelar en Stripe',
  },
  de: {
    title: 'Abonnement',
    intro: 'Dein Beitrag deckt die Kosten des gemeinsam genutzten Servers.',
    success: 'Die Zahlung war erfolgreich. Dein Zugang ist aktiv.',
    confirming: 'Stripe bestätigt die Zahlung. Der Status wird in Kürze aktualisiert.',
    cancelled: 'Die Zahlung wurde abgebrochen. Du kannst es jederzeit erneut versuchen.',
    required: 'Für die Gesundheitsfunktionen ist ein aktives Abonnement erforderlich.',
    status: 'Status',
    active: 'Aktiv',
    pending: 'Zahlung wird bestätigt',
    pastDue: 'Zahlung ausstehend',
    cancelledStatus: 'Gekündigt',
    none: 'Kein Abonnement',
    renewal: 'Nächste Verlängerung',
    amount: 'Monatlicher Betrag',
    activate: 'Abonnement aktivieren — 6 €/Monat',
    reactivate: 'Abonnement reaktivieren — 6 €/Monat',
    manage: 'Zahlung verwalten oder bei Stripe kündigen',
  },
} as const

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return { title: localize(locale, TEXT).title }
}

interface PageProps {
  searchParams: Promise<{ success?: string; cancelled?: string; required?: string }>
}

export default async function BillingPage({ searchParams }: PageProps) {
  const userId = await requireUserId()
  const sp = await searchParams
  const sub = getSubscription(userId)
  const locale = await getLocale()
  const t = localize(locale, TEXT)

  const isActive = sub?.status === 'active'
  const canManage = Boolean(sub?.stripe_customer_id && sub.status !== 'cancelled')
  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString(localeTag(locale))
    : null

  return (
    <div className="space-y-8 max-w-lg">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-neutral-500">
          {t.intro}
        </p>
      </header>

      {sp.success && isActive && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {t.success}
        </div>
      )}

      {sp.success && !isActive && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          {t.confirming}
        </div>
      )}

      {sp.cancelled && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          {t.cancelled}
        </div>
      )}

      {sp.required && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          {t.required}
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">{t.status}</span>
          {isActive ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
              {t.active}
            </span>
          ) : (
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
              {sub?.status === 'past_due'
                ? t.pastDue
                : sub?.status === 'pending'
                  ? t.pending
                  : sub?.status === 'cancelled'
                    ? t.cancelledStatus
                    : t.none}
            </span>
          )}
        </div>

        {isActive && periodEnd && (
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <span>{t.renewal}</span>
            <span>{periodEnd}</span>
          </div>
        )}

        {isActive && sub && (
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <span>{t.amount}</span>
            <span>{(sub.amount_cents / 100).toFixed(2)} €</span>
          </div>
        )}
      </div>

      {canManage ? (
        <ManageSubscriptionButton locale={locale} />
      ) : !isActive ? (
        <SubscribeButton locale={locale} reactivate={sub?.status === 'cancelled'} />
      ) : (
        <ManageSubscriptionButton locale={locale} />
      )}
    </div>
  )
}

function SubscribeButton({
  locale,
  reactivate = false,
}: {
  locale: Locale
  reactivate?: boolean
}) {
  const t = localize(locale, TEXT)
  async function startCheckout() {
    'use server'
    const { getSubscription } = await import('@/lib/billing')
    const { safeUserId } = await import('@/lib/session')
    const { getStripePriceId, stripe } = await import('@/lib/stripe')
    const { getAuth } = await import('@/lib/auth')
    const { headers } = await import('next/headers')

    const session = await getAuth().api.getSession({ headers: await headers() })
    if (!session?.user) redirect('/login')

    const userId = safeUserId(session.user.id)
    const existing = getSubscription(userId)
    if (existing?.status === 'active') {
      redirect('/settings/billing')
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: getStripePriceId(), quantity: 1 }],
      ...(existing?.stripe_customer_id
        ? { customer: existing.stripe_customer_id }
        : { customer_email: session.user.email }),
      client_reference_id: userId,
      metadata: { user_id: userId },
      subscription_data: { metadata: { user_id: userId } },
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
        {reactivate ? t.reactivate : t.activate}
      </button>
    </form>
  )
}

function ManageSubscriptionButton({ locale }: { locale: Locale }) {
  const t = localize(locale, TEXT)

  async function openPortal() {
    'use server'
    const { getSubscription } = await import('@/lib/billing')
    const { requireUserId } = await import('@/lib/session')
    const { stripe } = await import('@/lib/stripe')

    const userId = await requireUserId()
    const sub = getSubscription(userId)
    if (!sub?.stripe_customer_id) {
      redirect('/settings/billing')
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    })
    redirect(portal.url)
  }

  return (
    <form action={openPortal}>
      <button
        type="submit"
        className="w-full rounded-lg border border-neutral-300 py-3 text-sm font-medium hover:bg-neutral-50 transition-colors"
      >
        {t.manage}
      </button>
    </form>
  )
}
