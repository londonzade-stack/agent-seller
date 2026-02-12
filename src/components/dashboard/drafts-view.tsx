'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Send,
  Pencil,
  Trash2,
  Loader2,
  Mail,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

interface Draft {
  id: string
  to: string
  subject: string
  body: string
  date: string
}

interface DraftsViewProps {
  isEmailConnected: boolean
  onConnectEmail: () => void
}

export function DraftsView({ isEmailConnected, onConnectEmail }: DraftsViewProps) {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDrafts = async () => {
    if (!isEmailConnected) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/drafts')
      if (!res.ok) throw new Error('Failed to fetch drafts')
      const data = await res.json()
      setDrafts(data.drafts || [])
    } catch {
      setError('Failed to load drafts. Try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrafts()
  }, [isEmailConnected])

  const handleSendDraft = async (draftId: string) => {
    try {
      const res = await fetch('/api/drafts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId }),
      })
      if (!res.ok) throw new Error('Failed to send')
      setDrafts(prev => prev.filter(d => d.id !== draftId))
    } catch {
      setError('Failed to send draft.')
    }
  }

  const handleDeleteDraft = async (draftId: string) => {
    try {
      const res = await fetch('/api/drafts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId }),
      })
      if (!res.ok) throw new Error('Failed to delete')
      setDrafts(prev => prev.filter(d => d.id !== draftId))
    } catch {
      setError('Failed to delete draft.')
    }
  }

  if (!isEmailConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
          <FileText className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Drafts Review Queue</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-center max-w-md">
          Connect your email to see and manage AI-generated drafts waiting for your review.
        </p>
        <Button onClick={onConnectEmail} className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
          <Mail className="h-4 w-4 mr-2" />
          Connect Email
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="border-b border-zinc-200 dark:border-white/10 px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-white dark:bg-black">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold">Drafts</h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Review, edit, and send AI-generated email drafts
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDrafts} disabled={loading} className="border-zinc-200 dark:border-white/10">
          <RefreshCw className={`h-4 w-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </header>

      <div className="flex-1 overflow-auto p-3 sm:p-6">
        {loading && drafts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">{error}</p>
            <Button variant="outline" onClick={fetchDrafts} className="border-zinc-200 dark:border-white/10">Try Again</Button>
          </div>
        ) : drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
              <FileText className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No drafts yet</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center max-w-md">
              Ask the AI agent to draft emails for you. They&apos;ll appear here for review before sending.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
            {drafts.map((draft) => (
              <Card key={draft.id} className="p-0 overflow-hidden border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                <div className="border-b border-zinc-200 dark:border-white/10 p-3 sm:p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-zinc-400 shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {draft.subject || '(No subject)'}
                    </span>
                  </div>
                  <Badge className="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 text-xs">
                    Pending
                  </Badge>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="mb-3">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">To: </span>
                    <span className="text-sm">{draft.to || 'No recipient'}</span>
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 mb-4">
                    {draft.body || 'No content'}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="sm" onClick={() => handleSendDraft(draft.id)} className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
                      <Send className="h-3 w-3 mr-1" />
                      Send
                    </Button>
                    <Button size="sm" variant="outline" disabled className="border-zinc-200 dark:border-white/10">
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto"
                      onClick={() => handleDeleteDraft(draft.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Discard
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
