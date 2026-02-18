import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Filter by chat_type if provided (e.g. ?type=outreach)
  const url = new URL(req.url)
  const chatType = url.searchParams.get('type') || 'agent'

  // Only return sessions that have at least one message
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id, title, created_at, updated_at, chat_messages(id)')
    .eq('user_id', user.id)
    .eq('chat_type', chatType)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filter to sessions with messages and strip the join data
  const withMessages: typeof data = []
  const emptyIds: string[] = []
  for (const s of data || []) {
    if (s.chat_messages && s.chat_messages.length > 0) {
      withMessages.push(s)
    } else {
      emptyIds.push(s.id)
    }
  }

  // Clean up empty sessions in the background
  if (emptyIds.length > 0) {
    supabase.from('chat_sessions').delete().in('id', emptyIds).then(() => {})
  }

  const sessions = withMessages.map(({ chat_messages: _, ...rest }) => rest)
  return NextResponse.json({ sessions })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const title = body.title || 'New Chat'
  const chatType = body.chatType || 'agent'

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ user_id: user.id, title, chat_type: chatType })
    .select('id, title, created_at, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ session: data })
}
