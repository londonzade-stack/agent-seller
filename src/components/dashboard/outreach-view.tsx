'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShimmerText } from '@/components/shimmer-text'
import { MarkdownContent } from './markdown-content'
import {
  Globe,
  Search,
  ArrowRight,
  Sparkles,
  Building2,
  Users,
  Mail,
  Zap,
  BarChart3,
  Lock,
  Send,
  Loader2,
  StopCircle,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Wrench,
  Eye,
  Lightbulb,
  ChevronDown,
  X,
  Circle,
  Trash2,
  Archive,
  Shield,
  Tag,
  Star,
  Clock,
} from 'lucide-react'
import { ProMockConversationDropdown } from '@/components/pro-mock-conversation'
import { CompanyProfileCard } from './company-profile-card'

// ─── Tool display (reuse from agent-chat) ─────────────────────────
const TOOL_META: Record<string, { label: string; icon: typeof Search }> = {
  searchEmails: { label: 'Searching emails', icon: Search },
  readEmail: { label: 'Reading email', icon: Eye },
  getEmailThread: { label: 'Loading thread', icon: Eye },
  getRecentEmails: { label: 'Getting recent emails', icon: Mail },
  sendEmail: { label: 'Sending email', icon: Send },
  draftEmail: { label: 'Creating draft', icon: Mail },
  getDrafts: { label: 'Loading drafts', icon: Mail },
  webSearch: { label: 'Searching the web', icon: Search },
  findCompanies: { label: 'Finding companies', icon: Users },
  researchCompany: { label: 'Researching company', icon: Search },
  getInboxStats: { label: 'Analyzing inbox', icon: BarChart3 },
  createRecurringTask: { label: 'Creating automation', icon: Zap },
}

function getToolMeta(toolName: string) {
  return TOOL_META[toolName] || { label: toolName, icon: Wrench }
}

function summarizeInput(toolName: string, input: Record<string, unknown>): string[] {
  const lines: string[] = []
  if (input.query) lines.push(`Query: ${String(input.query)}`)
  if (input.to) lines.push(`To: ${String(input.to)}`)
  if (input.subject) lines.push(`Subject: ${String(input.subject)}`)
  if (input.industry) lines.push(`Industry: ${String(input.industry)}`)
  if (input.location) lines.push(`Location: ${String(input.location)}`)
  if (input.company) lines.push(`Company: ${String(input.company)}`)
  if (input.domain) lines.push(`Domain: ${String(input.domain)}`)
  if (input.numResults) lines.push(`Results: ${String(input.numResults)}`)
  if (lines.length === 0) {
    // fallback: show all keys
    for (const [k, v] of Object.entries(input)) {
      if (v !== undefined && v !== null && String(v).length < 100) {
        lines.push(`${k}: ${String(v)}`)
      }
    }
  }
  return lines.length > 0 ? lines : ['Running...']
}

function summarizeOutput(toolName: string, output: unknown): string[] {
  if (!output || typeof output !== 'object') return ['Done']
  const o = output as Record<string, unknown>
  const lines: string[] = []
  if (o.results && Array.isArray(o.results)) lines.push(`${o.results.length} results returned`)
  if (o.messageId) lines.push('Email sent successfully')
  if (o.draftId) lines.push('Draft created')
  if (o.count !== undefined) lines.push(`${o.count} items`)
  if (o.total !== undefined) lines.push(`Total: ${o.total}`)
  if (lines.length === 0 && o.error) lines.push(`Error: ${String(o.error)}`)
  return lines.length > 0 ? lines : ['Completed']
}

