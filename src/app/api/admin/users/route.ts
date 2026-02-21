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

    // Get all users from Supabase Auth
    const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers({ perPage: 500 })
    if (usersError) throw usersError

    // Get all subscriptions
    const { data: subscriptions } = await adminClient
      .from('subscriptions')
      .select('user_id, plan, status, trial_end, current_period_end')

    // Get all email connections
    const { data: emailConnections } = await adminClient
      .from('user_email_connections')
      .select('user_id, provider, email')

    // Get message counts per user (via chat_sessions join)
    const { data: sessionCounts } = await adminClient
      .from('chat_sessions')
      .select('user_id, id')

    const { data: messageCounts } = await adminClient
      .from('chat_messages')
      .select('session_id, id')

    // Build lookup maps
    const subMap = new Map<string, { plan: string; status: string; trialEnd: string | null; periodEnd: string | null }>()
    for (const s of subscriptions || []) {
      subMap.set(s.user_id, { plan: s.plan, status: s.status, trialEnd: s.trial_end, periodEnd: s.current_period_end })
    }

    const emailMap = new Map<string, { provider: string; email: string }>()
    for (const e of emailConnections || []) {
      emailMap.set(e.user_id, { provider: e.provider, email: e.email })
    }

    // Count sessions per user
    const userSessionCount = new Map<string, number>()
    const sessionUserMap = new Map<string, string>()
    for (const s of sessionCounts || []) {
      userSessionCount.set(s.user_id, (userSessionCount.get(s.user_id) || 0) + 1)
      sessionUserMap.set(s.id, s.user_id)
    }

    // Count messages per user
    const userMessageCount = new Map<string, number>()
    for (const m of messageCounts || []) {
      const userId = sessionUserMap.get(m.session_id)
      if (userId) {
        userMessageCount.set(userId, (userMessageCount.get(userId) || 0) + 1)
      }
    }

    // Build response
    const result = users.map((user) => {
      const sub = subMap.get(user.id)
      const email = emailMap.get(user.id)
      return {
        id: user.id,
        email: user.email,
        plan: sub?.plan || 'basic',
        subscriptionStatus: sub?.status || 'none',
        trialEnd: sub?.trialEnd || null,
        signupDate: user.created_at,
        lastActive: user.last_sign_in_at || user.created_at,
        emailConnected: !!email,
        emailProvider: email?.provider || null,
        connectedEmail: email?.email || null,
        totalSessions: userSessionCount.get(user.id) || 0,
        totalMessages: userMessageCount.get(user.id) || 0,
      }
    })

    // Sort by most recent signup
    result.sort((a, b) => new Date(b.signupDate).getTime() - new Date(a.signupDate).getTime())

    return Response.json({ users: result })
  } catch (error) {
    sanitizeError('Admin users API error', error)
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
