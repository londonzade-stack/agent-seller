import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { sanitizeError } from '@/lib/logger'
import { calculateNextRun } from '@/lib/recurring-tasks'
import {
  scanInboxForEmails,
  archiveEmails,
  bulkTrashByQuery,
  findUnsubscribableEmails,
  bulkUnsubscribe,
  applyLabels,
} from '@/lib/gmail/service'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for cron jobs

// Service-role client for background operations (same pattern as Stripe webhook)
// This bypasses RLS so the cron job can read user_email_connections and Gmail tokens
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables for admin client')
  }
  return createSupabaseAdmin(url, serviceKey)
}

// Verify the cron secret to prevent unauthorized access
function verifyCronAuth(req: Request): boolean {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // In development, allow requests without auth
  if (process.env.NODE_ENV === 'development' && !cronSecret) {
    return true
  }

  if (!cronSecret) return false
  return authHeader === `Bearer ${cronSecret}`
}

interface TaskRow {
  id: string
  user_id: string
  title: string
  task_type: string
  task_config: Record<string, unknown>
  frequency: 'daily' | 'weekly' | 'monthly'
  day_of_week: number | null
  day_of_month: number | null
  time_of_day: string
}

/**
 * Execute a single recurring task by calling the appropriate Gmail service function.
 * The adminClient (service-role Supabase) is passed through so Gmail service functions
 * can read user_email_connections without requiring browser cookies/session.
 */