function ToolCallBlock({ part }: { part: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false)
  const [detailExpanded, setDetailExpanded] = useState(false)
  const partType = part.type as string
  const toolName = partType === 'dynamic-tool'
    ? (part.toolName as string) || 'unknown'
    : partType.startsWith('tool-') ? partType.slice(5) : (part.toolName as string) || 'unknown'
  const state = part.state as string
  const meta = getToolMeta(toolName)
  const input = part.input as Record<string, unknown> | undefined
  const output = part.output as unknown

  const isRunning = state === 'input-streaming' || state === 'input-available' || state === 'call' || state === 'partial-call'
  const isDone = state === 'output-available' || state === 'result'
  const isError = state === 'output-error'
  const errorText = isError ? ((part.output as Record<string, unknown>)?.error as string) || 'Tool call failed' : null

  const inputSummary = input?.query ? `"${String(input.query).slice(0, 40)}"` : null

  return (
    <div className="my-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-sm text-foreground hover:text-foreground/80 transition-colors cursor-pointer"
      >
        <span>Agent Pro used 1 tool</span>
        <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-1.5 space-y-1">
          <button
            onClick={() => setDetailExpanded(!detailExpanded)}
            className="inline-flex w-full sm:inline-flex sm:w-auto sm:max-w-full min-w-0 items-center gap-2 overflow-hidden rounded-full border border-border bg-background pl-1 pr-3 py-1 text-left shadow-sm transition-colors hover:bg-accent"
          >
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
            <span className="text-xs italic min-w-0 flex-1 truncate text-muted-foreground">
              {meta.label}{inputSummary ? ` — ${inputSummary}` : ''}
            </span>
            <ChevronRight className={`h-3 w-3 text-muted-foreground shrink-0 transition-transform ${detailExpanded ? 'rotate-90' : ''}`} />
            {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-foreground shrink-0" />}
            {isRunning && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />}
            {isError && <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
          </button>

          {detailExpanded && (
            <div className="ml-2 mt-1 pl-3 border-l-2 border-border space-y-2">
              {input && Object.keys(input).length > 0 && (
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Input</div>
                  <div className="text-[11px] text-muted-foreground bg-muted/50 rounded p-2 space-y-0.5 break-words overflow-hidden">
                    {summarizeInput(toolName, input).map((line, i) => (
                      <div key={i} className="break-words">{line}</div>
                    ))}
                  </div>
                </div>
              )}
              {isDone && output != null && (
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Result</div>
                  <div className="text-[11px] text-muted-foreground bg-muted/50 rounded p-2 space-y-0.5 break-words overflow-hidden">
                    {summarizeOutput(toolName, output).map((line, i) => (
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
      )}
    </div>
  )
}

// ─── Grouped Tool Calls — clean Neurelect-style ──
function ToolCallGroup({ parts }: { parts: Record<string, unknown>[] }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const tools = parts.map((part) => {
    const partType = part.type as string
    const toolName = partType === 'dynamic-tool'
      ? (part.toolName as string) || 'unknown'
      : partType.startsWith('tool-') ? partType.slice(5) : (part.toolName as string) || 'unknown'
    const state = part.state as string
    const meta = getToolMeta(toolName)
    const input = part.input as Record<string, unknown> | undefined
    const output = part.output as unknown
    const isRunning = state === 'input-streaming' || state === 'input-available' || state === 'call' || state === 'partial-call'
    const isDone = state === 'output-available' || state === 'result'
    const isError = state === 'output-error'
    const errorText = isError ? ((part.output as Record<string, unknown>)?.error as string) || 'Tool call failed' : null
    const inputSummary = input?.query ? `"${String(input.query).slice(0, 40)}"` : null
    return { toolName, state, meta, input, output, isRunning, isDone, isError, errorText, inputSummary }
  })

  const completedCount = tools.filter(t => t.isDone).length
  const errorCount = tools.filter(t => t.isError).length
  const runningTool = tools.find(t => t.isRunning)
  const allDone = tools.every(t => t.isDone || t.isError)
  const totalDone = completedCount + errorCount

  return (
    <div className="my-2">
      <button
        onClick={() => allDone ? setIsExpanded(!isExpanded) : undefined}
        className={`flex items-center gap-1.5 text-sm text-foreground transition-colors ${allDone ? 'cursor-pointer hover:text-foreground/80' : 'cursor-default'}`}
      >
        <span>
          {allDone
            ? `Agent Pro used ${totalDone} tool${totalDone !== 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} failed)` : ''}`
            : runningTool
              ? runningTool.meta.label + (runningTool.inputSummary ? ` — ${runningTool.inputSummary}` : '')
              : 'Running tools…'
          }
        </span>
        {runningTool && (
          <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
            {completedCount + 1}/{tools.length}
          </span>
        )}
        {allDone && (
          <ChevronRight className={`h-4 w-4 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
        )}
      </button>

      {isExpanded && allDone && (
        <div className="mt-1.5 space-y-1">
          {tools.map((tool, i) => {
            const isDetailExpanded = expandedIndex === i
            return (
              <div key={i}>
                <button
                  onClick={() => setExpandedIndex(isDetailExpanded ? null : i)}
                  className="inline-flex w-full sm:inline-flex sm:w-auto sm:max-w-full min-w-0 items-center gap-2 overflow-hidden rounded-full border border-border bg-background pl-1 pr-3 py-1 text-left shadow-sm transition-colors hover:bg-accent"
                >
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
                  <span className="text-xs italic min-w-0 flex-1 truncate text-muted-foreground">
                    {tool.meta.label}{tool.inputSummary ? ` — ${tool.inputSummary}` : ''}
                  </span>
                  <ChevronRight className={`h-3 w-3 text-muted-foreground shrink-0 transition-transform ${isDetailExpanded ? 'rotate-90' : ''}`} />
                  {tool.isDone && <CheckCircle2 className="h-3.5 w-3.5 text-foreground shrink-0" />}
                  {tool.isError && <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                </button>
                {isDetailExpanded && (
                  <div className="ml-2 mt-1 pl-3 border-l-2 border-border space-y-1.5 mb-1">
                    {tool.input && Object.keys(tool.input).length > 0 && (
                      <div>
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Input</div>
                        <div className="text-[11px] text-muted-foreground bg-muted/50 rounded p-2 space-y-0.5 break-words">
                          {summarizeInput(tool.toolName, tool.input).map((line, j) => (
                            <div key={j} className="break-words">{line}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {tool.isDone && tool.output != null && (
                      <div>
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Result</div>
                        <div className="text-[11px] text-muted-foreground bg-muted/50 rounded p-2 space-y-0.5 break-words">
                          {summarizeOutput(tool.toolName, tool.output).map((line, j) => (
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

// ─── Approval Card — renders [APPROVAL_REQUIRED] blocks ──────────
interface ApprovalData {
  action: string
  description: string
  details: string | null
}

const DESTRUCTIVE_PATTERNS = [
  /should I (?:move|trash|delete|remove|archive|send|forward|reply|unsubscribe)/i,
  /want me to (?:move|trash|delete|remove|archive|send|forward|reply|unsubscribe)/i,
  /shall I (?:move|trash|delete|remove|archive|send|forward|reply|unsubscribe)/i,
  /would you like (?:me to |to )(?:move|trash|delete|remove|archive|send|forward|reply|unsubscribe)/i,
  /ready to (?:send|trash|delete|archive|move|unsubscribe)\b/i,
  /confirm.*(?:trash|delete|archive|send|move|unsubscribe)/i,
  /proceed with (?:trashing|deleting|archiving|sending|moving|unsubscribing)/i,
  /would you like me to unsubscribe/i,
  /unsubscribe from (?:any|all|these|them|the following)/i,
]

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

function extractDetails(text: string): string | null {
  const parts: string[] = []
  const countMatch = text.match(/(\d+)\s*emails?/i)
  if (countMatch) parts.push(`${countMatch[1]} emails`)
  const fromMatch = text.match(/from\s+([A-Za-z0-9._@\s]+?)(?:\.|,|\?|$)/i)
  if (fromMatch) parts.push(`from ${fromMatch[1].trim()}`)
  return parts.length > 0 ? parts.join(', ') : null
}

function parseApprovalBlock(text: string): { before: string; approval: ApprovalData; after: string } | null {
  const startTag = '[APPROVAL_REQUIRED]'
  const endTag = '[/APPROVAL_REQUIRED]'
  const startIdx = text.indexOf(startTag)
  const endIdx = text.indexOf(endTag)
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = text.slice(0, startIdx).trim()
    const after = text.slice(endIdx + endTag.length).trim()
    const block = text.slice(startIdx + startTag.length, endIdx).trim()
    let action = '', description = '', details: string | null = null
    for (const line of block.split('\n')) {
      const trimmed = line.trim()
      if (trimmed.startsWith('action:')) action = trimmed.slice(7).trim()
      else if (trimmed.startsWith('description:')) description = trimmed.slice(12).trim()
      else if (trimmed.startsWith('details:')) details = trimmed.slice(8).trim()
    }
    if (action || description) return { before, approval: { action, description, details }, after }
  }
  for (const pattern of DESTRUCTIVE_PATTERNS) {
    if (pattern.test(text)) {
      const sentences = text.split(/(?<=[.!])\s+/)
      const questionSentences: string[] = [], contextSentences: string[] = []
      for (const s of sentences) {
        if (DESTRUCTIVE_PATTERNS.some(p => p.test(s)) || s.includes('?')) questionSentences.push(s)
        else contextSentences.push(s)
      }
      const description = questionSentences.join(' ').replace(/\?$/, '').trim() || text.split('?')[0].trim()
      return { before: contextSentences.join(' ').trim(), approval: { action: detectActionType(text), description, details: extractDetails(text) }, after: '' }
    }
  }
  return null
}

function ApprovalCard({ approval, onApprove, onDeny, onDismiss, responded }: {
  approval: ApprovalData; onApprove: () => void; onDeny: () => void; onDismiss?: () => void; responded: 'approved' | 'denied' | 'skipped' | null
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
                <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md bg-stone-100 dark:bg-zinc-800 text-xs text-stone-600 dark:text-zinc-400 border border-stone-200/60 dark:border-zinc-700/60">{item}</span>
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
              : responded === 'denied'
              ? 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800/40'
              : 'bg-stone-50 dark:bg-zinc-800/50 text-stone-400 dark:text-zinc-500 border border-stone-200 dark:border-zinc-700/40'
          }`}>
            {responded === 'approved' ? <><CheckCircle2 className="h-4 w-4" /> Approved</> : responded === 'denied' ? <><XCircle className="h-4 w-4" /> Denied</> : <><Clock className="h-4 w-4" /> Skipped</>}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <button onClick={onDeny} className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800/40 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer">
              <X className="h-4 w-4" /> Deny
            </button>
            <button onClick={onDismiss} className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-stone-50 dark:bg-zinc-800/50 text-stone-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-700/40 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
              <Clock className="h-4 w-4" /> Not Now
            </button>
            <button onClick={onApprove} className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer">
              <CheckCircle2 className="h-4 w-4" /> Approve
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────

interface SavedMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface OutreachViewProps {
  user: User
  isEmailConnected: boolean
  userPlan?: string
  initialSessionId?: string
  initialPrompt?: string
  onNavigateToBilling?: () => void
  onOpenCommandPalette?: () => void
  onSessionCreated?: (sessionId: string) => void
}

const REQUEST_TIMEOUT = 120000

export function OutreachView({ user, isEmailConnected, userPlan, initialSessionId, initialPrompt, onNavigateToBilling, onSessionCreated }: OutreachViewProps) {
  const isPro = userPlan === 'pro'
  const [ready, setReady] = useState(!initialSessionId)
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([])

  // Load chat history when opening an existing session — MUST complete before rendering useChat
  useEffect(() => {
    if (initialSessionId) {
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
          console.error('Failed to load outreach chat history:', err)
        } finally {
          setReady(true)
        }
      }
      loadHistory()
    }
  }, [initialSessionId])

  // Show loading skeleton while fetching history
  if (!ready) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#faf8f5] dark:bg-[#111113]">
        <header className="relative z-10 border-b border-white/30 dark:border-white/[0.06] px-3 py-3 sm:px-6 sm:py-4 bg-[#faf8f5] dark:bg-[#111113] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <div className="h-6 w-40 rounded-full bg-stone-200/80 dark:bg-zinc-700/50 animate-pulse" />
        </header>
        <div className="flex-1 p-6 space-y-4 animate-pulse">
          <div className="h-16 w-3/4 ml-auto rounded-xl bg-stone-200/50 dark:bg-zinc-800/50" />
          <div className="h-32 w-3/4 rounded-xl bg-stone-200/50 dark:bg-zinc-800/50" />
        </div>
      </div>
    )
  }

  // Render the actual chat once history is loaded (or immediately for new chats)
  return (
    <OutreachViewInner
      user={user}
      isEmailConnected={isEmailConnected}
      userPlan={userPlan}
      initialSessionId={initialSessionId}
      initialPrompt={initialPrompt}
      initialMessages={initialMessages}
      onNavigateToBilling={onNavigateToBilling}
      onSessionCreated={onSessionCreated}
    />
  )
}

function OutreachViewInner({ user, isEmailConnected, userPlan, initialSessionId, initialPrompt, initialMessages, onNavigateToBilling, onSessionCreated }: OutreachViewProps & { initialMessages: UIMessage[] }) {
  const isPro = userPlan === 'pro'
  // Check if this is a "Send to Agent Pro" context (from contacts/analytics)
  const isProContext = initialPrompt?.startsWith('[Contact:') || initialPrompt?.startsWith('[Sender:')
  const [proContext, setProContext] = useState<string | null>(isProContext ? initialPrompt! : null)
  const [input, setInput] = useState('')
  const [showExamples, setShowExamples] = useState(false)
  const [isTimedOut, setIsTimedOut] = useState(false)
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null)
  const sessionCreatingRef = useRef(false)

  const { messages, sendMessage, status, error, stop } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/agent',
      body: { userId: user.id, userEmail: user.email, isEmailConnected },
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  // Active tool info for loading indicator
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

  // Timeout handling
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
      // Don't reset isTimedOut here — let the timeout message stay visible
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [isLoading, loadingStartTime, stop])

  // Session management
  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (sessionId) return sessionId
    if (sessionCreatingRef.current) return null
    sessionCreatingRef.current = true
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatType: 'outreach' }),
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

  // Save assistant messages when streaming completes (including tool call metadata)
  const prevStatusRef = useRef(status)
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
                input: summarizeInput(toolName, input)[0] || TOOL_META[toolName]?.label || toolName,
                output: summarizeOutput(toolName, output)[0] || 'Done',
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

  // Auto-scroll
  const userScrolledAwayRef = useRef(false)
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

  useEffect(() => {
    const el = scrollAreaRef.current
    if (!el) return
    if (!userScrolledAwayRef.current) {
      requestAnimationFrame(() => { el.scrollTop = el.scrollHeight })
    }
  }, [messages, status])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    setIsTimedOut(false)
    // If there's Pro context, prepend it to the user's message
    let text = input
    if (proContext) {
      text = `${proContext}\n\nUser request: ${input}`
      setProContext(null) // Clear context after sending
    }
    sendMessage({ text })
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    saveMessage('user', text)
    userScrolledAwayRef.current = false
    requestAnimationFrame(() => {
      const el = scrollAreaRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }

  const handleSuggestionClick = (prompt: string) => {
    if (isLoading) return
    setIsTimedOut(false)
    sendMessage({ text: prompt })
    saveMessage('user', prompt)
    userScrolledAwayRef.current = false
    requestAnimationFrame(() => {
      const el = scrollAreaRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
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

  // Track approval responses per message ID
  const [approvalResponses, setApprovalResponses] = useState<Record<string, 'approved' | 'denied' | 'skipped'>>({})
  const handleApproval = (messageId: string, response: 'approved' | 'denied', approval?: ApprovalData) => {
    if (isLoading) return
    setApprovalResponses(prev => ({ ...prev, [messageId]: response }))
    let text: string
    if (response === 'approved' && approval) {
      text = `Approved: "${approval.action}"`
    } else if (response === 'approved') {
      text = 'Approved.'
    } else {
      text = 'Denied.'
    }
    sendMessage({ text })
    saveMessage('user', text)
  }
  const handleDismiss = (messageId: string) => {
    if (isLoading) return
    setApprovalResponses(prev => ({ ...prev, [messageId]: 'skipped' }))
    // No message sent to AI — just dismiss the card silently
  }

  const lastMessage = messages[messages.length - 1]
  const lastMsgHasRunningTool = lastMessage?.role === 'assistant' && lastMessage.parts.some(p => {
    if (p.type === 'dynamic-tool' || p.type.startsWith('tool-')) {
      const state = (p as unknown as Record<string, unknown>).state as string
      return state === 'input-streaming' || state === 'input-available' || state === 'call' || state === 'partial-call'
    }
    return false
  })

  // Pro-gated upgrade CTA
  if (!isPro) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <header className="relative z-10 border-b border-white/30 dark:border-white/[0.06] px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-[#faf8f5] dark:bg-[#111113] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <Badge variant="secondary" className="bg-stone-100/80 dark:bg-zinc-800/80 text-stone-700 dark:text-zinc-300 border border-stone-200/60 dark:border-zinc-700/60 px-3 py-1 text-xs font-medium tracking-wide rounded-full">
            <Globe className="h-3 w-3 mr-1.5 text-stone-400 dark:text-zinc-500" />
            Outreach
            <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400">PRO</span>
          </Badge>
        </header>

        <div className="flex-1 overflow-auto p-3 sm:p-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center mx-auto mb-6">
                <Lock className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Unlock Sales Outreach</h2>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-8">
                Upgrade to Pro to access web search, company research, and AI-powered sales outreach tools.
              </p>
              <Button
                onClick={onNavigateToBilling}
                className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 px-8"
                size="lg"
              >
                Upgrade to Pro — $40/mo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              {[
                { icon: Search, title: 'Web Search', desc: 'Search the web for companies, news, and market intel directly from your dashboard.' },
                { icon: Building2, title: 'Company Research', desc: 'Deep dive into any company — website, recent news, leadership, and competitive info.' },
                { icon: Mail, title: 'AI Outreach Drafts', desc: 'Draft personalized cold emails backed by real research. No more generic templates.' },
                { icon: Users, title: 'Contact Discovery', desc: 'Find decision makers and key contacts at target companies.' },
                { icon: Zap, title: 'Smart Automations', desc: 'Set up recurring tasks that run on a schedule to keep your inbox organized automatically.' },
                { icon: BarChart3, title: 'Campaign Tracking', desc: 'Track outreach campaigns from research to draft to sent.' },
              ].map((feat, i) => (
                <Card key={i} className="p-4 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center shrink-0">
                      <feat.icon className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{feat.title}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{feat.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Pro user — outreach chat ───────────────────────────────────
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <header className="relative z-10 border-b border-white/30 dark:border-white/[0.06] px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-[#faf8f5] dark:bg-[#111113] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <Badge variant="secondary" className="bg-stone-100/80 dark:bg-zinc-800/80 text-stone-700 dark:text-zinc-300 border border-stone-200/60 dark:border-zinc-700/60 px-3 py-1 text-xs font-medium tracking-wide rounded-full">
          <Globe className="h-3 w-3 mr-1.5 text-stone-400 dark:text-zinc-500" />
          Sales Outreach
          <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400">PRO</span>
        </Badge>
        <div className="relative">
          <button
            className="inline-flex items-center cursor-pointer px-2.5 py-1.5 sm:px-3 sm:py-1.5 gap-1.5 sm:gap-2 rounded-lg text-stone-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 active:bg-stone-150 dark:active:bg-zinc-700 transition-all duration-150 border border-stone-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/60 shadow-sm hover:shadow"
            onClick={() => setShowExamples(!showExamples)}
          >
            <Lightbulb className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-medium">Examples</span>
            <ChevronDown className={`h-3 w-3 text-stone-400 dark:text-zinc-500 transition-transform duration-200 ${showExamples ? 'rotate-180' : ''}`} />
          </button>
          <ProMockConversationDropdown
            isOpen={showExamples}
            onClose={() => setShowExamples(false)}
            onPromptSelect={(prompt) => {
              setInput(prompt)
              setShowExamples(false)
              inputRef.current?.focus()
            }}
          />
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-auto px-3 py-4 sm:p-6 bg-[#faf8f5] dark:bg-[#111113]" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          /* Welcome screen with outreach suggestions */
          <div className="h-full overflow-auto">
          <div className="min-h-full flex flex-col items-center justify-center py-6">
            <div className="mb-4 sm:mb-5" />
            <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-stone-900 dark:text-white">Sales Outreach</h2>
            <p className="text-stone-500 dark:text-zinc-400 mb-2 text-center max-w-md text-sm sm:text-base px-4">
              Search the web, research companies, and draft personalized outreach — all powered by Agent.
            </p>
            <button onClick={() => setShowExamples(true)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-6 sm:mb-8 flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5" />See outreach examples
            </button>

            <div className="max-w-2xl w-full px-2 mb-4">
              <CompanyProfileCard variant="inline" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 max-w-2xl w-full px-2">
              {[
                {
                  title: 'Find companies to sell to',
                  desc: 'Search for prospects that fit my target market',
                  prompt: 'Find companies that would be a great fit for our product. Research the top results and give me a breakdown of each company, what they do, and who the decision makers are.',
                  icon: Building2,
                },
                {
                  title: 'Research & draft cold emails',
                  desc: 'Deep-dive prospects and draft personalized outreach',
                  prompt: 'Research 5 companies in my target market, find what makes each one unique, and draft personalized cold outreach emails for each. Let me review before sending.',
                  icon: Mail,
                },
                {
                  title: 'Follow up on outreach',
                  desc: 'Check replies and draft follow-ups automatically',
                  prompt: 'Check if any of my recent outreach emails got replies. For the ones that didn\'t respond, draft personalized follow-ups with a new angle. Show me everything in a table.',
                  icon: Users,
                },
                {
                  title: 'Competitive research',
                  desc: 'Research my competitors before the next pitch',
                  prompt: 'Research our top competitors — what are they doing lately, what are their strengths and weaknesses, and how should we position against them?',
                  icon: BarChart3,
                },
              ].map((suggestion, i) => (
                <Card key={i} className="p-3 sm:p-4 cursor-pointer hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm dark:shadow-none" onClick={() => handleSuggestionClick(suggestion.prompt)}>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center shrink-0 mt-0.5">
                      <suggestion.icon className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-stone-700 dark:text-zinc-300">{suggestion.title}</span>
                      <p className="text-xs text-stone-400 dark:text-zinc-500 mt-0.5">{suggestion.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="mt-4 p-4 border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/30 max-w-2xl w-full mx-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Pro Tip</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Click any card above or type your own prompt below. Agent will research, draft, and present everything for your review before any emails go out.
                  </p>
                </div>
              </div>
            </Card>
          </div>
          </div>
        ) : (
          /* Chat messages */
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${
                  message.role === 'user'
                    ? 'max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 bg-foreground text-background shadow-sm'
                    : 'max-w-[90%] sm:max-w-[85%] text-[15px] leading-[1.75] text-foreground/90'
                }`}>
                  {(() => {
                    // Group consecutive tool parts together
                    const groups: { type: 'text' | 'tools' | 'other'; part?: unknown; parts?: Record<string, unknown>[]; index: number; startIndex?: number }[] = []
                    let currentToolGroup: Record<string, unknown>[] = []
                    let toolGroupStart = 0

                    message.parts.forEach((part, index) => {
                      const isTool = part.type === 'dynamic-tool' || part.type.startsWith('tool-')
                      if (isTool) {
                        if (currentToolGroup.length === 0) toolGroupStart = index
                        currentToolGroup.push(part as unknown as Record<string, unknown>)
                      } else {
                        if (currentToolGroup.length > 0) {
                          groups.push({ type: 'tools', parts: currentToolGroup, index: toolGroupStart, startIndex: toolGroupStart })
                          currentToolGroup = []
                        }
                        if (part.type === 'text') {
                          groups.push({ type: 'text', part, index })
                        } else if (part.type !== 'step-start') {
                          groups.push({ type: 'other', part, index })
                        }
                      }
                    })
                    if (currentToolGroup.length > 0) {
                      groups.push({ type: 'tools', parts: currentToolGroup, index: toolGroupStart, startIndex: toolGroupStart })
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
                                onApprove={() => handleApproval(message.id, 'approved', approvalParsed.approval)}
                                onDeny={() => handleApproval(message.id, 'denied', approvalParsed.approval)}
                                onDismiss={() => handleDismiss(message.id)}
                                responded={approvalResponses[message.id] || (isLastAssistant ? null : 'skipped')}
                              />
                              {approvalParsed.after && <MarkdownContent content={approvalParsed.after} />}
                            </React.Fragment>
                          )
                        }
                        return <MarkdownContent key={group.index} content={part.text} />
                      }
                      if (group.type === 'tools') {
                        if (group.parts!.length === 1) {
                          return <ToolCallBlock key={`tool-${group.startIndex}`} part={group.parts![0]} />
                        }
                        return <ToolCallGroup key={`toolgroup-${group.startIndex}`} parts={group.parts!} />
                      }
                      return null
                    })
                  })()}
                </div>
                {/* No user icon — clean bubble only */}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && !lastMsgHasRunningTool && (
              <div className="flex gap-2 sm:gap-4 justify-start items-center">
                <ShimmerText
                  text={activeToolInfo ? activeToolInfo.label + '...' : 'Agent is working...'}
                  className="text-sm font-medium"
                />
                <Button variant="ghost" size="sm" onClick={handleStop} className="h-7 px-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500">
                  <StopCircle className="h-3 w-3 mr-1" />Stop
                </Button>
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

      {/* Input bar */}
      <div className="border-t border-stone-200 dark:border-zinc-800 p-3 sm:p-4 bg-[#faf8f5] dark:bg-[#111113] shrink-0">
        <div className="max-w-3xl mx-auto">
          {/* Pro context banner */}
          {proContext && (
            <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40">
              <Zap className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Sent to Agent Pro</p>
                <p className="text-[11px] text-blue-600/80 dark:text-blue-500/70 truncate">{proContext.replace(/^\[(Contact|Sender): .*?\]\s*/, '').slice(0, 80)}...</p>
              </div>
              <button onClick={() => setProContext(null)} className="p-0.5 rounded hover:bg-blue-200/50 dark:hover:bg-blue-800/30 text-blue-500 shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 sm:gap-3 bg-white dark:bg-zinc-900 border border-black/20 dark:border-white/15 rounded-md p-1.5 sm:p-2 shadow-sm">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                // Auto-resize
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder={proContext ? "What do you want Agent Pro to do with this?" : "What can I help research?"}
              className="flex-1 bg-transparent border-0 focus-visible:outline-none resize-none text-foreground placeholder:text-muted-foreground text-[13px] min-h-[36px] max-h-[150px] py-1.5 px-2"
              rows={1}
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="rounded-md bg-foreground text-background hover:bg-foreground/90 h-8 w-8 shrink-0 mb-0.5">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground/70 text-center mt-1.5">Agent can make mistakes. Please double check responses.</p>
        </form>
      </div>
    </div>
  )
}
