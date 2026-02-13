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

    // Look up existing subscription row
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let stripeCustomerId = subscription?.stripe_customer_id

    // Create Stripe customer if one doesn't exist yet
    if (!stripeCustomerId) {
      const customer = await getStripe().customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      stripeCustomerId = customer.id

      // Store the customer ID in the subscriptions table
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('user_id', user.id)
    }

    // Determine the app URL for redirects
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create a Checkout session for $10/month subscription
    const session = await getStripe().checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AgentSeller Pro',
              description: 'Full access to AgentSeller — AI-powered sales assistant',
            },
            unit_amount: 1000, // $10.00
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard?billing=success`,
      cancel_url: `${appUrl}/dashboard?billing=canceled`,
    })

    return Response.json({ url: session.url })
  } catch (error) {
    sanitizeError('Billing checkout error', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      { status: 500 },
    )
  }
}
