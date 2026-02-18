import { createClient } from '@/lib/supabase/server'
import { sanitizeError } from '@/lib/logger'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, plan, trial_end, current_period_end, stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!subscription) {
      return Response.json({ status: 'none', plan: null, trialEnd: null, currentPeriodEnd: null, hasStripeCustomer: false })
    }

    return Response.json({
      status: subscription.status,
      plan: subscription.plan || 'basic', // Default to basic if not set
      trialEnd: subscription.trial_end,
      currentPeriodEnd: subscription.current_period_end,
      hasStripeCustomer: !!subscription.stripe_customer_id,
    })
  } catch (error) {
    sanitizeError('Billing status error', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch billing status' }),
      { status: 500 },
    )
  }
}
