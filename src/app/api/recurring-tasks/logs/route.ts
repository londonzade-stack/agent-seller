import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/recurring-tasks/logs — Get recent execution logs for the current user
// Used by the Morning Briefing widget
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const hours = parseInt(searchParams.get('hours') || '24', 10)

  const since = new Date()
  since.setHours(since.getHours() - hours)

  const { data, error } = await supabase
    .from('task_execution_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('started_at', since.toISOString())
    .order('started_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data || [] })
}
