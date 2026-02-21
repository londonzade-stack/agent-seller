import { createClient } from '@/lib/supabase/server'
import { updateDraft } from '@/lib/email/unified'
import { sanitizeError } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { draftId, to, subject, body } = await request.json()

    if (!draftId) {
      return new Response(JSON.stringify({ error: 'Missing draftId' }), { status: 400 })
    }

    const result = await updateDraft(user.id, draftId, { to, subject, body })
    return Response.json({ success: true, result })
  } catch (error) {
    sanitizeError('Draft update API error', error)
    return new Response(JSON.stringify({ error: 'Failed to update draft' }), { status: 500 })
  }
}
