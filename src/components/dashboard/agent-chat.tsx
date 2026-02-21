'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { BlitzAvatar } from '@/components/blitz-avatar'
import { MockConversationDropdown } from '@/components/mock-conversation'
import { MarkdownContent } from './markdown-content'
import {
  Send,
  Sparkles,
  AlertCircle,
  Loader2,
  User as UserIcon,
  Mail,
  Lightbulb,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  Tag,
  Archive,
  Trash2,
  Star,
  BarChart3,
  Shield,
  Users,
  RotateCcw,
  StopCircle,
  CheckCircle2,
  XCircle,
  Wrench,
  Eye,
  EyeOff,
  Zap,
  Circle,
  Clock,
} from 'lucide-react'

interface CustomWelcome {
  title: string
  subtitle: string
  headerBadge?: React.ReactNode
  suggestions: Array<{
    label: string
    prompt: string
    icon?: React.ReactNode
  }>
}

interface AgentChatProps {
  user: User
  isEmailConnected: boolean
  initialSessionId?: string
  initialPrompt?: string
  onOpenCommandPalette?: () => void
  onSessionCreated?: (sessionId: string) => void
  customWelcome?: CustomWelcome
}

interface SavedMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

// Tool display names and icons
const TOOL_META: Record<string, { label: string; icon: typeof Search }> = {
  searchEmails: { label: 'Searching emails', icon: Search },
  readEmail: { label: 'Reading email', icon: Eye },
  getEmailThread: { label: 'Loading thread', icon: Eye },
  getRecentEmails: { label: 'Getting recent emails', icon: Mail },
  sendEmail: { label: 'Sending email', icon: Send },
  draftEmail: { label: 'Creating draft', icon: Mail },
  getDrafts: { label: 'Loading drafts', icon: Mail },
  updateDraft: { label: 'Updating draft', icon: Mail },
  sendDraft: { label: 'Sending draft', icon: Send },
  deleteDraft: { label: 'Deleting draft', icon: Mail },
  getLabels: { label: 'Getting labels', icon: Tag },
  createLabel: { label: 'Creating label', icon: Tag },
  applyLabels: { label: 'Applying labels', icon: Tag },
  removeLabels: { label: 'Removing labels', icon: Tag },
  archiveEmails: { label: 'Archiving emails', icon: Archive },
  trashEmails: { label: 'Trashing emails', icon: Trash2 },
  bulkTrashByQuery: { label: 'Bulk trashing emails', icon: Trash2 },
  untrashEmails: { label: 'Restoring emails', icon: Archive },
  markAsRead: { label: 'Marking as read', icon: Eye },
  markAsUnread: { label: 'Marking as unread', icon: EyeOff },
  starEmails: { label: 'Starring emails', icon: Star },
  unstarEmails: { label: 'Unstarring emails', icon: Star },
  markAsImportant: { label: 'Marking important', icon: Star },
  markAsNotImportant: { label: 'Removing importance', icon: Star },
  reportSpam: { label: 'Reporting spam', icon: Shield },
  markNotSpam: { label: 'Rescuing from spam', icon: Shield },
  getContactDetails: { label: 'Looking up contact', icon: Users },
  getSenderHistory: { label: 'Getting sender history', icon: Users },
  getInboxStats: { label: 'Analyzing inbox', icon: BarChart3 },
  findUnsubscribableEmails: { label: 'Scanning for unsubscribe options', icon: Mail },
  unsubscribeFromEmail: { label: 'Unsubscribing', icon: Mail },
  bulkUnsubscribe: { label: 'Bulk unsubscribing', icon: Mail },
  scheduleEmail: { label: 'Scheduling email', icon: Clock },
  createRecurringTask: { label: 'Creating automation', icon: RotateCcw },
  webSearch: { label: 'Searching the web', icon: Search },
  findCompanies: { label: 'Finding companies', icon: Users },
  researchCompany: { label: 'Researching company', icon: Search },
}

function getToolMeta(toolName: string) {
  return TOOL_META[toolName] || { label: toolName, icon: Wrench }
}

// Format a morning briefing log result into a readable summary
function formatBriefingResult(result: Record<string, unknown>): string {
  const action = result.action as string
  if (action === 'archive') {
    const count = result.archived as number || 0
    return count > 0 ? `— ${count} emails archived` : '— no emails to archive'
  }
  if (action === 'trash') {
    const count = result.trashed as number || 0
    return count > 0 ? `— ${count} emails trashed` : '— no emails to trash'
  }
  if (action === 'unsubscribe') {
    const count = result.unsubscribed as number || 0
    return count > 0 ? `— ${count} unsubscribed` : '— no new subscriptions found'
  }
  if (action === 'stats') {
    const total = result.totalEmails as number || 0
    const unread = result.unread as number || 0
    return `— ${total} emails, ${unread} unread`
  }
  if (action === 'label') {
    const count = result.labeled as number || 0
    return count > 0 ? `— ${count} emails labeled` : '— no emails to label'
  }
  return ''
}

