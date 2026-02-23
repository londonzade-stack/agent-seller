import { getStripe } from '@/lib/stripe'
import { sanitizeError } from '@/lib/logger'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Use a service-role client so webhook handler can write to any user's row
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables for admin client')
  }
  return createSupabaseAdmin(url, serviceKey)
}

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
        status: 400,
      })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set')
    }

    const event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
    const supabase = getAdminClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id

        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id

        if (customerId && subscriptionId) {
          // Check if the subscription is trialing or active
          // (checkout with trial_period_days starts as 'trialing', not 'active')
          let checkoutStatus: string = 'active'
          try {
            const stripeSub = await getStripe().subscriptions.retrieve(subscriptionId)
            if (stripeSub.status === 'trialing') {
              checkoutStatus = 'trialing'
            }
          } catch {
            // If we can't fetch the subscription, default to 'active'
          }

          // Ensure the subscription row is linked even if subscription.created
          // webhook arrives before the checkout route finishes upserting
          const { error: checkoutError } = await supabase
            .from('subscriptions')
            .update({
              stripe_subscription_id: subscriptionId,
              status: checkoutStatus,
            })
            .eq('stripe_customer_id', customerId)
          if (checkoutError) {
            sanitizeError('Stripe webhook: failed to update on checkout.session.completed', checkoutError)
            return new Response(JSON.stringify({ error: 'Database write failed' }), { status: 500 })
          }
        }
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id

        // Extract plan and interval from subscription metadata (set during checkout)
        const createdMeta = subscription.metadata as Record<string, string> | undefined
        const createdPlan = createdMeta?.plan || 'basic'
        const createdInterval = createdMeta?.interval || 'month'

        // Extract period dates — cast through unknown for Stripe API version compatibility
        const subAny = subscription as unknown as Record<string, unknown>
        const itemAny = subscription.items.data[0] as unknown as Record<string, unknown> | undefined
        const rawStart = (subAny.current_period_start ?? itemAny?.current_period_start) as number | undefined
        const rawEnd = (subAny.current_period_end ?? itemAny?.current_period_end) as number | undefined
        const periodStart = rawStart ? new Date(rawStart * 1000).toISOString() : null
        const periodEnd = rawEnd ? new Date(rawEnd * 1000).toISOString() : null

        // Extract trial dates
        const rawTrialStart = subAny.trial_start as number | undefined
        const rawTrialEnd = subAny.trial_end as number | undefined
        const trialStart = rawTrialStart ? new Date(rawTrialStart * 1000).toISOString() : null
        const trialEnd = rawTrialEnd ? new Date(rawTrialEnd * 1000).toISOString() : null

        const { error: createError } = await supabase
          .from('subscriptions')
          .update({
            stripe_subscription_id: subscription.id,
            status: subscription.status === 'trialing' ? 'trialing' : 'active',
            plan: createdPlan,
            billing_interval: createdInterval,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            trial_start: trialStart,
            trial_end: trialEnd,
          })
          .eq('stripe_customer_id', customerId)
        if (createError) {
          sanitizeError('Stripe webhook: failed to update subscription on create', createError)
          return new Response(JSON.stringify({ error: 'Database write failed' }), { status: 500 })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id

        let status: string = subscription.status
        if (status === 'incomplete' || status === 'incomplete_expired') {
          status = 'past_due'
        }

        // Extract plan and interval from subscription metadata
        const updatedMeta = subscription.metadata as Record<string, string> | undefined
        const updatedPlan = updatedMeta?.plan || undefined // only update if present
        const updatedInterval = updatedMeta?.interval || undefined

        const updSubAny = subscription as unknown as Record<string, unknown>
        const updItemAny = subscription.items.data[0] as unknown as Record<string, unknown> | undefined
        const updRawStart = (updSubAny.current_period_start ?? updItemAny?.current_period_start) as number | undefined
        const updRawEnd = (updSubAny.current_period_end ?? updItemAny?.current_period_end) as number | undefined
        const updatedPeriodStart = updRawStart ? new Date(updRawStart * 1000).toISOString() : null
        const updatedPeriodEnd = updRawEnd ? new Date(updRawEnd * 1000).toISOString() : null

        // Extract trial dates
        const updRawTrialStart = updSubAny.trial_start as number | undefined
        const updRawTrialEnd = updSubAny.trial_end as number | undefined
        const updTrialStart = updRawTrialStart ? new Date(updRawTrialStart * 1000).toISOString() : null
        const updTrialEnd = updRawTrialEnd ? new Date(updRawTrialEnd * 1000).toISOString() : null

        const updateData: Record<string, unknown> = {
          stripe_subscription_id: subscription.id,
          status,
          current_period_start: updatedPeriodStart,
          current_period_end: updatedPeriodEnd,
          trial_start: updTrialStart,
          trial_end: updTrialEnd,
        }
        if (updatedPlan) updateData.plan = updatedPlan
        if (updatedInterval) updateData.billing_interval = updatedInterval

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update(updateData)
          .eq('stripe_customer_id', customerId)
        if (updateError) {
          sanitizeError('Stripe webhook: failed to update subscription', updateError)
          return new Response(JSON.stringify({ error: 'Database write failed' }), { status: 500 })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id

        const { error: deleteError } = await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_customer_id', customerId)
        if (deleteError) {
          sanitizeError('Stripe webhook: failed to cancel subscription', deleteError)
          return new Response(JSON.stringify({ error: 'Database write failed' }), { status: 500 })
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id

        if (customerId) {
          const { error: paySuccessError } = await supabase
            .from('subscriptions')
            .update({ status: 'active' })
            .eq('stripe_customer_id', customerId)
          if (paySuccessError) {
            sanitizeError('Stripe webhook: failed to update on payment success', paySuccessError)
            return new Response(JSON.stringify({ error: 'Database write failed' }), { status: 500 })
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id

        if (customerId) {
          const { error: payFailError } = await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_customer_id', customerId)
          if (payFailError) {
            sanitizeError('Stripe webhook: failed to update on payment failure', payFailError)
            return new Response(JSON.stringify({ error: 'Database write failed' }), { status: 500 })
          }
        }
        break
      }
    }

    return Response.json({ received: true })
  } catch (error) {
    sanitizeError('Stripe webhook error', error)
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed' }),
      { status: 400 },
    )
  }
}
