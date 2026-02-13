import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { sanitizeError } from '@/lib/logger'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Look up Stripe customer ID
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!subscription?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: 'No billing account found. Subscribe first.' }),
        { status: 400 },
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${appUrl}/dashboard`,
    })

    return Response.json({ url: session.url })
  } catch (error) {
    sanitizeError('Billing portal error', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create billing portal session' }),
      { status: 500 },
    )
  }
}
