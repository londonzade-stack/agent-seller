'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Repeat2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Mail,
  RefreshCw,
  Loader2,
  Archive,
  BarChart3,
  Tag,
  Shield,
  Lock,
  ArrowRight,
  Send,
  CalendarClock,
} from 'lucide-react'
import { formatSchedule, TASK_TYPE_LABELS } from '@/lib/recurring-tasks'

interface ScheduledEmail {
  id: string
  recipient_to: string
  recipient_cc: string | null
  recipient_bcc: string | null
  subject: string
  body: string
  thread_id: string | null
  scheduled_at: string
  status: string
  error_message: string | null
  sent_at: string | null
  created_at: string
}

interface RecurringTask {
  id: string
  title: string
  description: string | null
  task_type: string
  task_config: Record<string, unknown>
  frequency: string
  day_of_week: number | null
  day_of_month: number | null
  time_of_day: string
  enabled: boolean
  last_executed_at: string | null
  next_run_at: string
  created_at: string
  lastExecution: {
    status: string
    result: Record<string, unknown>
    started_at: string
    completed_at: string | null
  } | null
}

interface AutomationsViewProps {
  isEmailConnected: boolean
  onConnectEmail: () => void
  onNavigateToAgent: (prompt?: string) => void
  userPlan?: string
  onNavigateToBilling?: () => void
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function formatNextRun(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = date.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMs < 0) return 'overdue'
  if (diffHours < 1) return 'less than 1h'
  if (diffHours < 24) return `in ${diffHours}h`
  if (diffDays < 7) return `in ${diffDays}d`
  return date.toLocaleDateString()
}

function formatLastResult(execution: RecurringTask['lastExecution']): string {
  if (!execution) return ''
  const result = execution.result
  if (!result) return ''

  const action = result.action as string
  if (action === 'archive') {
    const count = result.archived as number || 0
    return count > 0 ? `${count} archived` : 'No emails to archive'
  }
  if (action === 'trash') {
    const count = result.trashed as number || 0
    return count > 0 ? `${count} trashed` : 'No emails to trash'
  }
  if (action === 'unsubscribe') {
    const count = result.unsubscribed as number || 0
    return count > 0 ? `${count} unsubscribed` : 'No new subscriptions'
  }
  if (action === 'stats') {
    const total = result.totalEmails as number || 0
    return `${total} emails analyzed`
  }
  if (action === 'label') {
    const count = result.labeled as number || 0
    return count > 0 ? `${count} labeled` : 'No emails to label'
  }
  return 'Completed'
}

const EXAMPLE_AUTOMATIONS = [
  {
    icon: Archive,
    title: 'Weekly Inbox Cleanup',
    description: 'Archive old promotional emails automatically every week',
    prompt: 'Archive old promotional emails every Sunday at 9 AM',
  },
  {
    icon: BarChart3,
    title: 'Daily Inbox Stats',
    description: 'Get a summary of your inbox activity every morning',
    prompt: 'Give me inbox stats every morning at 8 AM',
  },
  {
    icon: Mail,
    title: 'Monthly Unsubscribe Sweep',
    description: 'Auto-unsubscribe from new newsletters once a month',
    prompt: 'Run an unsubscribe sweep on the 1st of every month',
  },
  {
    icon: Trash2,
    title: 'Clean Up LinkedIn Emails',
    description: 'Trash old LinkedIn notifications every two weeks',
    prompt: 'Delete LinkedIn emails older than 60 days every other Monday',
  },
  {
    icon: Tag,
    title: 'Auto-Label Receipts',
    description: 'Automatically label new receipts and invoices',
    prompt: 'Label emails with receipts or invoices every day at noon',
  },
  {
    icon: Shield,
    title: 'Spam Report Sweep',
    description: 'Report suspicious emails as spam weekly',
    prompt: 'Find and report spam emails every Friday at 5 PM',
  },
]

