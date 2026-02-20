import { createClient } from '@/lib/supabase/server'
import { scanInboxForEmails } from '@/lib/email/unified'
import { sanitizeError } from '@/lib/logger'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const sender = request.nextUrl.searchParams.get('sender')
    if (!sender) {
      return new Response(JSON.stringify({ error: 'Missing sender parameter' }), { status: 400 })
    }

    // Validate sender looks like an email address to prevent query injection
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sender)) {
      return new Response(JSON.stringify({ error: 'Invalid sender email format' }), { status: 400 })
    }

    const rawEmails = await scanInboxForEmails(user.id, {
      maxResults: 10,
      query: `from:${sender}`,
    })

    const emails = rawEmails.map((e) => ({
      id: e.id,
      subject: e.subject || '(No subject)',
      from: e.from || sender,
      date: e.date || '',
      snippet: e.snippet || e.preview || '',
    }))

    return Response.json({ emails })
  } catch (error) {
    sanitizeError('Contacts emails API error', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch emails for contact' }), { status: 500 })
  }
}
