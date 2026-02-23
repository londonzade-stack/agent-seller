import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'
import { sanitizeError } from '@/lib/logger'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables for admin client')
  }
  return createSupabaseAdmin(url, serviceKey)
}

const PLAN_CONFIG = {
  basic: {
    name: 'Emailligence Basic',
    description: 'Email management, automations, and analytics',
    monthly: 2000,  // $20.00/mo
    annual: 20000,  // $200.00/yr ($16.67/mo — 17% off)
  },
  pro: {
    name: 'Emailligence Pro',
    description: 'Everything in Basic + Web Search, Sales Outreach, Company Research',
    monthly: 4000,  // $40.00/mo
    annual: 40000,  // $400.00/yr ($33.33/mo — 17% off)
  },
} as const

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Parse plan and billing interval from request body
    let plan: 'basic' | 'pro' = 'basic'
    let interval: 'month' | 'year' = 'month'
    try {
      const body = await req.json()
      if (body.plan === 'pro') plan = 'pro'
      if (body.interval === 'year') interval = 'year'
    } catch {
      // No body or invalid JSON — default to basic monthly
    }

    const planConfig = PLAN_CONFIG[plan]
    const amount = interval === 'year' ? planConfig.annual : planConfig.monthly

    // Use admin client to bypass RLS for writes
    const admin = getAdminClient()

    // Look up existing subscription row
    const { data: subscription } = await admin
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

      // Upsert the customer ID — handles users who signed up before subscriptions table existed
      await admin
        .from('subscriptions')
        .upsert(
          {
            user_id: user.id,
            stripe_customer_id: stripeCustomerId,
          },
          { onConflict: 'user_id' }
        )
    }

    // Determine the app URL for redirects
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create a Checkout session with plan-specific pricing
    const session = await getStripe().checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${planConfig.name}${interval === 'year' ? ' (Annual)' : ''}`,
              description: planConfig.description,
            },
            unit_amount: amount,
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: { plan, interval }, // Store plan and interval in Stripe subscription metadata
      },
      success_url: `${appUrl}/dashboard?billing=success`,
      cancel_url: `${appUrl}/dashboard?billing=canceled`,
    })

    // Store the plan and billing interval in subscriptions table immediately
    await admin
      .from('subscriptions')
      .update({ plan, billing_interval: interval })
      .eq('user_id', user.id)

    return Response.json({ url: session.url })
  } catch (error) {
    sanitizeError('Billing checkout error', error)
    return new Response(
      JSON.stringify({ error: 'Checkout failed. Please try again.' }),
      { status: 500 },
    )
  }
}
