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
  Check,
  X,
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
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTo, setEditTo] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [editBody, setEditBody] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchDrafts = async () => {
    if (!isEmailConnected) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/drafts')
      if (!res.ok) throw new Error('Failed to fetch drafts')
      const data = await res.json()
      const mapped = (data.drafts || []).map((d: Record<string, string>) => ({
        id: d.draftId || d.id,
        to: d.to || '',
        subject: d.subject || '',
        body: d.body || d.snippet || '',
        date: d.date || '',
      }))
      setDrafts(mapped)
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
      setDeletingIds(prev => new Set(prev).add(draftId))
      setTimeout(() => {
        setDrafts(prev => prev.filter(d => d.id !== draftId))
        setDeletingIds(prev => {
          const next = new Set(prev)
          next.delete(draftId)
          return next
        })
      }, 450)
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
      setDeletingIds(prev => new Set(prev).add(draftId))
      setTimeout(() => {
        setDrafts(prev => prev.filter(d => d.id !== draftId))
        setDeletingIds(prev => {
          const next = new Set(prev)
          next.delete(draftId)
          return next
        })
      }, 450)
    } catch {
      setError('Failed to delete draft.')
    }
  }

  const startEditing = (draft: Draft) => {
    setEditingId(draft.id)
    setEditTo(draft.to)
    setEditSubject(draft.subject)
    setEditBody(draft.body)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditTo('')
    setEditSubject('')
    setEditBody('')
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    setSaving(true)
    try {
      const res = await fetch('/api/drafts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: editingId, to: editTo, subject: editSubject, body: editBody }),
      })
      if (!res.ok) throw new Error('Failed to update')
      // Update local state
      setDrafts(prev => prev.map(d =>
        d.id === editingId ? { ...d, to: editTo, subject: editSubject, body: editBody } : d
      ))
      setEditingId(null)
    } catch {
      setError('Failed to save changes.')
    } finally {
      setSaving(false)
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
      <header className="relative z-10 border-b border-white/30 dark:border-white/[0.06] px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-[#faf8f5] dark:bg-[#111113] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="min-w-0">
          <Badge variant="secondary" className="bg-stone-100/80 dark:bg-zinc-800/80 text-stone-700 dark:text-zinc-300 border border-stone-200/60 dark:border-zinc-700/60 px-3 py-1 text-xs font-medium tracking-wide rounded-full">
            <FileText className="h-3 w-3 mr-1.5 text-stone-400 dark:text-zinc-500" />
            Drafts
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDrafts} disabled={loading} className="border-stone-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/60 shadow-sm">
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
            <Button variant="outline" onClick={() => { setError(null); fetchDrafts() }} className="border-zinc-200 dark:border-white/10">Try Again</Button>
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
            {drafts.map((draft) => {
              const isEditing = editingId === draft.id
              return (
                <Card
                  key={draft.id}
                  className={`p-0 overflow-hidden border-zinc-200 dark:border-white/10 bg-white dark:bg-black ${
                    deletingIds.has(draft.id)
                      ? 'opacity-0 -translate-x-20 scale-[0.98] max-h-0 !my-0 !py-0'
                      : 'opacity-100 translate-x-0 scale-100'
                  }`}
                  style={deletingIds.has(draft.id) ? { marginTop: 0, marginBottom: 0, maxHeight: 0, padding: 0, transition: 'all 450ms cubic-bezier(0.4, 0, 0.2, 1)' } : { maxHeight: '800px', transition: 'all 450ms cubic-bezier(0.4, 0, 0.2, 1)' }}
                >
                  {isEditing ? (
                    /* ─── Edit Mode ─── */
                    <div className="p-3 sm:p-4 space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Editing Draft</span>
                        <Badge className="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0 text-xs">
                          Editing
                        </Badge>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">To</label>
                        <input
                          type="email"
                          value={editTo}
                          onChange={(e) => setEditTo(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                          placeholder="recipient@email.com"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Subject</label>
                        <input
                          type="text"
                          value={editSubject}
                          onChange={(e) => setEditSubject(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                          placeholder="Email subject"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Body</label>
                        <textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          rows={8}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-y min-h-[120px]"
                          placeholder="Email body"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Button size="sm" onClick={handleSaveEdit} disabled={saving} className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs sm:text-sm">
                          {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditing} disabled={saving} className="border-zinc-200 dark:border-white/10 text-xs sm:text-sm">
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* ─── View Mode ─── */
                    <>
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
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <Button size="sm" onClick={() => handleSendDraft(draft.id)} className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs sm:text-sm">
                            <Send className="h-3 w-3 mr-1" />
                            Send
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => startEditing(draft)} className="border-zinc-200 dark:border-white/10 text-xs sm:text-sm">
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto text-xs sm:text-sm"
                            onClick={() => handleDeleteDraft(draft.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Discard</span>
                            <span className="sm:hidden">Del</span>
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
