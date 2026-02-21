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

    // Get recent user messages with session info
    const { data: messages, error: msgsError } = await adminClient
      .from('chat_messages')
      .select('id, content, role, created_at, session_id')
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(300)

    if (msgsError) throw msgsError

    // Get session details for these messages
    const sessionIds = [...new Set((messages || []).map(m => m.session_id))]
    const { data: sessions } = await adminClient
      .from('chat_sessions')
      .select('id, user_id, chat_type, title')
      .in('id', sessionIds.length > 0 ? sessionIds : ['none'])

    // Get user emails for these sessions
    const userIds = [...new Set((sessions || []).map(s => s.user_id))]
    const { data: { users } } = await adminClient.auth.admin.listUsers({ perPage: 500 })
    const userEmailMap = new Map<string, string>()
    for (const u of users) {
      userEmailMap.set(u.id, u.email || 'unknown')
    }

    const sessionMap = new Map<string, { userId: string; chatType: string; title: string }>()
    for (const s of sessions || []) {
      sessionMap.set(s.id, { userId: s.user_id, chatType: s.chat_type, title: s.title })
    }

    // Build enriched messages
    const enrichedMessages = (messages || []).map(m => {
      const session = sessionMap.get(m.session_id)
      return {
        id: m.id,
        content: m.content,
        createdAt: m.created_at,
        chatType: session?.chatType || 'unknown',
        userEmail: session ? (userEmailMap.get(session.userId) || 'unknown') : 'unknown',
        sessionTitle: session?.title || 'Untitled',
      }
    })

    return Response.json({ queries: enrichedMessages })
  } catch (error) {
    sanitizeError('Admin popular queries API error', error)
    return Response.json({ error: 'Failed to fetch popular queries' }, { status: 500 })
  }
}
