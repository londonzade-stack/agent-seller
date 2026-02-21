import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — list user's scheduled emails
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('scheduled_emails')
    .select('id, recipient_to, recipient_cc, subject, body, scheduled_at, status, error_message, sent_at, created_at')
    .eq('user_id', user.id)
    .order('scheduled_at', { ascending: true })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ emails: data || [] })
}

// POST — schedule a new email (Pro plan only)
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Pro plan gate
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .single()
  const plan = subscription?.plan || 'basic'
  if (plan !== 'pro' && plan !== 'access_code') {
    return NextResponse.json({ error: 'Scheduled emails require a Pro plan.' }, { status: 403 })
  }

  const body = await req.json()
  const { to, subject, emailBody, cc, bcc, threadId, scheduledAt } = body

  if (!to || !subject || !emailBody || !scheduledAt) {
    return NextResponse.json({ error: 'to, subject, emailBody, and scheduledAt are required' }, { status: 400 })
  }

  // Validate scheduledAt is in the future
  const sendTime = new Date(scheduledAt)
  if (isNaN(sendTime.getTime())) {
    return NextResponse.json({ error: 'Invalid scheduledAt date' }, { status: 400 })
  }
  if (sendTime.getTime() < Date.now() - 60000) { // Allow 1 min grace
    return NextResponse.json({ error: 'scheduledAt must be in the future' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('scheduled_emails')
    .insert({
      user_id: user.id,
      recipient_to: to,
      recipient_cc: cc || null,
      recipient_bcc: bcc || null,
      subject,
      body: emailBody,
      thread_id: threadId || null,
      scheduled_at: sendTime.toISOString(),
    })
    .select('id, recipient_to, subject, scheduled_at, status, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ email: data })
}
