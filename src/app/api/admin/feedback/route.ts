import { verifyAdmin, getAdminClient } from '@/lib/admin'
import { sanitizeError } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { isAdmin } = await verifyAdmin()
    if (!isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = getAdminClient()

    // Fetch all feedback (service role bypasses RLS)
    const { data: feedback, error } = await adminClient
      .from('feedback')
      .select('id, user_id, message, rating, page, created_at')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      sanitizeError('Admin feedback fetch error', error)
      return Response.json({ error: 'Failed to fetch feedback' }, { status: 500 })
    }

    // Get user emails for all feedback user_ids
    const { data: { users } } = await adminClient.auth.admin.listUsers({ perPage: 500 })
    const emailMap: Record<string, string> = {}
    for (const u of users) {
      emailMap[u.id] = u.email || 'Unknown'
    }

    const enriched = (feedback || []).map(f => ({
      ...f,
      userEmail: emailMap[f.user_id] || 'Unknown',
    }))

    return Response.json({ feedback: enriched })
  } catch (error) {
    sanitizeError('Admin feedback API error', error)
    return Response.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}
