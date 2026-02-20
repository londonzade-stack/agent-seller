import { createClient } from '@/lib/supabase/server'
import { sendDraft } from '@/lib/email/unified'
import { sanitizeError } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { draftId } = await req.json()
    if (!draftId) {
      return new Response(JSON.stringify({ error: 'Missing draftId' }), { status: 400 })
    }

    const result = await sendDraft(user.id, draftId)
    return Response.json({ success: true, messageId: result.id })
  } catch (error) {
    sanitizeError('Send draft API error', error)
    return new Response(JSON.stringify({ error: 'Failed to send draft' }), { status: 500 })
  }
}
