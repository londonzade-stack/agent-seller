'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MessageSquare,
  Clock,
  RefreshCw,
  AlertCircle,
  Plus,
  Zap,
} from 'lucide-react'

interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface ChatsViewProps {
  onOpenChat: () => void
}

export function ChatsView({ onOpenChat }: ChatsViewProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/chats')
      if (!res.ok) throw new Error('Failed to fetch chats')
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch {
      setError('Failed to load recent chats.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Group sessions by time period
  const groupSessions = (sessions: ChatSession[]) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 86400000)
    const weekAgo = new Date(today.getTime() - 7 * 86400000)

    const groups: { label: string; sessions: ChatSession[] }[] = [
      { label: 'Today', sessions: [] },
      { label: 'Yesterday', sessions: [] },
      { label: 'This Week', sessions: [] },
      { label: 'Older', sessions: [] },
    ]

    for (const session of sessions) {
      const date = new Date(session.updated_at)
      if (date >= today) groups[0].sessions.push(session)
      else if (date >= yesterday) groups[1].sessions.push(session)
      else if (date >= weekAgo) groups[2].sessions.push(session)
      else groups[3].sessions.push(session)
    }

    return groups.filter(g => g.sessions.length > 0)
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="border-b border-stone-200 dark:border-zinc-800 px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-[#faf8f5] dark:bg-[#111113]">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-white">Recent Chats</h1>
          <p className="text-xs sm:text-sm text-stone-400 dark:text-zinc-500">
            {sessions.length > 0 ? `${sessions.length} conversations` : 'Your chat history with BLITZ'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSessions}
            disabled={loading}
            className="border-stone-200 dark:border-zinc-700"
          >
            <RefreshCw className={`h-4 w-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={onOpenChat}
            className="bg-stone-800 dark:bg-zinc-200 text-white dark:text-zinc-900 hover:bg-stone-700 dark:hover:bg-zinc-300"
          >
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">New Chat</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-3 sm:p-6 bg-[#faf8f5] dark:bg-[#111113]">
        {loading ? (
          // SKELETON LOADING - Vercel style
          <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
            {[
              { label: 'w-16', count: 3 },
              { label: 'w-20', count: 2 },
            ].map((group, gi) => (
              <div key={gi}>
                <div className={`h-3 ${group.label} rounded bg-stone-200 dark:bg-zinc-800 mb-3`} />
                <div className="space-y-2">
                  {Array.from({ length: group.count }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-stone-200 dark:bg-zinc-800" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 rounded bg-stone-200 dark:bg-zinc-800" style={{ width: `${60 + i * 10}%` }} />
                          <div className="h-3 w-20 rounded bg-stone-100 dark:bg-zinc-800/60" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
            <p className="text-stone-500 dark:text-zinc-400 mb-4">{error}</p>
            <Button variant="outline" onClick={fetchSessions} className="border-stone-200 dark:border-zinc-700">
              Try Again
            </Button>
          </div>
        ) : sessions.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
              <MessageSquare className="h-8 w-8 text-stone-400 dark:text-zinc-500" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-stone-900 dark:text-white">No chats yet</h3>
            <p className="text-stone-500 dark:text-zinc-400 text-sm text-center max-w-md mb-6">
              Start a conversation with BLITZ and your chat history will appear here.
            </p>
            <Button
              onClick={onOpenChat}
              className="bg-stone-800 dark:bg-zinc-200 text-white dark:text-zinc-900 hover:bg-stone-700 dark:hover:bg-zinc-300"
            >
              <Zap className="h-4 w-4 mr-2" />
              Start Chatting
            </Button>
          </div>
        ) : (
          // Chat list grouped by time
          <div className="max-w-3xl mx-auto space-y-6">
            {groupSessions(sessions).map((group) => (
              <div key={group.label}>
                <h3 className="text-xs font-medium text-stone-400 dark:text-zinc-500 uppercase tracking-wider mb-2 px-1">
                  {group.label}
                </h3>
                <div className="space-y-2">
                  {group.sessions.map((session) => (
                    <Card
                      key={session.id}
                      className="p-4 border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer shadow-sm dark:shadow-none group"
                      onClick={onOpenChat}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                          <Zap className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-stone-900 dark:text-white truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                            {session.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock className="h-3 w-3 text-stone-300 dark:text-zinc-600" />
                            <span className="text-xs text-stone-400 dark:text-zinc-500">
                              {formatRelativeTime(session.updated_at)}
                            </span>
                          </div>
                        </div>
                        <MessageSquare className="h-4 w-4 text-stone-300 dark:text-zinc-600 shrink-0 group-hover:text-stone-400 dark:group-hover:text-zinc-500 transition-colors" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
