import { verifyAdmin, getAdminClient } from '@/lib/admin'
import { sanitizeError } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { isAdmin } = await verifyAdmin()
    if (!isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = getAdminClient()
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30', 10)
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // Fetch all usage rows in the period
    const { data: usage, error } = await adminClient
      .from('api_usage')
      .select('user_id, input_tokens, output_tokens, total_tokens, cost_cents, created_at')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: true })
      .limit(10000)

    if (error) {
      sanitizeError('Admin usage fetch error', error)
      return Response.json({ error: 'Failed to fetch usage' }, { status: 500 })
    }

    const rows = usage || []

    // Aggregate totals
    let totalCostCents = 0
    let totalInputTokens = 0
    let totalOutputTokens = 0
    const totalRequests = rows.length

    for (const row of rows) {
      totalCostCents += row.cost_cents
      totalInputTokens += row.input_tokens
      totalOutputTokens += row.output_tokens
    }

    const avgCostPerResponse = totalRequests > 0 ? totalCostCents / totalRequests : 0
    const avgCostPerDay = days > 0 ? totalCostCents / days : 0

    // Daily spend aggregation (initialize all days to 0)
    const dailyMap: Record<string, { cost: number; requests: number }> = {}
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      dailyMap[key] = { cost: 0, requests: 0 }
    }
    for (const row of rows) {
      const key = new Date(row.created_at).toISOString().split('T')[0]
      if (dailyMap[key]) {
        dailyMap[key].cost += row.cost_cents
        dailyMap[key].requests += 1
      }
    }
    const dailySpend = Object.entries(dailyMap).map(([date, { cost, requests }]) => ({
      date,
      cost: Math.round(cost * 10000) / 10000,
      requests,
    }))

    // Top users by cost
    const userCostMap: Record<string, { cost: number; requests: number; inputTokens: number; outputTokens: number }> = {}
    for (const row of rows) {
      if (!userCostMap[row.user_id]) {
        userCostMap[row.user_id] = { cost: 0, requests: 0, inputTokens: 0, outputTokens: 0 }
      }
      userCostMap[row.user_id].cost += row.cost_cents
      userCostMap[row.user_id].requests += 1
      userCostMap[row.user_id].inputTokens += row.input_tokens
      userCostMap[row.user_id].outputTokens += row.output_tokens
    }

    // Resolve user emails
    const { data: { users } } = await adminClient.auth.admin.listUsers({ perPage: 500 })
    const emailMap: Record<string, string> = {}
    for (const u of users) {
      emailMap[u.id] = u.email || 'Unknown'
    }

    const topUsers = Object.entries(userCostMap)
      .map(([userId, data]) => ({
        userId,
        email: emailMap[userId] || 'Unknown',
        cost: Math.round(data.cost * 10000) / 10000,
        requests: data.requests,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 20)

    return Response.json({
      period: { days, from: cutoff },
      totals: {
        costCents: Math.round(totalCostCents * 10000) / 10000,
        requests: totalRequests,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        avgCostPerResponse: Math.round(avgCostPerResponse * 10000) / 10000,
        avgCostPerDay: Math.round(avgCostPerDay * 10000) / 10000,
      },
      dailySpend,
      topUsers,
    })
  } catch (error) {
    sanitizeError('Admin usage API error', error)
    return Response.json({ error: 'Failed to fetch usage data' }, { status: 500 })
  }
}
