import Stripe from 'stripe'

// Requires STRIPE_SECRET_KEY environment variable to be set.
// Get your secret key from https://dashboard.stripe.com/apikeys

let _stripe: Stripe | null = null

/**
 * Lazily initialised Stripe client.
 * Deferred so the build step (which collects page data at build time)
 * does not throw when the env var is unavailable.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    }
    _stripe = new Stripe(key, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    })
  }
  return _stripe
}
