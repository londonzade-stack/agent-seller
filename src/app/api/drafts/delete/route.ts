import { createClient } from '@/lib/supabase/server'
import { deleteDraft } from '@/lib/email/unified'
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

    await deleteDraft(user.id, draftId)
    return Response.json({ success: true })
  } catch (error) {
    sanitizeError('Delete draft API error', error)
    return new Response(JSON.stringify({ error: 'Failed to delete draft' }), { status: 500 })
  }
}
