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
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Drafts Review Queue</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Connect your email to see and manage AI-generated drafts waiting for your review.
        </p>
        <Button onClick={onConnectEmail}>
          <Mail className="h-4 w-4 mr-2" />
          Connect Email
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between bg-card">
        <div>
          <h1 className="text-xl font-semibold">Drafts</h1>
          <p className="text-sm text-muted-foreground">
            Review, edit, and send AI-generated email drafts
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDrafts} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {loading && drafts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle className="h-8 w-8 text-destructive mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={fetchDrafts}>Try Again</Button>
          </div>
        ) : drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No drafts yet</h3>
            <p className="text-muted-foreground text-sm text-center max-w-md">
              Ask the AI agent to draft emails for you. They&apos;ll appear here for review before sending.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {drafts.map((draft) => (
              <Card key={draft.id} className="p-0 overflow-hidden">
                <div className="border-b border-border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium truncate max-w-md">
                      {draft.subject || '(No subject)'}
                    </span>
                  </div>
                  <Badge className="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    Pending Review
                  </Badge>
                </div>
                <div className="p-4">
                  <div className="mb-3">
                    <span className="text-xs text-muted-foreground">To: </span>
                    <span className="text-sm">{draft.to || 'No recipient'}</span>
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {draft.body || 'No content'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleSendDraft(draft.id)}>
                      <Send className="h-3 w-3 mr-1" />
                      Send
                    </Button>
                    <Button size="sm" variant="outline" disabled>
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive ml-auto"
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
