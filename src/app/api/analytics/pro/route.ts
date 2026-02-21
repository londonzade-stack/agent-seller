import { createClient } from '@/lib/supabase/server'
import { scanInboxForEmails, findUnsubscribableEmails } from '@/lib/email/unified'
import { sanitizeError } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check plan
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single()

    const plan = sub?.plan || 'basic'
    const isPro = plan === 'pro' || plan === 'access_code'

    if (!isPro) {
      return Response.json({ error: 'Pro plan required' }, { status: 403 })
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Fetch emails for last 30 days + sent emails + unsubscribable in parallel
    const [receivedEmails, sentEmails, unsubEmails] = await Promise.all([
      scanInboxForEmails(user.id, { maxResults: 500, after: thirtyDaysAgo }),
      scanInboxForEmails(user.id, { maxResults: 100, query: 'in:sent', after: thirtyDaysAgo }),
      findUnsubscribableEmails(user.id, { maxResults: 30 }).catch(() => []),
    ])

    // ─── Daily Volume (last 30 days) ───
    const dailyMap = new Map<string, number>()
    // Pre-fill all 30 days with 0
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10) // YYYY-MM-DD
      dailyMap.set(key, 0)
    }
    for (const email of receivedEmails) {
      if (email.date) {
        const d = new Date(email.date)
        if (!isNaN(d.getTime())) {
          const key = d.toISOString().slice(0, 10)
          dailyMap.set(key, (dailyMap.get(key) || 0) + 1)
        }
      }
    }
    const dailyVolume = [...dailyMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }))

    // ─── Hourly Distribution ───
    const hourlyMap = new Map<number, number>()
    for (let h = 0; h < 24; h++) hourlyMap.set(h, 0)
    for (const email of receivedEmails) {
      if (email.date) {
        const d = new Date(email.date)
        if (!isNaN(d.getTime())) {
          const hour = d.getHours()
          hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1)
        }
      }
    }
    const hourlyDistribution = [...hourlyMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([hour, count]) => ({ hour, count }))

    // ─── Response Time Stats ───
    // Group received emails by threadId for quick lookup
    const threadFirstReceived = new Map<string, number>()
    for (const email of receivedEmails) {
      if (email.threadId && email.date) {
        const t = new Date(email.date).getTime()
        if (!isNaN(t)) {
          const existing = threadFirstReceived.get(email.threadId)
          if (!existing || t < existing) {
            threadFirstReceived.set(email.threadId, t)
          }
        }
      }
    }

    const responseTimes: number[] = []
    for (const sent of sentEmails) {
      if (sent.threadId && sent.date) {
        const sentTime = new Date(sent.date).getTime()
        const receivedTime = threadFirstReceived.get(sent.threadId)
        if (receivedTime && sentTime > receivedTime) {
          const diffMinutes = (sentTime - receivedTime) / 60000
          if (diffMinutes > 0 && diffMinutes < 10080) { // Less than 7 days
            responseTimes.push(diffMinutes)
          }
        }
      }
    }

    responseTimes.sort((a, b) => a - b)
    const responseTimeStats = responseTimes.length > 0
      ? {
          avgMinutes: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
          fastestMinutes: Math.round(responseTimes[0]),
          slowestMinutes: Math.round(responseTimes[responseTimes.length - 1]),
          medianMinutes: Math.round(responseTimes[Math.floor(responseTimes.length / 2)]),
          sampleSize: responseTimes.length,
        }
      : null

    // ─── Unsubscribe Suggestions ───
    // Group by sender and count
    const unsubSenderMap = new Map<string, { count: number; id: string; canAuto: boolean }>()
    for (const email of unsubEmails) {
      const sender = (email as { from?: string }).from || 'Unknown'
      const existing = unsubSenderMap.get(sender)
      if (existing) {
        existing.count++
      } else {
        unsubSenderMap.set(sender, {
          count: 1,
          id: (email as { id?: string }).id || '',
          canAuto: (email as { canAutoUnsubscribe?: boolean }).canAutoUnsubscribe || false,
        })
      }
    }
    const unsubscribeSuggestions = [...unsubSenderMap.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([sender, data]) => ({ sender, count: data.count, emailId: data.id, canAutoUnsubscribe: data.canAuto }))

    // ─── AI Summary (template-based) ───
    const totalReceived = receivedEmails.length
    const totalSent = sentEmails.length
    const uniqueSenders = new Set(receivedEmails.map(e => e.from).filter(Boolean)).size
    const busiestHour = hourlyDistribution.reduce((max, h) => h.count > max.count ? h : max, { hour: 0, count: 0 })
    const busiestHourStr = busiestHour.hour === 0 ? '12 AM' : busiestHour.hour < 12 ? `${busiestHour.hour} AM` : busiestHour.hour === 12 ? '12 PM' : `${busiestHour.hour - 12} PM`

    const topSender = receivedEmails.length > 0
      ? Object.entries(receivedEmails.reduce((acc, e) => { const s = e.from || 'Unknown'; acc[s] = (acc[s] || 0) + 1; return acc }, {} as Record<string, number>))
          .sort((a, b) => b[1] - a[1])[0]
      : null

    let aiSummary = `Over the last 30 days, you received ${totalReceived} emails from ${uniqueSenders} unique senders and sent ${totalSent} emails.`
    if (topSender) {
      aiSummary += ` Your top sender is ${topSender[0].split('<')[0].trim()} with ${topSender[1]} emails.`
    }
    aiSummary += ` Your inbox is busiest around ${busiestHourStr}.`
    if (responseTimeStats) {
      const avgHours = Math.round(responseTimeStats.avgMinutes / 60)
      aiSummary += avgHours > 0
        ? ` You typically reply within ${avgHours} hour${avgHours !== 1 ? 's' : ''}.`
        : ` You typically reply within ${responseTimeStats.avgMinutes} minutes.`
    }

    return Response.json({
      dailyVolume,
      hourlyDistribution,
      responseTimeStats,
      unsubscribeSuggestions,
      aiSummary,
      totalReceived,
      totalSent,
      uniqueSenders,
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    })
  } catch (error) {
    sanitizeError('Pro analytics API error', error)
    return Response.json({ error: 'Failed to fetch pro analytics' }, { status: 500 })
  }
}