async function executeTask(task: TaskRow, adminClient: ReturnType<typeof getAdminClient>): Promise<{ success: boolean; result: Record<string, unknown>; error?: string }> {
  const { user_id, task_type, task_config } = task
  const config = task_config || {}

  try {
    switch (task_type) {
      case 'archive_by_query': {
        const query = (config.query as string) || 'category:promotions older_than:30d'
        const maxResults = (config.maxResults as number) || 500
        const emails = await scanInboxForEmails(user_id, { query, maxResults, adminClient })
        if (emails.length === 0) {
          return { success: true, result: { action: 'archive', emailsFound: 0, archived: 0 } }
        }
        const emailIds = emails.map(e => e.id).filter((id): id is string => !!id)
        if (emailIds.length === 0) {
          return { success: true, result: { action: 'archive', emailsFound: emails.length, archived: 0 } }
        }
        const archiveResult = await archiveEmails(user_id, emailIds, adminClient)
        return {
          success: true,
          result: {
            action: 'archive',
            emailsFound: emails.length,
            archived: archiveResult.archivedCount,
          },
        }
      }

      case 'trash_by_query': {
        const query = (config.query as string) || ''
        if (!query) return { success: false, result: {}, error: 'No query specified for trash task' }
        const maxToTrash = (config.maxResults as number) || 100
        const trashResult = await bulkTrashByQuery(user_id, query, maxToTrash, adminClient)
        return {
          success: true,
          result: {
            action: 'trash',
            trashed: trashResult.trashedCount,
          },
        }
      }

      case 'unsubscribe_sweep': {
        const maxResults = (config.maxResults as number) || 50
        const emails = await findUnsubscribableEmails(user_id, { maxResults, adminClient })
        if (emails.length === 0) {
          return { success: true, result: { action: 'unsubscribe', found: 0, unsubscribed: 0 } }
        }
        const autoEmails = emails.filter(e => e.canAutoUnsubscribe)
        if (autoEmails.length === 0) {
          return { success: true, result: { action: 'unsubscribe', found: emails.length, unsubscribed: 0, note: 'No auto-unsubscribe available' } }
        }
        const autoIds = autoEmails.map(e => e.id).filter((id): id is string => !!id)
        const unsubResult = await bulkUnsubscribe(user_id, autoIds, adminClient)
        return {
          success: true,
          result: {
            action: 'unsubscribe',
            found: emails.length,
            unsubscribed: unsubResult.succeeded,
            failed: unsubResult.failed,
          },
        }
      }

      case 'inbox_stats': {
        const timeframe = (config.timeframe as string) || 'week'
        let afterDate: Date
        const now = new Date()
        switch (timeframe) {
          case 'today':
            afterDate = new Date(now.setHours(0, 0, 0, 0))
            break
          case 'month':
            afterDate = new Date(now.setMonth(now.getMonth() - 1))
            break
          default: // week
            afterDate = new Date(now.setDate(now.getDate() - 7))
        }
        const emails = await scanInboxForEmails(user_id, { maxResults: 200, after: afterDate, adminClient })
        const senderCounts: Record<string, number> = {}
        let unreadCount = 0
        emails.forEach(e => {
          const sender = e.from || 'Unknown'
          senderCounts[sender] = (senderCounts[sender] || 0) + 1
          if (e.labelIds?.includes('UNREAD')) unreadCount++
        })
        const topSenders = Object.entries(senderCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([sender, count]) => ({ sender, count }))

        return {
          success: true,
          result: {
            action: 'stats',
            totalEmails: emails.length,
            unread: unreadCount,
            topSenders,
            timeframe,
          },
        }
      }

      case 'label_emails': {
        const query = (config.query as string) || ''
        const labelIds = (config.labelIds as string[]) || []
        if (!query || labelIds.length === 0) {
          return { success: false, result: {}, error: 'Missing query or labelIds for label task' }
        }
        const emails = await scanInboxForEmails(user_id, { query, maxResults: 100, adminClient })
        if (emails.length === 0) {
          return { success: true, result: { action: 'label', found: 0, labeled: 0 } }
        }
        const labelEmailIds = emails.map(e => e.id).filter((id): id is string => !!id)
        const labelResult = await applyLabels(user_id, labelEmailIds, labelIds, adminClient)
        return {
          success: true,
          result: {
            action: 'label',
            found: emails.length,
            labeled: labelResult.modifiedCount,
          },
        }
      }

      default:
        return { success: false, result: {}, error: `Unknown task type: ${task_type}` }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    sanitizeError(`Cron task execution error [${task.id}]`, error)
    return { success: false, result: {}, error: msg }
  }
}

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = getAdminClient()
  const results: { taskId: string; title: string; status: string; result?: unknown; error?: string }[] = []

  try {
    // Find all enabled tasks whose next_run_at is in the past
    const { data: dueTasks, error: fetchError } = await supabase
      .from('recurring_tasks')
      .select('*')
      .eq('enabled', true)
      .lte('next_run_at', new Date().toISOString())
      .limit(50)

    if (fetchError) {
      sanitizeError('Cron: failed to fetch due tasks', fetchError)
      return new Response(JSON.stringify({ error: 'Failed to fetch tasks' }), { status: 500 })
    }

    if (!dueTasks || dueTasks.length === 0) {
      return Response.json({ message: 'No tasks due', processed: 0 })
    }

    // Process each task
    for (const task of dueTasks as TaskRow[]) {
      // Create execution log entry
      const { data: logEntry } = await supabase
        .from('task_execution_logs')
        .insert({
          task_id: task.id,
          user_id: task.user_id,
          task_title: task.title,
          status: 'running',
        })
        .select('id')
        .single()

      const logId = logEntry?.id

      // Execute the task
      const execResult = await executeTask(task, supabase)

      // Update the log entry with results
      if (logId) {
        await supabase
          .from('task_execution_logs')
          .update({
            status: execResult.success ? 'success' : 'failed',
            result: execResult.result,
            error_message: execResult.error || null,
            completed_at: new Date().toISOString(),
          })
          .eq('id', logId)
      }

      // Compute next run and update the task
      const nextRun = calculateNextRun(
        task.frequency,
        task.time_of_day,
        task.day_of_week,
        task.day_of_month,
      )

      await supabase
        .from('recurring_tasks')
        .update({
          last_executed_at: new Date().toISOString(),
          next_run_at: nextRun.toISOString(),
        })
        .eq('id', task.id)

      results.push({
        taskId: task.id,
        title: task.title,
        status: execResult.success ? 'success' : 'failed',
        result: execResult.result,
        error: execResult.error,
      })
    }

    return Response.json({
      message: `Processed ${results.length} tasks`,
      processed: results.length,
      results,
    })
  } catch (error) {
    sanitizeError('Cron worker error', error)
    return new Response(JSON.stringify({ error: 'Cron worker failed' }), { status: 500 })
  }
}
