import { createClient } from '@/lib/supabase/server'
import { scanInboxForEmails } from '@/lib/gmail/service'

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

    const emails = await scanInboxForEmails(user.id, { maxResults: 100, after: afterDate })

    const senderCounts: Record<string, number> = {}
    let unreadCount = 0
    let withAttachments = 0

    emails.forEach((e) => {
      const sender = e.from || 'Unknown'
      senderCounts[sender] = (senderCounts[sender] || 0) + 1
      if (e.labelIds?.includes('UNREAD')) unreadCount++
      if (e.hasAttachments) withAttachments++
    })

    const topSenders = Object.entries(senderCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([sender, count]) => ({ sender, count }))

    return Response.json({
      stats: {
        totalEmails: emails.length,
        unreadEmails: unreadCount,
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
