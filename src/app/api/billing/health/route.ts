import { getStripe } from '@/lib/stripe'

export async function GET() {
  const checks: Record<string, string> = {}

  // Check env vars (show first/last chars to verify key format without exposing it)
  const stripeKey = process.env.STRIPE_SECRET_KEY || ''
  checks.STRIPE_SECRET_KEY = stripeKey
    ? `set (${stripeKey.substring(0, 8)}...${stripeKey.substring(stripeKey.length - 4)}, length: ${stripeKey.length})`
    : 'MISSING'
  checks.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ? 'set' : 'MISSING'
  checks.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING'
  checks.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'not set (using localhost)'

  // Try initializing Stripe
  try {
    const stripe = getStripe()
    // Quick test: list 1 customer to verify API key works
    const result = await stripe.customers.list({ limit: 1 })
    checks.stripe_connection = `ok (${result.data.length} customers returned)`
  } catch (error) {
    const err = error instanceof Error ? error : { message: 'unknown' }
    checks.stripe_connection = `FAILED: ${err.message}`
    checks.stripe_error_type = (error as { type?: string })?.type || 'unknown'
    checks.stripe_error_code = (error as { code?: string })?.code || 'unknown'
  }

  return Response.json(checks)
}
