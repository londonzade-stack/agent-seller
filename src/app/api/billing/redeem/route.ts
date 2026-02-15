import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { sanitizeError } from '@/lib/logger'

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await req.json()

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return Response.json({ error: 'Please enter an access code' }, { status: 400 })
    }

    const admin = getAdminClient()

    // Look up the code
    const { data: accessCode, error: codeError } = await admin
      .from('access_codes')
      .select('id, code, max_uses, used_count')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (codeError || !accessCode) {
      return Response.json({ error: 'Invalid access code' }, { status: 400 })
    }

    // Check if code has remaining uses
    if (accessCode.used_count >= accessCode.max_uses) {
      return Response.json({ error: 'This access code has already been used' }, { status: 400 })
    }

    // Check if user already redeemed this code
    const { data: existing } = await admin
      .from('access_code_redemptions')
      .select('id')
      .eq('code_id', accessCode.id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return Response.json({ error: 'You have already redeemed this code' }, { status: 400 })
    }

    // Activate subscription for the user (bypass Stripe)
    const { error: subError } = await admin
      .from('subscriptions')
      .upsert(
        {
          user_id: user.id,
          status: 'active',
          plan: 'access_code',
        },
        { onConflict: 'user_id' }
      )

    if (subError) {
      throw new Error(`Failed to activate subscription: ${subError.message}`)
    }

    // Record the redemption
    await admin
      .from('access_code_redemptions')
      .insert({ code_id: accessCode.id, user_id: user.id })

    // Increment used_count
    await admin
      .from('access_codes')
      .update({ used_count: accessCode.used_count + 1 })
      .eq('id', accessCode.id)

    return Response.json({ success: true })
  } catch (error) {
    sanitizeError('Access code redeem error', error)
    return Response.json(
      { error: 'Failed to redeem access code. Please try again.' },
      { status: 500 }
    )
  }
}
