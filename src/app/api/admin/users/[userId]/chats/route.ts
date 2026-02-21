import { verifyAdmin, getAdminClient } from '@/lib/admin'
import { sanitizeError } from '@/lib/logger'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { isAdmin } = await verifyAdmin()
    if (!isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId } = await params
    const adminClient = getAdminClient()

    // Get all chat sessions for this user
    const { data: sessions, error: sessionsError } = await adminClient
      .from('chat_sessions')
      .select('id, title, chat_type, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (sessionsError) throw sessionsError

    // Get all messages for all sessions
    const sessionIds = (sessions || []).map(s => s.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let messages: { id: string; session_id: string; role: string; content: string; metadata: any; created_at: string }[] = []

    if (sessionIds.length > 0) {
      const { data: msgs, error: msgsError } = await adminClient
        .from('chat_messages')
        .select('id, session_id, role, content, metadata, created_at')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: true })

      if (msgsError) throw msgsError
      messages = msgs || []
    }

    // Group messages by session
    const messagesBySession = new Map<string, typeof messages>()
    for (const msg of messages) {
      const existing = messagesBySession.get(msg.session_id) || []
      existing.push(msg)
      messagesBySession.set(msg.session_id, existing)
    }

    const result = (sessions || []).map(session => ({
      id: session.id,
      title: session.title,
      chatType: session.chat_type,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      messageCount: (messagesBySession.get(session.id) || []).length,
      messages: (messagesBySession.get(session.id) || []).map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        metadata: m.metadata || null,
        createdAt: m.created_at,
      })),
    }))

    return Response.json({ sessions: result })
  } catch (error) {
    sanitizeError('Admin user chats API error', error)
    return Response.json({ error: 'Failed to fetch user chats' }, { status: 500 })
  }
}
