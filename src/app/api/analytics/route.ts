import { createClient } from '@/lib/supabase/server'
import { scanInboxForEmails, getInboxStats } from '@/lib/gmail/service'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const url = new URL(req.url)
    const timeframe = url.searchParams.get('timeframe') || 'week'

    const now = new Date()
    let afterDate: Date
    switch (timeframe) {
      case 'today':
        afterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'month':
        afterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'week':
      default:
        afterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
    }

    // Get accurate counts from Gmail labels.get (single fast API call each)
    // AND scan recent emails for sender analysis in parallel
    const [inboxStats, emails] = await Promise.all([
      getInboxStats(user.id),
      scanInboxForEmails(user.id, { maxResults: 200, after: afterDate }),
    ])

    // Use scanned emails for sender breakdown and attachment analysis
    const senderCounts: Record<string, number> = {}
    let withAttachments = 0

    emails.forEach((e) => {
      const sender = e.from || 'Unknown'
      senderCounts[sender] = (senderCounts[sender] || 0) + 1
      if (e.hasAttachments) withAttachments++
    })

    const topSenders = Object.entries(senderCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([sender, count]) => ({ sender, count }))

    return Response.json({
      stats: {
        // Accurate counts from labels.get
        totalEmails: inboxStats.inbox.total,
        unreadEmails: inboxStats.inbox.unread,
        totalThreads: inboxStats.inbox.threads,
        sentEmails: inboxStats.sent.total,
        spamEmails: inboxStats.spam.total,
        trashedEmails: inboxStats.trash.total,
        starredEmails: inboxStats.starred.total,
        // From scanned emails (timeframe-filtered)
        emailsInTimeframe: emails.length,
        emailsWithAttachments: withAttachments,
        uniqueSenders: Object.keys(senderCounts).length,
        topSenders,
      },
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch analytics' }), { status: 500 })
  }
}
