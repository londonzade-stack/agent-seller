import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateNextRun } from '@/lib/recurring-tasks'
import { sanitizeError } from '@/lib/logger'

// GET /api/recurring-tasks/[taskId] — Get a single task with recent logs
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: task, error } = await supabase
    .from('recurring_tasks')
    .select('*')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .single()

  if (error || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  // Get recent logs
  const { data: logs } = await supabase
    .from('task_execution_logs')
    .select('*')
    .eq('task_id', taskId)
    .order('started_at', { ascending: false })
    .limit(10)

  return NextResponse.json({ task, logs: logs || [] })
}

// PATCH /api/recurring-tasks/[taskId] — Update a task
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}

  // Only allow updating specific fields
  if (body.title !== undefined) updates.title = body.title
  if (body.description !== undefined) updates.description = body.description
  if (body.enabled !== undefined) updates.enabled = body.enabled
  if (body.frequency !== undefined) updates.frequency = body.frequency
  if (body.dayOfWeek !== undefined) updates.day_of_week = body.dayOfWeek
  if (body.dayOfMonth !== undefined) updates.day_of_month = body.dayOfMonth
  if (body.timeOfDay !== undefined) updates.time_of_day = body.timeOfDay
  if (body.taskConfig !== undefined) updates.task_config = body.taskConfig

  // Recompute next_run_at if schedule changed
  if (body.frequency || body.timeOfDay || body.dayOfWeek !== undefined || body.dayOfMonth !== undefined) {
    // Fetch current task to get existing values for any fields not being updated
    const { data: currentTask } = await supabase
      .from('recurring_tasks')
      .select('frequency, time_of_day, day_of_week, day_of_month')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()

    if (currentTask) {
      const freq = (body.frequency || currentTask.frequency) as 'daily' | 'weekly' | 'monthly'
      const time = body.timeOfDay || currentTask.time_of_day
      const dow = body.dayOfWeek !== undefined ? body.dayOfWeek : currentTask.day_of_week
      const dom = body.dayOfMonth !== undefined ? body.dayOfMonth : currentTask.day_of_month
      updates.next_run_at = calculateNextRun(freq, time, dow, dom).toISOString()
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('recurring_tasks')
    .update(updates)
    .eq('id', taskId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    sanitizeError('Recurring task operation error', error)
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }
  return NextResponse.json({ task: data })
}

// DELETE /api/recurring-tasks/[taskId] — Delete a task
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('recurring_tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) {
    sanitizeError('Recurring task operation error', error)
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