// Format detailed morning briefing result for expanded view
function formatBriefingDetails(result: Record<string, unknown>, status: string, errorMessage: string | null): React.ReactNode {
  if (status === 'failed') {
    return (
      <div className="text-sm text-red-400 dark:text-red-500">
        <span className="font-medium">Error:</span> {errorMessage || 'Unknown error'}
      </div>
    )
  }

  const action = result.action as string

  if (action === 'stats') {
    const total = result.totalEmails as number || 0
    const unread = result.unread as number || 0
    const timeframe = result.timeframe as string || 'today'
    const topSenders = (result.topSenders as Array<{ sender: string; count: number }>) || []
    return (
      <div className="space-y-2 text-sm">
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <div className="px-3 py-1.5 rounded-md bg-stone-100 dark:bg-zinc-800 border border-stone-200/60 dark:border-zinc-700/60">
            <span className="text-stone-500 dark:text-zinc-500 text-xs">Total</span>
            <p className="text-stone-800 dark:text-zinc-200 font-semibold">{total}</p>
          </div>
          <div className="px-3 py-1.5 rounded-md bg-stone-100 dark:bg-zinc-800 border border-stone-200/60 dark:border-zinc-700/60">
            <span className="text-stone-500 dark:text-zinc-500 text-xs">Unread</span>
            <p className="text-stone-800 dark:text-zinc-200 font-semibold">{unread}</p>
          </div>
          <div className="px-3 py-1.5 rounded-md bg-stone-100 dark:bg-zinc-800 border border-stone-200/60 dark:border-zinc-700/60">
            <span className="text-stone-500 dark:text-zinc-500 text-xs">Period</span>
            <p className="text-stone-800 dark:text-zinc-200 font-semibold capitalize">{timeframe}</p>
          </div>
        </div>
        {topSenders.length > 0 && (
          <div>
            <p className="text-xs font-medium text-stone-400 dark:text-zinc-500 mb-1.5">Top Senders</p>
            <div className="space-y-1">
              {topSenders.slice(0, 5).map((s, i) => {
                const senderName = s.sender.replace(/<[^>]+>/g, '').replace(/"/g, '').trim()
                const shortName = senderName.length > 35 ? senderName.slice(0, 35) + '…' : senderName
                return (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-stone-600 dark:text-zinc-400 truncate mr-2">{shortName}</span>
                    <span className="text-stone-400 dark:text-zinc-600 shrink-0">{s.count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (action === 'archive') {
    const found = result.emailsFound as number || 0
    const archived = result.archived as number || 0
    return (
      <div className="space-y-1 text-sm">
        <div className="flex gap-4">
          <span className="text-stone-500 dark:text-zinc-500">Emails found: <span className="text-stone-700 dark:text-zinc-300 font-medium">{found}</span></span>
          <span className="text-stone-500 dark:text-zinc-500">Archived: <span className="text-stone-700 dark:text-zinc-300 font-medium">{archived}</span></span>
        </div>
      </div>
    )
  }

  if (action === 'trash') {
    const trashed = result.trashed as number || 0
    return (
      <div className="text-sm text-stone-500 dark:text-zinc-500">
        Emails trashed: <span className="text-stone-700 dark:text-zinc-300 font-medium">{trashed}</span>
      </div>
    )
  }

  if (action === 'unsubscribe') {
    const found = result.found as number || 0
    const unsubscribed = result.unsubscribed as number || 0
    const failed = result.failed as number || 0
    return (
      <div className="space-y-1 text-sm">
        <div className="flex gap-4">
          <span className="text-stone-500 dark:text-zinc-500">Found: <span className="text-stone-700 dark:text-zinc-300 font-medium">{found}</span></span>
          <span className="text-stone-500 dark:text-zinc-500">Unsubscribed: <span className="text-emerald-600 dark:text-emerald-400 font-medium">{unsubscribed}</span></span>
          {failed > 0 && <span className="text-stone-500 dark:text-zinc-500">Failed: <span className="text-red-400 font-medium">{failed}</span></span>}
        </div>
      </div>
    )
  }

  if (action === 'label') {
    const found = result.found as number || 0
    const labeled = result.labeled as number || 0
    return (
      <div className="space-y-1 text-sm">
        <div className="flex gap-4">
          <span className="text-stone-500 dark:text-zinc-500">Emails found: <span className="text-stone-700 dark:text-zinc-300 font-medium">{found}</span></span>
          <span className="text-stone-500 dark:text-zinc-500">Labeled: <span className="text-stone-700 dark:text-zinc-300 font-medium">{labeled}</span></span>
        </div>
      </div>
    )
  }

  return null
}

// Generate contextual BLITZ prompt for a briefing log entry
function getBriefingPrompt(log: { task_title: string; status: string; result: Record<string, unknown> }): string {
  if (log.status === 'failed') {
    return `My "${log.task_title}" automation failed. Can you help me troubleshoot it?`
  }
  const action = log.result?.action as string
  switch (action) {
    case 'stats':
      return 'Give me a detailed breakdown of my inbox activity from today'
    case 'archive':
      return 'Show me what emails were archived in my last automation run'
    case 'trash':
      return 'What emails were trashed by my automation?'
    case 'unsubscribe':
      return 'Show me my recent unsubscribe results and any newsletters I should still unsubscribe from'
    case 'label':
      return 'Show me the emails that were labeled by my automation'
    default:
      return `Tell me more about my "${log.task_title}" automation results`
  }
}

// ─── Tool call block — Style A amber-tinted card ────────────────────
function ToolCallBlock({ part }: { part: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false)
  const partType = part.type as string
  const toolName = partType === 'dynamic-tool'
    ? (part.toolName as string) || 'unknown'
    : partType.startsWith('tool-') ? partType.slice(5) : (part.toolName as string) || 'unknown'
  const state = part.state as string
  const meta = getToolMeta(toolName)
  const Icon = meta.icon
  const input = part.input as Record<string, unknown> | undefined
  const output = part.output as Record<string, unknown> | undefined
  const errorText = part.errorText as string | undefined

  const isRunning = state === 'input-streaming' || state === 'input-available' || state === 'call' || state === 'partial-call'
  const isDone = state === 'output-available' || state === 'result'
  const isError = state === 'output-error'

  const inputSummary = input ? summarizeToolInput(toolName, input) : null

  return (
    <div className={`my-2 rounded-lg border overflow-hidden transition-colors max-w-full ${
      isRunning
        ? 'border-amber-300 dark:border-amber-700/40 bg-amber-50/60 dark:bg-amber-950/20'
        : isError
          ? 'border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-900/10'
          : 'border-amber-200/60 dark:border-amber-800/30 bg-amber-50/40 dark:bg-amber-950/15'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-amber-50/60 dark:hover:bg-amber-950/30 transition-colors"
      >
        {isRunning && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />}
        {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
        {isError && <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
        <Icon className="h-3.5 w-3.5 text-amber-700/60 dark:text-amber-500/60 shrink-0" />
        <span className="font-medium text-amber-900 dark:text-amber-200">{meta.label}</span>
        {inputSummary && (
          <span className="text-amber-700/50 dark:text-amber-400/50 truncate max-w-[120px] sm:max-w-[250px]">— {inputSummary}</span>
        )}
        {isRunning && <span className="text-[10px] text-amber-600 dark:text-amber-400 ml-1 animate-pulse">running</span>}
        <ChevronRight className={`h-3 w-3 ml-auto text-amber-400 dark:text-amber-600 transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-amber-200/60 dark:border-amber-800/20 px-3 py-2 space-y-2 bg-amber-50/20 dark:bg-amber-950/10">
          {input && Object.keys(input).length > 0 && (
            <div>
              <div className="text-[10px] font-medium text-amber-700/60 dark:text-amber-500/50 uppercase tracking-wider mb-1">What it&apos;s doing</div>
              <div className="text-[11px] text-amber-800/70 dark:text-amber-300/60 bg-white/60 dark:bg-black/30 rounded p-2 space-y-0.5 break-words overflow-hidden">
                {humanizeToolInput(toolName, input).map((line, i) => (
                  <div key={i} className="break-words">{line}</div>
                ))}
              </div>
            </div>
          )}
          {isDone && output && (
            <div>
              <div className="text-[10px] font-medium text-amber-700/60 dark:text-amber-500/50 uppercase tracking-wider mb-1">Result</div>
              <div className="text-[11px] text-amber-800/70 dark:text-amber-300/60 bg-white/60 dark:bg-black/30 rounded p-2 space-y-0.5 break-words overflow-hidden">
                {humanizeToolOutput(toolName, output).map((line, i) => (
                  <div key={i} className="break-words">{line}</div>
                ))}
              </div>
            </div>
          )}
          {isError && errorText && (
            <div className="text-xs text-red-500">{errorText}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Grouped Tool Calls — ultra-compact: 1 active line, collapsed when done ──
function ToolCallGroup({ parts }: { parts: Record<string, unknown>[] }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  // Parse all tool info upfront
  const tools = parts.map((part) => {
    const partType = part.type as string
    const toolName = partType === 'dynamic-tool'
      ? (part.toolName as string) || 'unknown'
      : partType.startsWith('tool-') ? partType.slice(5) : (part.toolName as string) || 'unknown'
    const state = part.state as string
    const meta = getToolMeta(toolName)
    const input = part.input as Record<string, unknown> | undefined
    const output = part.output as Record<string, unknown> | undefined
    const errorText = part.errorText as string | undefined
    const isRunning = state === 'input-streaming' || state === 'input-available' || state === 'call' || state === 'partial-call'
    const isDone = state === 'output-available' || state === 'result'
    const isError = state === 'output-error'
    const inputSummary = input ? summarizeToolInput(toolName, input) : null
    return { toolName, state, meta, input, output, errorText, isRunning, isDone, isError, inputSummary }
  })

  const completedCount = tools.filter(t => t.isDone).length
  const errorCount = tools.filter(t => t.isError).length
  const runningTool = tools.find(t => t.isRunning)
  const allDone = tools.every(t => t.isDone || t.isError)

  // While running: show header + just the current tool
  // When done: show collapsed "X tools completed" — click to expand full list
  return (
    <div className={`my-1.5 rounded-lg border overflow-hidden transition-colors max-w-full ${
      runningTool
        ? 'border-amber-300/60 dark:border-amber-700/30 bg-amber-50/40 dark:bg-amber-950/15'
        : errorCount > 0
          ? 'border-red-200/60 dark:border-red-500/20 bg-red-50/20 dark:bg-red-900/10'
          : 'border-amber-200/40 dark:border-amber-800/20 bg-amber-50/30 dark:bg-amber-950/10'
    }`}>
      {/* Single-line header — always visible */}
      <button
        onClick={() => allDone ? setIsExpanded(!isExpanded) : undefined}
        className={`w-full flex items-center gap-2 px-3 py-2 text-xs ${allDone ? 'cursor-pointer hover:bg-amber-50/40 dark:hover:bg-amber-950/20' : 'cursor-default'}`}
      >
        {runningTool ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
        ) : allDone && errorCount === 0 ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        ) : allDone && errorCount > 0 ? (
          <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
        ) : (
          <Wrench className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        )}

        <span className="font-medium text-amber-900 dark:text-amber-200 truncate">
          {allDone
            ? `${completedCount} tool${completedCount !== 1 ? 's' : ''} completed${errorCount > 0 ? ` · ${errorCount} failed` : ''}`
            : runningTool
              ? runningTool.meta.label + (runningTool.inputSummary ? ` — ${runningTool.inputSummary}` : '')
              : 'Running tools…'
          }
        </span>

        {/* Progress counter while running */}
        {runningTool && (
          <span className="ml-auto text-[10px] tabular-nums text-amber-600/70 dark:text-amber-400/60 shrink-0">
            {completedCount + 1}/{tools.length}
          </span>
        )}

        {/* Expand chevron when done */}
        {allDone && (
          <ChevronRight className={`h-3 w-3 ml-auto text-amber-400/60 dark:text-amber-600/50 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
        )}
      </button>

      {/* Expanded detail list — only shown when user clicks after completion */}
      {isExpanded && allDone && (
        <div className="border-t border-amber-200/30 dark:border-amber-800/15 px-3 py-1.5 space-y-0.5">
          {tools.map((tool, i) => {
            const Icon = tool.meta.icon
            const isDetailExpanded = expandedIndex === i
            return (
              <div key={i}>
                <button
                  onClick={() => setExpandedIndex(isDetailExpanded ? null : i)}
                  className="w-full flex items-center gap-2 py-1 text-xs hover:bg-amber-50/40 dark:hover:bg-amber-950/20 rounded transition-colors"
                >
                  {tool.isDone && <CheckCircle2 className="h-3 w-3 text-amber-500 dark:text-amber-400 shrink-0" />}
                  {tool.isError && <XCircle className="h-3 w-3 text-red-500 shrink-0" />}
                  <Icon className="h-3 w-3 text-amber-700/40 dark:text-amber-500/40 shrink-0" />
                  <span className="truncate text-amber-700/70 dark:text-amber-400/60">
                    {tool.meta.label}
                  </span>
                  {tool.inputSummary && (
                    <span className="text-amber-600/30 dark:text-amber-500/25 truncate max-w-[100px] sm:max-w-[180px]">— {tool.inputSummary}</span>
                  )}
                  <ChevronRight className={`h-2.5 w-2.5 ml-auto text-amber-400/50 dark:text-amber-600/50 transition-transform shrink-0 ${isDetailExpanded ? 'rotate-90' : ''}`} />
                </button>

                {isDetailExpanded && (
                  <div className="ml-5 mb-1 px-2 py-1.5 rounded bg-amber-50/30 dark:bg-amber-950/10 border border-amber-200/30 dark:border-amber-800/15 space-y-1.5">
                    {tool.input && Object.keys(tool.input).length > 0 && (
                      <div>
                        <div className="text-[9px] font-medium text-amber-700/50 dark:text-amber-500/40 uppercase tracking-wider mb-0.5">Input</div>
                        <div className="text-[11px] text-amber-800/60 dark:text-amber-300/50 space-y-0.5 break-words">
                          {humanizeToolInput(tool.toolName, tool.input).map((line, j) => (
                            <div key={j} className="break-words">{line}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {tool.isDone && tool.output && (
                      <div>
                        <div className="text-[9px] font-medium text-amber-700/50 dark:text-amber-500/40 uppercase tracking-wider mb-0.5">Result</div>
                        <div className="text-[11px] text-amber-800/60 dark:text-amber-300/50 space-y-0.5 break-words">
                          {humanizeToolOutput(tool.toolName, tool.output).map((line, j) => (
                            <div key={j} className="break-words">{line}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {tool.isError && tool.errorText && (
                      <div className="text-[11px] text-red-500">{tool.errorText}</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Approval Card — renders the [APPROVAL_REQUIRED] block ──────────
interface ApprovalData {
  action: string
  description: string
  details: string | null
}

// Destructive action keywords that trigger the approval card
const DESTRUCTIVE_PATTERNS = [
  /should I (?:move|trash|delete|remove|archive|send|forward|reply|unsubscribe)/i,
  /want me to (?:move|trash|delete|remove|archive|send|forward|reply|proceed|unsubscribe)/i,
  /shall I (?:move|trash|delete|remove|archive|send|forward|reply|proceed|unsubscribe)/i,
  /would you like (?:me to |to )(?:move|trash|delete|remove|archive|send|forward|reply|proceed|unsubscribe)/i,
  /ready to (?:send|trash|delete|archive|move|unsubscribe)/i,
  /confirm.*(?:trash|delete|archive|send|move|unsubscribe)/i,
  /proceed with (?:trashing|deleting|archiving|sending|moving|unsubscribing)/i,
  /would you like me to unsubscribe/i,
  /unsubscribe from (?:any|all|these|them|the following)/i,
]

// Detect the action type from the text
function detectActionType(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('trash') || lower.includes('delete') || lower.includes('remove')) return 'Trash emails'
  if (lower.includes('archive')) return 'Archive emails'
  if (lower.includes('send') || lower.includes('forward') || lower.includes('reply')) return 'Send email'
  if (lower.includes('unsubscribe')) return 'Unsubscribe'
  if (lower.includes('draft')) return 'Create draft'
  if (lower.includes('spam')) return 'Report spam'
  return 'Action'
}

// Extract details like email count from text
function extractDetails(text: string): string | null {
  const parts: string[] = []
  // Match "N emails" pattern
  const countMatch = text.match(/(\d+)\s*emails?/i)
  if (countMatch) parts.push(`${countMatch[1]} emails`)
  // Match "from X" pattern
  const fromMatch = text.match(/from\s+([A-Za-z0-9._@\s]+?)(?:\.|,|\?|$)/i)
  if (fromMatch) parts.push(`from ${fromMatch[1].trim()}`)
  return parts.length > 0 ? parts.join(', ') : null
}

function parseApprovalBlock(text: string): { before: string; approval: ApprovalData; after: string } | null {
  // First try: structured [APPROVAL_REQUIRED] block
  const startTag = '[APPROVAL_REQUIRED]'
  const endTag = '[/APPROVAL_REQUIRED]'
  const startIdx = text.indexOf(startTag)
  const endIdx = text.indexOf(endTag)
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = text.slice(0, startIdx).trim()
    const after = text.slice(endIdx + endTag.length).trim()
    const block = text.slice(startIdx + startTag.length, endIdx).trim()

    let action = ''
    let description = ''
    let details: string | null = null

    for (const line of block.split('\n')) {
      const trimmed = line.trim()
      if (trimmed.startsWith('action:')) action = trimmed.slice(7).trim()
      else if (trimmed.startsWith('description:')) description = trimmed.slice(12).trim()
      else if (trimmed.startsWith('details:')) details = trimmed.slice(8).trim()
    }

    if (action || description) {
      return { before, approval: { action, description, details }, after }
    }
  }

  // Fallback: detect plain-text approval questions
  for (const pattern of DESTRUCTIVE_PATTERNS) {
    if (pattern.test(text)) {
      // Split at the question — everything before is context, the question itself is the description
      const sentences = text.split(/(?<=[.!])\s+/)
      const questionSentences: string[] = []
      const contextSentences: string[] = []

      for (const s of sentences) {
        if (DESTRUCTIVE_PATTERNS.some(p => p.test(s)) || s.includes('?')) {
          questionSentences.push(s)
        } else {
          contextSentences.push(s)
        }
      }

      const description = questionSentences.join(' ').replace(/\?$/, '').trim() || text.split('?')[0].trim()
      const action = detectActionType(text)
      const details = extractDetails(text)

      return {
        before: contextSentences.join(' ').trim(),
        approval: { action, description, details },
        after: '',
      }
    }
  }

  return null
}

function ApprovalCard({ approval, onApprove, onDeny, responded }: {
  approval: ApprovalData
  onApprove: () => void
  onDeny: () => void
  responded: 'approved' | 'denied' | null
}) {
  const getActionIcon = (action: string) => {
    const lower = action.toLowerCase()
    if (lower.includes('trash') || lower.includes('delete')) return Trash2
    if (lower.includes('archive')) return Archive
    if (lower.includes('send')) return Send
    if (lower.includes('draft')) return Mail
    if (lower.includes('unsubscribe')) return Mail
    if (lower.includes('spam')) return Shield
    if (lower.includes('label')) return Tag
    if (lower.includes('star')) return Star
    return AlertCircle
  }

  const ActionIcon = getActionIcon(approval.action)
  const detailItems = approval.details?.split(',').map(d => d.trim()).filter(Boolean) || []

  return (
    <div className="my-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-stone-100 dark:border-zinc-800">
        <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
          <ActionIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <span className="text-sm font-semibold text-stone-800 dark:text-zinc-200">Approval Required</span>
      </div>

      <div className="px-4 py-3 space-y-3">
        <p className="text-sm text-stone-600 dark:text-zinc-300">{approval.description}</p>

        {detailItems.length > 0 && (
          <div>
            <p className="text-xs font-medium text-stone-400 dark:text-zinc-500 mb-1.5">Details</p>
            <div className="flex flex-wrap gap-1.5">
              {detailItems.map((item, i) => (
                <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md bg-stone-100 dark:bg-zinc-800 text-xs text-stone-600 dark:text-zinc-400 border border-stone-200/60 dark:border-zinc-700/60">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-stone-100 dark:border-zinc-800">
        {responded ? (
          <div className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium ${
            responded === 'approved'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
              : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800/40'
          }`}>
            {responded === 'approved' ? (
              <><CheckCircle2 className="h-4 w-4" /> Approved</>
            ) : (
              <><XCircle className="h-4 w-4" /> Denied</>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onDeny}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800/40 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
              Deny
            </button>
            <button
              onClick={onApprove}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function summarizeToolInput(toolName: string, input: Record<string, unknown>): string | null {
  if (input.query) return `"${String(input.query).slice(0, 40)}"`
  if (input.emailId) return `ID: ${String(input.emailId).slice(0, 12)}...`
  if (input.threadId) return `Thread: ${String(input.threadId).slice(0, 12)}...`
  if (input.to && input.subject) return `To: ${input.to} — ${String(input.subject).slice(0, 30)}`
  if (input.to) return `To: ${input.to}`
  if (input.email) return String(input.email)
  if (input.name) return String(input.name)
  if (input.timeframe) return String(input.timeframe)
  if (input.draftId) return `Draft: ${String(input.draftId).slice(0, 12)}...`
  if (Array.isArray(input.emailIds)) return `${input.emailIds.length} emails`
  return null
}

// Human-friendly descriptions for tool inputs and outputs (no raw JSON)
function humanizeToolInput(toolName: string, input: Record<string, unknown>): string[] {
  const lines: string[] = []
  switch (toolName) {
    case 'searchEmails':
      if (input.query) lines.push(`Searching for: "${input.query}"`)
      if (input.maxResults) lines.push(`Looking at up to ${input.maxResults} results`)
      if (input.from) lines.push(`From: ${input.from}`)
      if (input.to) lines.push(`To: ${input.to}`)
      if (input.after) lines.push(`After: ${input.after}`)
      if (input.before) lines.push(`Before: ${input.before}`)
      if (input.unreadOnly) lines.push('Unread emails only')
      break
    case 'readEmail':
      lines.push('Opening and reading the full email content')
      break
    case 'getEmailThread':
      lines.push('Loading the full email conversation thread')
      break
    case 'getRecentEmails':
      if (input.timeframe) lines.push(`Timeframe: ${input.timeframe}`)
      if (input.maxResults) lines.push(`Up to ${input.maxResults} emails`)
      if (input.unreadOnly) lines.push('Unread only')
      break
    case 'sendEmail':
      if (input.to) lines.push(`To: ${input.to}`)
      if (input.subject) lines.push(`Subject: ${String(input.subject).slice(0, 60)}`)
      if (input.cc) lines.push(`CC: ${input.cc}`)
      break
    case 'draftEmail':
      if (input.to) lines.push(`To: ${input.to}`)
      if (input.subject) lines.push(`Subject: ${String(input.subject).slice(0, 60)}`)
      break
    case 'scheduleEmail':
      if (input.to) lines.push(`To: ${input.to}`)
      if (input.subject) lines.push(`Subject: ${String(input.subject).slice(0, 60)}`)
      if (input.scheduledAt) lines.push(`Scheduled for: ${new Date(String(input.scheduledAt)).toLocaleString()}`)
      break
    case 'sendDraft':
      lines.push('Sending an existing draft email')
      break
    case 'trashEmails':
      if (Array.isArray(input.emailIds)) lines.push(`Moving ${input.emailIds.length} email${input.emailIds.length === 1 ? '' : 's'} to trash`)
      break
    case 'archiveEmails':
      if (Array.isArray(input.emailIds)) lines.push(`Archiving ${input.emailIds.length} email${input.emailIds.length === 1 ? '' : 's'}`)
      break
    case 'applyLabels':
      if (Array.isArray(input.emailIds)) lines.push(`Applying labels to ${input.emailIds.length} email${input.emailIds.length === 1 ? '' : 's'}`)
      if (Array.isArray(input.labelIds)) lines.push(`Labels: ${input.labelIds.join(', ')}`)
      break
    case 'createLabel':
      if (input.name) lines.push(`Creating label: "${input.name}"`)
      break
    case 'removeLabels':
      if (Array.isArray(input.emailIds)) lines.push(`Removing labels from ${input.emailIds.length} email${input.emailIds.length === 1 ? '' : 's'}`)
      break
    case 'markAsRead':
    case 'markAsUnread':
      if (Array.isArray(input.emailIds)) lines.push(`${input.emailIds.length} email${input.emailIds.length === 1 ? '' : 's'}`)
      break
    case 'starEmails':
    case 'unstarEmails':
      if (Array.isArray(input.emailIds)) lines.push(`${input.emailIds.length} email${input.emailIds.length === 1 ? '' : 's'}`)
      break
    case 'unsubscribeFromEmail':
      lines.push('Unsubscribing from this sender')
      break
    case 'bulkUnsubscribe':
      if (Array.isArray(input.emailIds)) lines.push(`Unsubscribing from ${input.emailIds.length} sender${input.emailIds.length === 1 ? '' : 's'}`)
      break
    case 'bulkTrashByQuery':
      if (input.query) lines.push(`Trashing all emails matching: "${input.query}"`)
      lines.push('This runs server-side and handles unlimited emails automatically')
      break
    case 'findUnsubscribableEmails':
      lines.push('Scanning inbox for newsletters and marketing emails')
      break
    case 'getContactDetails':
      if (input.email) lines.push(`Looking up: ${input.email}`)
      break
    case 'getSenderHistory':
      if (input.email) lines.push(`Getting history for: ${input.email}`)
      break
    case 'getInboxStats':
      lines.push('Analyzing your inbox patterns')
      break
    case 'getLabels':
      lines.push('Loading all labels')
      break
    case 'getDrafts':
      lines.push('Loading your drafts')
      break
    default:
      // Fallback: show key-value pairs in plain English
      for (const [key, val] of Object.entries(input)) {
        if (key === 'confirmed') continue
        if (val === undefined || val === null) continue
        const displayVal = typeof val === 'string' ? val.slice(0, 60) : Array.isArray(val) ? `${val.length} items` : String(val)
        lines.push(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}: ${displayVal}`)
      }
  }
  if (lines.length === 0) lines.push('Processing...')
  return lines
}

function humanizeToolOutput(toolName: string, output: Record<string, unknown>): string[] {
  const lines: string[] = []

  // Check for errors first
  if (output.error) {
    lines.push(`Error: ${String(output.error).slice(0, 100)}`)
    return lines
  }
  if (output.success === false) {
    lines.push(output.message ? String(output.message) : 'Action was not completed')
    return lines
  }

  switch (toolName) {
    case 'searchEmails': {
      const emails = output.emails as Array<Record<string, unknown>> | undefined
      if (emails) {
        lines.push(`Found ${emails.length} email${emails.length === 1 ? '' : 's'}`)
        emails.slice(0, 3).forEach(e => {
          const from = (e.from as string || '').split('<')[0].trim()
          const subject = String(e.subject || 'No subject').slice(0, 50)
          lines.push(`• ${from ? from + ': ' : ''}${subject}`)
        })
        if (emails.length > 3) lines.push(`  ...and ${emails.length - 3} more`)
      } else {
        lines.push('No emails found')
      }
      break
    }
    case 'readEmail': {
      const subject = output.subject ? String(output.subject).slice(0, 60) : null
      const from = output.from ? String(output.from).split('<')[0].trim() : null
      if (from) lines.push(`From: ${from}`)
      if (subject) lines.push(`Subject: ${subject}`)
      if (output.date) lines.push(`Date: ${String(output.date).slice(0, 25)}`)
      if (!from && !subject) lines.push('Email loaded')
      break
    }
    case 'getEmailThread': {
      const messages = output.messages as Array<unknown> | undefined
      if (messages) lines.push(`Loaded thread with ${messages.length} message${messages.length === 1 ? '' : 's'}`)
      else lines.push('Thread loaded')
      break
    }
    case 'getRecentEmails': {
      const emails = output.emails as Array<unknown> | undefined
      if (emails) lines.push(`Got ${emails.length} recent email${emails.length === 1 ? '' : 's'}`)
      else lines.push('Loaded recent emails')
      break
    }
    case 'sendEmail':
      lines.push(output.message ? String(output.message) : 'Email sent successfully')
      break
    case 'draftEmail':
      lines.push(output.message ? String(output.message) : 'Draft created')
      break
    case 'scheduleEmail':
      lines.push(output.message ? String(output.message) : 'Email scheduled')
      break
    case 'sendDraft':
      lines.push('Draft sent successfully')
      break
    case 'trashEmails':
      lines.push(output.message ? String(output.message) : 'Moved to trash')
      break
    case 'archiveEmails':
      lines.push(output.message ? String(output.message) : 'Emails archived')
      break
    case 'createLabel':
      lines.push(output.message ? String(output.message) : 'Label created')
      break
    case 'applyLabels':
      lines.push(output.message ? String(output.message) : 'Labels applied')
      break
    case 'removeLabels':
      lines.push(output.message ? String(output.message) : 'Labels removed')
      break
    case 'unsubscribeFromEmail':
      if (output.method === 'one-click') lines.push('Unsubscribed (one-click)')
      else if (output.method === 'link') lines.push('Unsubscribe link provided')
      else lines.push(output.message ? String(output.message) : 'Unsubscribed')
      break
    case 'bulkUnsubscribe':
      if (output.succeeded) lines.push(`Unsubscribed from ${output.succeeded} sender${Number(output.succeeded) === 1 ? '' : 's'}`)
      if (output.failed && Number(output.failed) > 0) lines.push(`${output.failed} failed`)
      if (lines.length === 0) lines.push(output.message ? String(output.message) : 'Bulk unsubscribe complete')
      break
    case 'bulkTrashByQuery':
      if (output.message) lines.push(String(output.message))
      else lines.push('Bulk trash complete')
      break
    case 'findUnsubscribableEmails': {
      const emails = output.emails as Array<Record<string, unknown>> | undefined
      if (emails) {
        lines.push(`Found ${emails.length} sender${emails.length === 1 ? '' : 's'} with unsubscribe option`)
        emails.slice(0, 3).forEach(e => {
          lines.push(`• ${e.senderName || e.from || 'Unknown sender'}`)
        })
        if (emails.length > 3) lines.push(`  ...and ${emails.length - 3} more`)
      } else {
        lines.push('No unsubscribable emails found')
      }
      break
    }
    case 'getInboxStats':
      lines.push('Inbox analysis complete')
      if (output.totalEmails) lines.push(`Total emails: ${output.totalEmails}`)
      if (output.unread) lines.push(`Unread: ${output.unread}`)
      break
    case 'getLabels': {
      const labels = output.labels as Array<unknown> | undefined
      if (labels) lines.push(`Found ${labels.length} label${labels.length === 1 ? '' : 's'}`)
      else lines.push('Labels loaded')
      break
    }
    case 'getContactDetails':
      lines.push('Contact info loaded')
      break
    case 'getSenderHistory':
      lines.push('Sender history loaded')
      break
    case 'markAsRead':
    case 'markAsUnread':
    case 'starEmails':
    case 'unstarEmails':
    case 'markAsImportant':
    case 'markAsNotImportant':
    case 'reportSpam':
    case 'markNotSpam':
      lines.push(output.message ? String(output.message) : 'Done')
      break
    default:
      if (output.message) lines.push(String(output.message))
      else if (output.success) lines.push('Completed successfully')
      else lines.push('Done')
  }
  return lines
}

// TipsDropdown replaced by MockConversationDropdown — see mock-conversation/index.tsx

const REQUEST_TIMEOUT = 120000

// Wrapper that loads history / creates session before rendering the actual chat
export function AgentChat({ user, isEmailConnected, initialSessionId, initialPrompt, onOpenCommandPalette, onSessionCreated, customWelcome }: AgentChatProps) {
  const [ready, setReady] = useState(false)
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null)

  useEffect(() => {
    if (initialSessionId) {
      // Load existing session messages
      const loadHistory = async () => {
        try {
          const res = await fetch(`/api/chats/${initialSessionId}`)
          if (res.ok) {
            const data = await res.json()
            const msgs = (data.messages || []) as SavedMessage[]
            setInitialMessages(msgs.map(m => ({
              id: m.id,
              role: m.role,
              parts: [{ type: 'text' as const, text: m.content }],
            } as UIMessage)))
          }
        } catch (err) {
          console.error('Failed to load chat history:', err)
        } finally {
          setReady(true)
        }
      }
      loadHistory()
    } else {
      // New chat — no session needed until first message is sent
      setReady(true)
    }
  }, [initialSessionId])

  if (!ready) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <header className="relative z-10 border-b border-white/30 dark:border-white/[0.06] px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-[#faf8f5] dark:bg-[#111113] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <div className="min-w-0">
            <div className="h-6 w-40 rounded-full bg-stone-200/80 dark:bg-zinc-700/50" />
          </div>
        </header>
        <div className="flex-1 overflow-auto px-3 py-4 sm:p-6 bg-[#faf8f5] dark:bg-[#111113]">
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`flex gap-2 sm:gap-4 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                {i % 2 !== 0 && <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-200 dark:bg-zinc-800 shrink-0" />}
                <div className={`rounded-xl px-3 py-2 sm:px-4 sm:py-3 ${i % 2 === 0 ? 'bg-stone-300 dark:bg-zinc-700' : 'bg-stone-100 dark:bg-zinc-800'}`} style={{ width: `${50 + (i % 3) * 15}%`, maxWidth: '85%' }}>
                  <div className="space-y-2">
                    <div className="h-4 rounded bg-stone-200 dark:bg-zinc-700" style={{ width: '90%' }} />
                    <div className="h-4 rounded bg-stone-200 dark:bg-zinc-700" style={{ width: '70%' }} />
                    {i % 2 !== 0 && <div className="h-4 rounded bg-stone-200 dark:bg-zinc-700" style={{ width: '50%' }} />}
                  </div>
                </div>
                {i % 2 === 0 && <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-200 dark:bg-zinc-800 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <AgentChatInner
      user={user}
      isEmailConnected={isEmailConnected}
      sessionId={sessionId}
      initialMessages={initialMessages}
      initialPrompt={initialPrompt}
      onOpenCommandPalette={onOpenCommandPalette}
      onSessionCreated={onSessionCreated}
      customWelcome={customWelcome}
    />
  )
}

interface AgentChatInnerProps {
  user: User
  isEmailConnected: boolean
  sessionId: string | null
  initialMessages: UIMessage[]
  initialPrompt?: string
  onOpenCommandPalette?: () => void
  onSessionCreated?: (sessionId: string) => void
  customWelcome?: CustomWelcome
}

function AgentChatInner({ user, isEmailConnected, sessionId: initialSessionId, initialMessages, initialPrompt, onOpenCommandPalette, onSessionCreated, customWelcome }: AgentChatInnerProps) {
  // Check if this is a "Send to BLITZ" context (from contacts/analytics)
  const isBlitzContext = initialPrompt?.startsWith('[Contact:') || initialPrompt?.startsWith('[Sender:')
  const [blitzContext, setBlitzContext] = useState<string | null>(isBlitzContext ? initialPrompt! : null)
  const [input, setInput] = useState('')
  const [showTips, setShowTips] = useState(false)
  const [isTimedOut, setIsTimedOut] = useState(false)
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId)
  const sessionCreatingRef = useRef(false)
  const [briefingLogs, setBriefingLogs] = useState<{ task_title: string; status: string; result: Record<string, unknown>; error_message: string | null; started_at: string }[]>([])
  const [briefingLoaded, setBriefingLoaded] = useState(false)
  const [briefingExpanded, setBriefingExpanded] = useState(true)
  const [expandedLogIndex, setExpandedLogIndex] = useState<number | null>(null)

  // Fetch morning briefing logs on mount (only for new chats)
  useEffect(() => {
    if (initialMessages.length > 0 || !isEmailConnected) return
    const fetchBriefing = async () => {
      try {
        const res = await fetch('/api/recurring-tasks/logs?hours=24')
        if (res.ok) {
          const data = await res.json()
          setBriefingLogs(data.logs || [])
        }
      } catch {
        // Silently fail — morning briefing is optional
      } finally {
        setBriefingLoaded(true)
      }
    }
    fetchBriefing()
  }, [initialMessages.length, isEmailConnected])

  const historyMessageCount = initialMessages.length

  const { messages, sendMessage, status, error, stop } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/agent',
      body: { userId: user.id, userEmail: user.email, isEmailConnected },
    }),
  })

  const prevStatusRef = useRef(status)
  const isLoading = status === 'streaming' || status === 'submitted'

  const initialPromptSentRef = useRef(false)

  // Figure out what the agent is actively doing right now (for the streaming indicator)
  const activeToolInfo = useMemo(() => {
    if (!isLoading) return null
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
    if (!lastAssistant) return null
    const runningTools = lastAssistant.parts.filter(p => {
      if (p.type === 'dynamic-tool' || p.type.startsWith('tool-')) {
        const part = p as unknown as Record<string, unknown>
        const state = part.state as string
        return state === 'input-streaming' || state === 'input-available' || state === 'call' || state === 'partial-call'
      }
      return false
    })
    if (runningTools.length === 0) return null
    const lastRunning = runningTools[runningTools.length - 1] as unknown as Record<string, unknown>
    const pType = lastRunning.type as string
    const toolName = pType === 'dynamic-tool'
      ? (lastRunning.toolName as string) || 'unknown'
      : pType.startsWith('tool-') ? pType.slice(5) : (lastRunning.toolName as string) || 'unknown'
    return getToolMeta(toolName)
  }, [messages, isLoading])

  // Handle timeout
  useEffect(() => {
    if (isLoading && !loadingStartTime) {
      setLoadingStartTime(Date.now())
      setIsTimedOut(false)
      timeoutRef.current = setTimeout(() => {
        setIsTimedOut(true)
        if (stop) stop()
      }, REQUEST_TIMEOUT)
    }
    if (!isLoading) {
      setLoadingStartTime(null)
      setIsTimedOut(false)
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [isLoading, loadingStartTime, stop])

  // Lazily create a session if one doesn't exist yet, returns the session ID
  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (sessionId) return sessionId
    if (sessionCreatingRef.current) return null // already in progress
    sessionCreatingRef.current = true
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        const data = await res.json()
        setSessionId(data.session.id)
        onSessionCreated?.(data.session.id)
        return data.session.id
      }
    } catch (err) {
      console.error('Failed to create chat session:', err)
    } finally {
      sessionCreatingRef.current = false
    }
    return null
  }, [sessionId, onSessionCreated])

  // Save message helper — creates session on first call if needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saveMessage = useCallback(async (role: 'user' | 'assistant', content: string, metadata?: Record<string, any>) => {
    if (!content.trim()) return
    const sid = await ensureSession()
    if (!sid) return
    try {
      const body: Record<string, unknown> = { role, content }
      if (metadata) body.metadata = metadata
      await fetch(`/api/chats/${sid}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch (err) {
      console.error('Failed to save message:', err)
    }
  }, [ensureSession])

  // Auto-send initial prompt if provided (e.g. from automations example click)
  // But NOT for BLITZ context items — those wait for user input
  useEffect(() => {
    if (initialPrompt && !initialPromptSentRef.current && initialMessages.length === 0 && !isBlitzContext) {
      initialPromptSentRef.current = true
      sendMessage({ text: initialPrompt })
      saveMessage('user', initialPrompt)
    }
  }, [initialPrompt, initialMessages.length, sendMessage, saveMessage, isBlitzContext])

  // Save assistant message when streaming completes (including tool call metadata)
  useEffect(() => {
    if (prevStatusRef.current === 'streaming' && status === 'ready') {
      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
      if (lastAssistant) {
        const textContent = lastAssistant.parts
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map(p => p.text)
          .join('\n')
        if (textContent) {
          // Extract tool call metadata for persistence
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const toolCalls = lastAssistant.parts
            .filter(p => p.type !== 'text' && p.type !== 'step-start')
            .filter(p => {
              const state = (p as Record<string, unknown>).state as string | undefined
              return state === 'result' || state === 'output-available' || state === 'output-error'
            })
            .map(p => {
              const part = p as Record<string, unknown>
              const toolName = (part.toolName as string) || (typeof part.type === 'string' ? part.type.replace('tool-', '') : 'unknown')
              const input = (part.input || {}) as Record<string, unknown>
              const output = (part.output || {}) as Record<string, unknown>
              return {
                tool: toolName,
                input: summarizeToolInput(toolName, input) || TOOL_META[toolName]?.label || toolName,
                output: humanizeToolOutput(toolName, output)[0] || 'Done',
                error: part.state === 'output-error' ? (String(part.errorText || 'Error')) : undefined,
              }
            })
          const metadata = toolCalls.length > 0 ? { toolCalls } : undefined
          saveMessage('assistant', textContent, metadata)
        }
      }
    }
    prevStatusRef.current = status
  }, [status, messages, saveMessage])

  // Track whether user has manually scrolled away
  const userScrolledAwayRef = useRef(false)
  const lastScrollHeightRef = useRef(0)

  // Detect if user scrolls away from bottom
  useEffect(() => {
    const el = scrollAreaRef.current
    if (!el) return
    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      userScrolledAwayRef.current = distanceFromBottom > 300
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-scroll as new content arrives (streaming, tool calls, new messages)
  useEffect(() => {
    const el = scrollAreaRef.current
    if (!el) return
    // Always scroll if user hasn't manually scrolled away
    if (!userScrolledAwayRef.current) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight
      })
    }
    lastScrollHeightRef.current = el.scrollHeight
  }, [messages, status])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    setIsTimedOut(false)
    // If there's BLITZ context, prepend it to the user's message
    let text = input
    if (blitzContext) {
      text = `${blitzContext}\n\nUser request: ${input}`
      setBlitzContext(null) // Clear context after sending
    }
    sendMessage({ text })
    setInput('')
    saveMessage('user', text)
    // Reset scroll lock and force scroll to bottom on new message
    userScrolledAwayRef.current = false
    requestAnimationFrame(() => {
      const el = scrollAreaRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return
    setIsTimedOut(false)
    sendMessage({ text: suggestion })
    saveMessage('user', suggestion)
    userScrolledAwayRef.current = false
    requestAnimationFrame(() => {
      const el = scrollAreaRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }

  const handleMockPromptSelect = (prompt: string) => {
    setInput(prompt)
    setShowTips(false)
    inputRef.current?.focus()
  }

  // Track approval responses per message ID
  const [approvalResponses, setApprovalResponses] = useState<Record<string, 'approved' | 'denied'>>({})

  const handleApproval = (messageId: string, response: 'approved' | 'denied') => {
    if (isLoading) return
    setApprovalResponses(prev => ({ ...prev, [messageId]: response }))
    const text = response === 'approved' ? 'Yes, approved. Proceed.' : 'No, denied. Do not proceed.'
    sendMessage({ text })
    saveMessage('user', text)
  }

  const handleStop = () => { if (stop) stop(); setIsTimedOut(false); setLoadingStartTime(null) }

  const handleRetry = () => {
    setIsTimedOut(false)
    setLoadingStartTime(null)
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (lastUserMessage) {
      const text = lastUserMessage.parts.filter((p): p is { type: 'text'; text: string } => p.type === 'text').map(p => p.text).join('')
      if (text) sendMessage({ text })
    }
  }

  const suggestions = [
    'Show me my unread emails from today',
    'Draft a follow-up email for a prospect',
    'Archive all emails older than 30 days',
    'Get my inbox stats for this week',
    'Go find all emails with receipt attachments and put them into a new folder called SAP Concur',
    'Make a folder for all emails from today only and then provide me a Gmail URL for it',
  ]

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  // Check if the last assistant message has any running tool — if so, don't show separate loading bubble
  const lastMessage = messages[messages.length - 1]
  const lastMsgHasRunningTool = lastMessage?.role === 'assistant' && lastMessage.parts.some(p => {
    if (p.type === 'dynamic-tool' || p.type.startsWith('tool-')) {
      const state = (p as unknown as Record<string, unknown>).state as string
      return state === 'input-streaming' || state === 'input-available' || state === 'call' || state === 'partial-call'
    }
    return false
  })

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header — liquid glass bar (opaque, glossy finish) */}
      <header className="relative z-10 border-b border-white/30 dark:border-white/[0.06] px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-[#faf8f5] dark:bg-[#111113] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="min-w-0">
          {customWelcome?.headerBadge || (
            <Badge variant="secondary" className="bg-stone-100/80 dark:bg-zinc-800/80 text-stone-700 dark:text-zinc-300 border border-stone-200/60 dark:border-zinc-700/60 px-3 py-1 text-xs font-medium tracking-wide rounded-full">
              <Sparkles className="h-3 w-3 mr-1.5 text-stone-400 dark:text-zinc-500" />
              Email AI Intelligence
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onOpenCommandPalette && (
            <button
              className="inline-flex items-center cursor-pointer px-2 py-1.5 sm:px-2.5 gap-1.5 rounded-lg text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 active:bg-stone-150 dark:active:bg-zinc-700 transition-all duration-150 border border-stone-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/60 shadow-sm hover:shadow"
              onClick={onOpenCommandPalette}
            >
              <Search className="h-3.5 w-3.5" />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-medium bg-stone-100 dark:bg-zinc-700/60 border border-stone-200/60 dark:border-zinc-600/40">
                ⌘K
              </kbd>
            </button>
          )}
          <div className="relative">
            <button
              className="inline-flex items-center cursor-pointer px-2.5 py-1.5 sm:px-3 sm:py-1.5 gap-1.5 sm:gap-2 rounded-lg text-stone-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 active:bg-stone-150 dark:active:bg-zinc-700 transition-all duration-150 border border-stone-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/60 shadow-sm hover:shadow"
              onClick={() => setShowTips(!showTips)}
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-medium hidden sm:inline">Examples</span>
              <span className="text-xs font-medium sm:hidden">Examples</span>
              <ChevronDown className={`h-3 w-3 text-stone-400 dark:text-zinc-500 transition-transform duration-200 ${showTips ? 'rotate-180' : ''}`} />
            </button>
            <MockConversationDropdown isOpen={showTips} onClose={() => setShowTips(false)} onPromptSelect={handleMockPromptSelect} />
          </div>
          {!isEmailConnected && (
            <div className="hidden sm:flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg text-sm border border-amber-200/60 dark:border-amber-800/30">
              <Mail className="h-4 w-4" />Connect your email
            </div>
          )}
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-auto px-3 py-4 sm:p-6 bg-[#faf8f5] dark:bg-[#111113]" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <div className="h-full overflow-auto">
           <div className="min-h-full flex flex-col items-center justify-center py-6">
            <div className="mb-4 sm:mb-5 relative group cursor-pointer">
              <BlitzAvatar size="lg" />
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 absolute left-1/2 -translate-x-1/2 top-full mt-3 w-72 sm:w-80 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl dark:shadow-black/40 p-4 z-20">
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-stone-200 dark:border-b-zinc-700" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mt-[1px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-white dark:border-b-zinc-900" />
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-bold tracking-widest font-mono text-amber-500">BLITZ</span>
                  <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-mono tracking-wide">The Lightning Bug</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
                  A glowing firefly crackling with electricity. Blitz zaps through your inbox at the speed of light and never burns out.
                </p>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-stone-900 dark:text-white">
              {customWelcome ? customWelcome.title : `Hello, ${userName}`}
            </h2>
            <p className="text-stone-500 dark:text-zinc-400 mb-2 text-center max-w-md text-sm sm:text-base px-4">
              {customWelcome ? customWelcome.subtitle : "I'm BLITZ, your AI email agent. I can search, send, organize, analyze, and unsubscribe — just tell me what you need."}
            </p>
            {!customWelcome && (
              <button onClick={() => setShowTips(true)} className="text-sm text-stone-900 dark:text-white hover:underline mb-6 sm:mb-8 flex items-center gap-1">
                <Lightbulb className="h-3.5 w-3.5" />See everything I can do
              </button>
            )}
            {customWelcome && <div className="mb-6 sm:mb-8" />}

            {/* Morning Briefing — Interactive expandable */}
            {briefingLoaded && briefingLogs.length > 0 && (
              <div className="max-w-2xl w-full px-2 mb-6">
                <Card className="border-amber-200/60 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-950/10 overflow-hidden">
                  {/* Clickable header */}
                  <button
                    onClick={() => setBriefingExpanded(!briefingExpanded)}
                    className="w-full flex items-center gap-2 p-4 pb-3 cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors"
                  >
                    <span className="text-lg">&#9728;&#65039;</span>
                    <span className="text-sm font-semibold text-stone-800 dark:text-zinc-200">Morning Briefing</span>
                    <span className="text-xs text-stone-500 dark:text-zinc-500">Last 24 hours</span>
                    <span className="ml-auto text-stone-400 dark:text-zinc-600">
                      {briefingExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </span>
                  </button>

                  {/* Expandable log list */}
                  {briefingExpanded && (
                    <div className="px-4 pb-4 space-y-1">
                      {briefingLogs.slice(0, 8).map((log, i) => {
                        const isExpanded = expandedLogIndex === i
                        return (
                          <div key={i} className="rounded-lg border border-stone-200/50 dark:border-zinc-800/50 overflow-hidden">
                            {/* Clickable row */}
                            <button
                              onClick={() => setExpandedLogIndex(isExpanded ? null : i)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-stone-50 dark:hover:bg-zinc-800/30 transition-colors"
                            >
                              {log.status === 'success' ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                              )}
                              <div className="min-w-0 text-left flex-1">
                                <span className="text-stone-700 dark:text-zinc-300">{log.task_title}</span>
                                {log.status === 'success' && log.result && (
                                  <span className="text-stone-500 dark:text-zinc-500 ml-1">
                                    {formatBriefingResult(log.result)}
                                  </span>
                                )}
                                {log.status === 'failed' && log.error_message && (
                                  <span className="text-red-400 dark:text-red-500 ml-1 text-xs">
                                    {' '}&#8212; {log.error_message.length > 40 ? log.error_message.slice(0, 40) + '…' : log.error_message}
                                  </span>
                                )}
                              </div>
                              <span className="text-stone-400 dark:text-zinc-600 shrink-0">
                                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              </span>
                            </button>

                            {/* Expanded detail panel */}
                            {isExpanded && (
                              <div className="px-3 pb-3 pt-1 border-t border-stone-100 dark:border-zinc-800/50 bg-stone-50/50 dark:bg-zinc-900/30">
                                <div className="mb-3">
                                  {formatBriefingDetails(log.result, log.status, log.error_message)}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const prompt = getBriefingPrompt(log)
                                    sendMessage({ text: prompt })
                                    saveMessage('user', prompt)
                                    setExpandedLogIndex(null)
                                  }}
                                  className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer"
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  Ask BLITZ
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {briefingLogs.length > 8 && (
                        <p className="text-xs text-stone-400 dark:text-zinc-600 pt-1 px-1">
                          +{briefingLogs.length - 8} more
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 max-w-2xl w-full px-2">
              {customWelcome ? (
                customWelcome.suggestions.map((suggestion, i) => (
                  <Card key={i} className="p-3 sm:p-4 cursor-pointer hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm dark:shadow-none" onClick={() => handleSuggestionClick(suggestion.prompt)}>
                    <div className="flex items-start gap-2 sm:gap-3">
                      {suggestion.icon || <Sparkles className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />}
                      <span className="text-sm text-stone-700 dark:text-zinc-300 break-words">{suggestion.label}</span>
                    </div>
                  </Card>
                ))
              ) : (
                suggestions.map((suggestion, i) => (
                  <Card key={i} className="p-3 sm:p-4 cursor-pointer hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm dark:shadow-none" onClick={() => handleSuggestionClick(suggestion)}>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Sparkles className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                      <span className="text-sm text-stone-700 dark:text-zinc-300 break-words">{suggestion}</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
           </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
            {messages.map((message, msgIndex) => (
              <React.Fragment key={message.id}>
                {/* Separator between restored history and new messages */}
                {msgIndex === historyMessageCount && historyMessageCount > 0 && (
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-stone-200 dark:bg-zinc-800" />
                    <span className="text-xs text-stone-400 dark:text-zinc-600">New messages</span>
                    <div className="flex-1 h-px bg-stone-200 dark:bg-zinc-800" />
                  </div>
                )}
                <div className={`flex gap-2 sm:gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && (
                    <div className="shrink-0">
                      <BlitzAvatar size="sm" />
                    </div>
                  )}
                  <div className={`max-w-[90%] sm:max-w-[85%] rounded-xl px-3 py-2 sm:px-4 sm:py-3 ${
                    message.role === 'user'
                      ? 'bg-stone-800 dark:bg-zinc-200 text-white dark:text-zinc-900'
                      : 'bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-sm dark:shadow-none text-stone-700 dark:text-zinc-300'
                  }`}>
                    {(() => {
                      // Group consecutive tool call parts together
                      const groups: Array<{ type: 'text'; part: typeof message.parts[0]; index: number } | { type: 'tools'; parts: Record<string, unknown>[]; startIndex: number } | { type: 'other'; index: number }> = []
                      let currentToolGroup: Record<string, unknown>[] | null = null
                      let toolGroupStart = 0

                      for (let index = 0; index < message.parts.length; index++) {
                        const part = message.parts[index]
                        const isTool = part.type === 'dynamic-tool' || part.type.startsWith('tool-')

                        if (isTool) {
                          if (!currentToolGroup) {
                            currentToolGroup = []
                            toolGroupStart = index
                          }
                          currentToolGroup.push(part as unknown as Record<string, unknown>)
                        } else {
                          // Flush any accumulated tool group
                          if (currentToolGroup) {
                            groups.push({ type: 'tools', parts: currentToolGroup, startIndex: toolGroupStart })
                            currentToolGroup = null
                          }
                          if (part.type === 'text') {
                            groups.push({ type: 'text', part, index })
                          } else if (part.type === 'step-start') {
                            groups.push({ type: 'other', index })
                          } else {
                            groups.push({ type: 'other', index })
                          }
                        }
                      }
                      // Flush trailing tool group
                      if (currentToolGroup) {
                        groups.push({ type: 'tools', parts: currentToolGroup, startIndex: toolGroupStart })
                      }

                      return groups.map((group) => {
                        if (group.type === 'text') {
                          const part = group.part as { type: string; text: string }
                          if (message.role === 'user') {
                            return <span key={group.index}>{part.text}</span>
                          }
                          const approvalParsed = parseApprovalBlock(part.text)
                          if (approvalParsed) {
                            const isLastAssistant = message.id === [...messages].reverse().find(m => m.role === 'assistant')?.id
                            return (
                              <React.Fragment key={group.index}>
                                {approvalParsed.before && <MarkdownContent content={approvalParsed.before} />}
                                <ApprovalCard
                                  approval={approvalParsed.approval}
                                  onApprove={() => handleApproval(message.id, 'approved')}
                                  onDeny={() => handleApproval(message.id, 'denied')}
                                  responded={approvalResponses[message.id] || (isLastAssistant ? null : 'approved')}
                                />
                                {approvalParsed.after && <MarkdownContent content={approvalParsed.after} />}
                              </React.Fragment>
                            )
                          }
                          return <MarkdownContent key={group.index} content={part.text} />
                        }
                        if (group.type === 'tools') {
                          // If only 1 tool call, render the classic single block
                          if (group.parts.length === 1) {
                            return <ToolCallBlock key={`tool-${group.startIndex}`} part={group.parts[0]} />
                          }
                          // Multiple tool calls → grouped compact view
                          return <ToolCallGroup key={`toolgroup-${group.startIndex}`} parts={group.parts} />
                        }
                        return null
                      })
                    })()}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-stone-600 dark:text-zinc-400" />
                    </div>
                  )}
                </div>
              </React.Fragment>
            ))}

            {/* Show loading only if the last message doesn't already have a running tool visible */}
            {isLoading && !lastMsgHasRunningTool && (
              <div className="flex gap-2 sm:gap-4 justify-start">
                <div className="shrink-0">
                  <BlitzAvatar size="sm" />
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm dark:shadow-none">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-stone-800 dark:text-white" />
                    <span className="text-sm text-stone-500 dark:text-zinc-400">
                      {activeToolInfo ? activeToolInfo.label + '...' : status === 'streaming' ? 'Working...' : 'Thinking...'}
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleStop} className="h-7 px-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500">
                      <StopCircle className="h-3 w-3 mr-1" />Stop
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isTimedOut && (
              <div className="flex gap-2 sm:gap-4 justify-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl px-3 py-2 sm:px-4 sm:py-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-sm text-amber-600 dark:text-amber-400">Request timed out.</span>
                    <Button variant="outline" size="sm" onClick={handleRetry} className="h-7 px-2 text-xs border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                      <RotateCcw className="h-3 w-3 mr-1" />Retry
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="px-3 sm:px-6 py-3 bg-red-50 dark:bg-red-900/10 border-t border-red-200 dark:border-red-800/30">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />{error.message || 'An error occurred. Please try again.'}
            </div>
            <Button variant="outline" size="sm" onClick={handleRetry} className="h-7 px-2 text-xs border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
              <RotateCcw className="h-3 w-3 mr-1" />Retry
            </Button>
          </div>
        </div>
      )}

      {/* Input — Style A bottom bar */}
      <div className="border-t border-stone-200 dark:border-zinc-800 p-3 sm:p-4 bg-[#faf8f5] dark:bg-[#111113] shrink-0">
        <div className="max-w-3xl mx-auto">
          {/* BLITZ context banner */}
          {blitzContext && (
            <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
              <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Sent to BLITZ</p>
                <p className="text-[11px] text-amber-600/80 dark:text-amber-500/70 truncate">{blitzContext.replace(/^\[(Contact|Sender): .*?\]\s*/, '').slice(0, 80)}...</p>
              </div>
              <button onClick={() => setBlitzContext(null)} className="p-0.5 rounded hover:bg-amber-200/50 dark:hover:bg-amber-800/30 text-amber-500 shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl p-1.5 sm:p-2 shadow-sm dark:shadow-none">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={blitzContext ? "What do you want BLITZ to do with this?" : "Ask your AI email agent anything..."}
              className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-stone-800 dark:text-zinc-200 placeholder:text-stone-400 dark:placeholder:text-zinc-600 text-base"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="rounded-lg bg-stone-800 dark:bg-zinc-200 text-white dark:text-zinc-900 hover:bg-stone-700 dark:hover:bg-zinc-300 h-8 w-8 sm:h-9 sm:w-9 shrink-0">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
