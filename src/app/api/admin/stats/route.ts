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

    // Get total users
    const { data: { users } } = await adminClient.auth.admin.listUsers({ perPage: 500 })
    const totalUsers = users.length

    // Get subscription breakdown
    const { data: subscriptions } = await adminClient
      .from('subscriptions')
      .select('status, plan')

    const subBreakdown = { trialing: 0, active: 0, canceled: 0, none: 0, pastDue: 0, accessCode: 0 }
    for (const s of subscriptions || []) {
      if (s.plan === 'access_code') subBreakdown.accessCode++
      else if (s.status === 'trialing') subBreakdown.trialing++
      else if (s.status === 'active') subBreakdown.active++
      else if (s.status === 'canceled') subBreakdown.canceled++
      else if (s.status === 'past_due') subBreakdown.pastDue++
      else subBreakdown.none++
    }

    // Get total sessions and messages
    const { count: totalSessions } = await adminClient
      .from('chat_sessions')
      .select('id', { count: 'exact', head: true })

    const { count: totalMessages } = await adminClient
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })

    // Active users in last 7 days (users with messages in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentSessions } = await adminClient
      .from('chat_sessions')
      .select('user_id')
      .gte('updated_at', sevenDaysAgo)

    const activeUserIds = new Set((recentSessions || []).map(s => s.user_id))
    const activeUsersThisWeek = activeUserIds.size

    // Email connections count
    const { count: emailConnectionsCount } = await adminClient
      .from('user_email_connections')
      .select('id', { count: 'exact', head: true })

    return Response.json({
      totalUsers,
      activeUsersThisWeek,
      totalSessions: totalSessions || 0,
      totalMessages: totalMessages || 0,
      emailConnections: emailConnectionsCount || 0,
      subscriptions: subBreakdown,
    })
  } catch (error) {
    sanitizeError('Admin stats API error', error)
    return Response.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
