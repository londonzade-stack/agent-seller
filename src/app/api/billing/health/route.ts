import { getStripe } from '@/lib/stripe'

export async function GET() {
  const checks: Record<string, string> = {}

  // Check env vars
  checks.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ? 'set' : 'MISSING'
  checks.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ? 'set' : 'MISSING'
  checks.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING'
  checks.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'not set (using localhost)'

  // Try initializing Stripe
  try {
    const stripe = getStripe()
    // Quick test: list 1 customer to verify API key works
    await stripe.customers.list({ limit: 1 })
    checks.stripe_connection = 'ok'
  } catch (error) {
    checks.stripe_connection = `FAILED: ${error instanceof Error ? error.message : 'unknown'}`
  }

  return Response.json(checks)
}
