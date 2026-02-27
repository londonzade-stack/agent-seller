import { createClient } from '@/lib/supabase/server'
import { unsubscribeFromEmail } from '@/lib/email/unified'
import { sanitizeError } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Pro plan check
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single()

    if (sub?.plan !== 'pro') {
      return Response.json({ error: 'Pro plan required' }, { status: 403 })
    }

    const { emailId } = await request.json()

    if (!emailId || typeof emailId !== 'string') {
      return Response.json({ error: 'emailId is required' }, { status: 400 })
    }

    const result = await unsubscribeFromEmail(user.id, emailId)

    return Response.json(result)
  } catch (error) {
    sanitizeError('unsubscribe', error)
    return Response.json(
      { success: false, error: 'Failed to unsubscribe' },
      { status: 500 }
    )
  }
}
