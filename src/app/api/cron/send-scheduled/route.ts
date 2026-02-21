import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { sanitizeError } from '@/lib/logger'
import { sendEmail } from '@/lib/email/unified'

export const runtime = 'nodejs'
export const maxDuration = 300

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Missing Supabase environment variables')
  return createSupabaseAdmin(url, serviceKey)
}

function verifyCronAuth(req: Request): boolean {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return authHeader === `Bearer ${cronSecret}`
}

interface ScheduledEmailRow {
  id: string
  user_id: string
  recipient_to: string
  recipient_cc: string | null
  recipient_bcc: string | null
  subject: string
  body: string
  thread_id: string | null
  scheduled_at: string
}

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = getAdminClient()
  const results: { id: string; status: string; error?: string }[] = []

  try {
    // Find all scheduled emails that are due
    const { data: dueEmails, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())
      .limit(20)

    if (fetchError) {
      sanitizeError('Cron: failed to fetch scheduled emails', fetchError)
      return new Response(JSON.stringify({ error: 'Failed to fetch' }), { status: 500 })
    }

    if (!dueEmails || dueEmails.length === 0) {
      return Response.json({ message: 'No scheduled emails due', processed: 0 })
    }

    for (const email of dueEmails as ScheduledEmailRow[]) {
      // Mark as sending to prevent duplicate processing
      await supabase
        .from('scheduled_emails')
        .update({ status: 'sending', updated_at: new Date().toISOString() })
        .eq('id', email.id)

      try {
        await sendEmail(
          email.user_id,
          {
            to: email.recipient_to,
            subject: email.subject,
            body: email.body,
            cc: email.recipient_cc || undefined,
            bcc: email.recipient_bcc || undefined,
            threadId: email.thread_id || undefined,
          },
          supabase // Pass admin client for server-side token access
        )

        // Mark as sent
        await supabase
          .from('scheduled_emails')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', email.id)

        results.push({ id: email.id, status: 'sent' })
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error'
        sanitizeError(`Failed to send scheduled email [${email.id}]`, error)

        await supabase
          .from('scheduled_emails')
          .update({
            status: 'failed',
            error_message: msg.slice(0, 500),
            updated_at: new Date().toISOString(),
          })
          .eq('id', email.id)

        results.push({ id: email.id, status: 'failed', error: msg })
      }
    }

    return Response.json({
      message: `Processed ${results.length} scheduled emails`,
      processed: results.length,
      results,
    })
  } catch (error) {
    sanitizeError('Send-scheduled cron error', error)
    return new Response(JSON.stringify({ error: 'Cron failed' }), { status: 500 })
  }
}
