import { createClient } from '@/lib/supabase/server'
import { getDrafts } from '@/lib/gmail/service'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const drafts = await getDrafts(user.id, 50)
    return Response.json({ drafts })
  } catch (error) {
    console.error('Drafts API error:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch drafts' }), { status: 500 })
  }
}
