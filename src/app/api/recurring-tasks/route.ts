import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateNextRun } from '@/lib/recurring-tasks'
import { sanitizeError } from '@/lib/logger'

// GET /api/recurring-tasks — List all recurring tasks for the current user
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('recurring_tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    sanitizeError('Recurring tasks fetch error', error)
    return NextResponse.json({ error: 'Failed to fetch recurring tasks' }, { status: 500 })
  }

  // Fetch last execution log for each task
  const taskIds = (data || []).map(t => t.id)
  let logsMap: Record<string, { status: string; result: unknown; started_at: string; completed_at: string | null }> = {}

  if (taskIds.length > 0) {
    const { data: logs } = await supabase
      .from('task_execution_logs')
      .select('task_id, status, result, started_at, completed_at')
      .in('task_id', taskIds)
      .order('started_at', { ascending: false })

    // Group by task_id, take most recent
    for (const log of logs || []) {
      if (!logsMap[log.task_id]) {
        logsMap[log.task_id] = log
      }
    }
  }

  const tasks = (data || []).map(task => ({
    ...task,
    lastExecution: logsMap[task.id] || null,
  }))

  return NextResponse.json({ tasks })
}

// POST /api/recurring-tasks — Create a new recurring task (Pro plan only)
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
  if (plan !== 'pro') {
    return NextResponse.json({ error: 'Recurring automations require a Pro plan.' }, { status: 403 })
  }

  const body = await req.json()
  const { title, description, taskType, taskConfig, frequency, dayOfWeek, dayOfMonth, timeOfDay } = body

  if (!title || !taskType || !frequency) {
    return NextResponse.json({ error: 'Missing required fields: title, taskType, frequency' }, { status: 400 })
  }

  const time = timeOfDay || '09:00'
  const nextRun = calculateNextRun(frequency, time, dayOfWeek, dayOfMonth)

  const { data, error } = await supabase
    .from('recurring_tasks')
    .insert({
      user_id: user.id,
      title,
      description: description || null,
      task_type: taskType,
      task_config: taskConfig || {},
      frequency,
      day_of_week: dayOfWeek ?? null,
      day_of_month: dayOfMonth ?? null,
      time_of_day: time,
      next_run_at: nextRun.toISOString(),
    })
    .select()
    .single()

  if (error) {
    sanitizeError('Recurring task create error', error)
    return NextResponse.json({ error: 'Failed to create recurring task' }, { status: 500 })
  }
  return NextResponse.json({ task: data })
}