export function AutomationsView({ isEmailConnected, onConnectEmail, onNavigateToAgent, userPlan, onNavigateToBilling }: AutomationsViewProps) {
  const [tasks, setTasks] = useState<RecurringTask[]>([])
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [cancelingEmailId, setCancelingEmailId] = useState<string | null>(null)
  const [confirmCancelEmailId, setConfirmCancelEmailId] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      setError(null)
      const [tasksRes, emailsRes] = await Promise.all([
        fetch('/api/recurring-tasks'),
        fetch('/api/scheduled-emails'),
      ])
      if (!tasksRes.ok) throw new Error('Failed to load tasks')
      const tasksData = await tasksRes.json()
      setTasks(tasksData.tasks || [])
      if (emailsRes.ok) {
        const emailsData = await emailsRes.json()
        setScheduledEmails(emailsData.emails || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleToggle = async (taskId: string, enabled: boolean) => {
    setTogglingId(taskId)
    try {
      const res = await fetch(`/api/recurring-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      })
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, enabled: !enabled } : t))
      }
    } catch {
      // Silently fail
    } finally {
      setTogglingId(null)
    }
  }

  const handleCancelEmail = async (emailId: string) => {
    setCancelingEmailId(emailId)
    try {
      const res = await fetch(`/api/scheduled-emails/${emailId}`, { method: 'DELETE' })
      if (res.ok) {
        setScheduledEmails(prev => prev.filter(e => e.id !== emailId))
      }
    } catch {
      // Silently fail
    } finally {
      setCancelingEmailId(null)
      setConfirmCancelEmailId(null)
    }
  }

  const handleDelete = async (taskId: string) => {
    setDeletingId(taskId)
    try {
      const res = await fetch(`/api/recurring-tasks/${taskId}`, { method: 'DELETE' })
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId))
      }
    } catch {
      // Silently fail
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  // Gate automations to Pro plan only
  if (userPlan && userPlan !== 'pro' && userPlan !== 'access_code') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#faf8f5] dark:bg-[#111113]">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 mb-4">
          <Lock className="h-7 w-7 text-blue-500" />
        </div>
        <h2 className="text-xl font-semibold text-stone-900 dark:text-white mb-2">Automations is a Pro Feature</h2>
        <p className="text-stone-500 dark:text-zinc-400 text-center max-w-md mb-4">
          Set up recurring tasks that the Agent runs automatically — daily inbox cleanup, weekly stats, monthly unsubscribe sweeps, and more.
        </p>
        <Button
          onClick={onNavigateToBilling}
          className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Upgrade to Pro <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    )
  }

  if (!isEmailConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#faf8f5] dark:bg-[#111113]">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-stone-100 dark:bg-zinc-800 mb-4">
          <Mail className="h-7 w-7 text-stone-400 dark:text-zinc-500" />
        </div>
        <h2 className="text-xl font-semibold text-stone-900 dark:text-white mb-2">Connect Gmail First</h2>
        <p className="text-stone-500 dark:text-zinc-400 text-center max-w-md mb-4">
          Connect your Gmail account to set up automated tasks.
        </p>
        <Button onClick={onConnectEmail} variant="outline">Connect Gmail</Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#faf8f5] dark:bg-[#111113]">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400 dark:text-zinc-500" />
        <p className="text-stone-500 dark:text-zinc-400 mt-3 text-sm">Loading automations...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#faf8f5] dark:bg-[#111113]">
        <AlertCircle className="h-8 w-8 text-red-400 mb-3" />
        <p className="text-stone-600 dark:text-zinc-400 mb-4">{error}</p>
        <Button onClick={fetchTasks} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto bg-[#faf8f5] dark:bg-[#111113]">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-white flex items-center gap-2">
              <Repeat2 className="h-6 w-6 text-amber-500" />
              Automations
            </h1>
            <p className="text-sm text-stone-500 dark:text-zinc-400 mt-1">
              Recurring tasks that the Agent runs automatically
            </p>
          </div>
          <Button onClick={fetchTasks} variant="ghost" size="icon" className="h-9 w-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Scheduled Emails Section */}
        {scheduledEmails.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                Scheduled Emails
              </h2>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                {scheduledEmails.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {scheduledEmails.map(email => (
                <Card
                  key={email.id}
                  className={`p-3 sm:p-4 transition-colors border-stone-200 dark:border-zinc-800 ${
                    email.status === 'scheduled'
                      ? 'bg-white dark:bg-zinc-900'
                      : email.status === 'sent'
                        ? 'bg-green-50/50 dark:bg-green-950/10 opacity-70'
                        : email.status === 'failed'
                          ? 'bg-red-50/50 dark:bg-red-950/10'
                          : 'bg-stone-50 dark:bg-zinc-900/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Send className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <p className="text-sm font-medium text-stone-900 dark:text-white truncate">
                          {email.subject}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 shrink-0 ${
                            email.status === 'scheduled'
                              ? 'border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                              : email.status === 'sending'
                                ? 'border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                                : email.status === 'sent'
                                  ? 'border-green-300 dark:border-green-800 text-green-600 dark:text-green-400'
                                  : email.status === 'failed'
                                    ? 'border-red-300 dark:border-red-800 text-red-600 dark:text-red-400'
                                    : 'border-stone-300 dark:border-zinc-700 text-stone-400 dark:text-zinc-500'
                          }`}
                        >
                          {email.status === 'scheduled' ? 'Queued' : email.status.charAt(0).toUpperCase() + email.status.slice(1)}
                        </Badge>
                      </div>

                      <p className="text-xs text-stone-500 dark:text-zinc-500 truncate">
                        To: {email.recipient_to}
                        {email.recipient_cc && ` · CC: ${email.recipient_cc}`}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5 text-xs text-stone-400 dark:text-zinc-500">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>
                          {email.status === 'sent' && email.sent_at
                            ? `Sent ${formatTimeAgo(email.sent_at)}`
                            : email.status === 'scheduled'
                              ? `Sends ${formatNextRun(email.scheduled_at)} · ${new Date(email.scheduled_at).toLocaleString()}`
                              : email.status === 'failed'
                                ? `Failed${email.error_message ? `: ${email.error_message}` : ''}`
                                : `Scheduled for ${new Date(email.scheduled_at).toLocaleString()}`
                          }
                        </span>
                      </div>
                    </div>

                    {/* Cancel button — only for scheduled emails */}
                    {email.status === 'scheduled' && (
                      <div className="shrink-0">
                        {confirmCancelEmailId === email.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 px-1.5 sm:px-2 text-xs"
                              disabled={cancelingEmailId === email.id}
                              onClick={() => handleCancelEmail(email.id)}
                            >
                              {cancelingEmailId === email.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Cancel'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => setConfirmCancelEmailId(null)}
                            >
                              Keep
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-stone-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
                            onClick={() => setConfirmCancelEmailId(email.id)}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recurring Automations Section Header */}
        {scheduledEmails.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <Repeat2 className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
              Recurring Automations
            </h2>
          </div>
        )}

        {tasks.length === 0 ? (
          /* Empty state with example ideas */
          <div className="py-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 mx-auto mb-4">
                <Zap className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-2">No automations yet</h3>
              <p className="text-stone-500 dark:text-zinc-400 max-w-sm mx-auto mb-4 text-sm">
                Tell the Agent what to automate and it handles the rest. Here are some ideas:
              </p>
              <Button onClick={() => onNavigateToAgent()} variant="outline" size="sm">
                <Zap className="h-4 w-4 mr-2 text-amber-500" />
                Ask the Agent to create one
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium text-stone-400 dark:text-zinc-600 uppercase tracking-wider px-1">Example Automations</p>
              {EXAMPLE_AUTOMATIONS.map((example, i) => (
                <Card
                  key={i}
                  className="p-4 border-stone-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 cursor-pointer hover:bg-white dark:hover:bg-zinc-900 transition-colors"
                  onClick={() => onNavigateToAgent(example.prompt)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-800/20 shrink-0">
                      <example.icon className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-800 dark:text-zinc-200">{example.title}</p>
                      <p className="text-xs text-stone-500 dark:text-zinc-500 mt-0.5">{example.description}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-mono">
                        &ldquo;{example.prompt}&rdquo;
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          /* Task list */
          <div className="space-y-3">
            {tasks.map(task => (
              <Card
                key={task.id}
                className={`p-4 transition-colors border-stone-200 dark:border-zinc-800 ${
                  task.enabled
                    ? 'bg-white dark:bg-zinc-900'
                    : 'bg-stone-50 dark:bg-zinc-900/50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-stone-900 dark:text-white text-sm truncate">
                        {task.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${
                          task.enabled
                            ? 'border-green-300 dark:border-green-800 text-green-600 dark:text-green-400'
                            : 'border-stone-300 dark:border-zinc-700 text-stone-400 dark:text-zinc-500'
                        }`}
                      >
                        {task.enabled ? 'Active' : 'Paused'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 text-xs text-stone-500 dark:text-zinc-500 flex-wrap">
                      <span className="shrink-0">{TASK_TYPE_LABELS[task.task_type] || task.task_type}</span>
                      <span className="text-stone-300 dark:text-zinc-700 hidden sm:inline">&#183;</span>
                      <span className="truncate">{formatSchedule(task.frequency, task.time_of_day, task.day_of_week, task.day_of_month)}</span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-stone-400 dark:text-zinc-600 mt-1 truncate">{task.description}</p>
                    )}

                    <div className="flex items-center gap-2 sm:gap-3 mt-2 text-xs flex-wrap">
                      {task.lastExecution ? (
                        <div className="flex items-center gap-1">
                          {task.lastExecution.status === 'success' ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-400 shrink-0" />
                          )}
                          <span className="text-stone-500 dark:text-zinc-400">
                            {formatTimeAgo(task.lastExecution.started_at)}
                          </span>
                          {task.lastExecution.status === 'success' && (
                            <span className="text-stone-400 dark:text-zinc-500 ml-1 hidden sm:inline">
                              {formatLastResult(task.lastExecution)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-stone-400 dark:text-zinc-600">Never run</span>
                      )}
                      <span className="text-stone-300 dark:text-zinc-700">&#183;</span>
                      <div className="flex items-center gap-1 text-stone-400 dark:text-zinc-500">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>Next: {formatNextRun(task.next_run_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(task.id, task.enabled)}
                      disabled={togglingId === task.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        task.enabled
                          ? 'bg-amber-500'
                          : 'bg-stone-300 dark:bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                          task.enabled ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    {/* Delete */}
                    {confirmDeleteId === task.id ? (
                      <div className="flex items-center gap-1 ml-1 sm:ml-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 px-1.5 sm:px-2 text-xs"
                          disabled={deletingId === task.id}
                          onClick={() => handleDelete(task.id)}
                        >
                          {deletingId === task.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Delete'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 ml-1 text-stone-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
                        onClick={() => setConfirmDeleteId(task.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Footer hint */}
        {tasks.length > 0 && (
          <div className="text-center mt-6">
            <button
              onClick={() => onNavigateToAgent()}
              className="text-xs text-stone-400 dark:text-zinc-600 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
            >
              Ask the Agent to create more automations &#8594;
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
