import { verifyAdmin, getAdminClient } from '@/lib/admin'
import { sanitizeError } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Build sparkline data: count per day for last N days
function buildDailySparkline(items: { created_at: string }[], days: number): { date: string; count: number }[] {
  const counts: Record<string, number> = {}
  const now = new Date()
  // Initialize all days to 0
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    counts[key] = 0
  }
  // Count items per day
  for (const item of items) {
    const key = new Date(item.created_at).toISOString().split('T')[0]
    if (key in counts) counts[key]++
  }
  return Object.entries(counts).map(([date, count]) => ({ date, count }))
}

export async function GET() {
  try {
    const { isAdmin } = await verifyAdmin()
    if (!isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = getAdminClient()
    const fiftyDaysAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString()

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

    // Parallel queries for counts + sparkline data
    const [
      { count: totalSessions },
      { count: totalMessages },
      { data: recentSessions },
      { count: emailConnectionsCount },
      { data: recentMessages },
      { data: recentSessionsAll },
      { data: recentConnections },
    ] = await Promise.all([
      adminClient.from('chat_sessions').select('id', { count: 'exact', head: true }),
      adminClient.from('chat_messages').select('id', { count: 'exact', head: true }),
      adminClient.from('chat_sessions').select('user_id, updated_at').gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      adminClient.from('user_email_connections').select('id', { count: 'exact', head: true }),
      // Sparkline queries
      adminClient.from('chat_messages').select('created_at').gte('created_at', fiftyDaysAgo),
      adminClient.from('chat_sessions').select('created_at').gte('created_at', fiftyDaysAgo),
      adminClient.from('user_email_connections').select('created_at').gte('created_at', fiftyDaysAgo),
    ])

    const activeUserIds = new Set((recentSessions || []).map(s => s.user_id))
    const activeUsersThisWeek = activeUserIds.size

    // Build sparkline for signups from auth users
    const signupSparkline = buildDailySparkline(
      users.map(u => ({ created_at: u.created_at })),
      56
    )

    return Response.json({
      totalUsers,
      activeUsersThisWeek,
      totalSessions: totalSessions || 0,
      totalMessages: totalMessages || 0,
      emailConnections: emailConnectionsCount || 0,
      subscriptions: subBreakdown,
      sparklines: {
        signups: signupSparkline,
        messages: buildDailySparkline(recentMessages || [], 56),
        sessions: buildDailySparkline(recentSessionsAll || [], 56),
        connections: buildDailySparkline(recentConnections || [], 56),
      },
    })
  } catch (error) {
    sanitizeError('Admin stats API error', error)
    return Response.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
