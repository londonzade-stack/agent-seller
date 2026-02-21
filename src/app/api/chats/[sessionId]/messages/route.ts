import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify session belongs to user
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { role, content, metadata } = body

  if (!role || !content) {
    return NextResponse.json({ error: 'role and content are required' }, { status: 400 })
  }

  // Save the message (metadata is optional — stores tool call summaries for assistant messages)
  const insertData: Record<string, unknown> = { session_id: sessionId, role, content }
  if (metadata) insertData.metadata = metadata

  const { data: message, error: msgError } = await supabase
    .from('chat_messages')
    .insert(insertData)
    .select('id, role, content, metadata, created_at')
    .single()

  if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 })

  // Update session's updated_at and title (from first user message)
  const updateData: Record<string, string> = { updated_at: new Date().toISOString() }

  // Auto-generate title from first user message
  if (role === 'user') {
    const { count } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('role', 'user')

    if (count === 1) {
      updateData.title = content.slice(0, 80) + (content.length > 80 ? '...' : '')
    }
  }

  await supabase
    .from('chat_sessions')
    .update(updateData)
    .eq('id', sessionId)

  return NextResponse.json({ message })
}
