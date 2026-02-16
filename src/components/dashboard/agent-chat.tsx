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
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
} from 'lucide-react'

interface AgentChatProps {
  user: User
  isEmailConnected: boolean
  initialSessionId?: string
  onOpenCommandPalette?: () => void
  onSessionCreated?: (sessionId: string) => void
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
}

function getToolMeta(toolName: string) {
  return TOOL_META[toolName] || { label: toolName, icon: Wrench }
}

// ─── Styled markdown — Style A warm tones ───────────────────────────
const markdownComponents = {
  table: ({ children, ...props }: React.ComponentPropsWithoutRef<'table'>) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-stone-200 dark:border-zinc-800">
      <table className="w-full border-collapse text-sm" {...props}>{children}</table>
    </div>
  ),
  thead: ({ children, ...props }: React.ComponentPropsWithoutRef<'thead'>) => (
    <thead className="bg-stone-50 dark:bg-zinc-800/50" {...props}>{children}</thead>
  ),
  th: ({ children, ...props }: React.ComponentPropsWithoutRef<'th'>) => (
    <th className="border-b border-stone-200 dark:border-zinc-800 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-500" {...props}>{children}</th>
  ),
  td: ({ children, ...props }: React.ComponentPropsWithoutRef<'td'>) => (
    <td className="border-b border-stone-100 dark:border-zinc-800/50 px-3 py-2 text-sm" {...props}>{children}</td>
  ),
  tr: ({ children, ...props }: React.ComponentPropsWithoutRef<'tr'>) => (
    <tr className="even:bg-stone-50/50 dark:even:bg-zinc-800/20 hover:bg-stone-50 dark:hover:bg-zinc-800/40 transition-colors" {...props}>{children}</tr>
  ),
  p: ({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) => (
    <p className="my-1.5 leading-relaxed" {...props}>{children}</p>
  ),
  strong: ({ children, ...props }: React.ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-semibold text-stone-900 dark:text-white" {...props}>{children}</strong>
  ),
  a: ({ children, ...props }: React.ComponentPropsWithoutRef<'a'>) => (
    <a {...props} className="text-stone-900 dark:text-white underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300 transition-colors" target="_blank" rel="noopener noreferrer">{children}</a>
  ),
  ul: ({ children, ...props }: React.ComponentPropsWithoutRef<'ul'>) => (
    <ul className="my-1.5 ml-4 list-disc space-y-0.5" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: React.ComponentPropsWithoutRef<'ol'>) => (
    <ol className="my-1.5 ml-4 list-decimal space-y-0.5" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: React.ComponentPropsWithoutRef<'li'>) => (
    <li className="text-sm" {...props}>{children}</li>
  ),
  h1: ({ children, ...props }: React.ComponentPropsWithoutRef<'h1'>) => (
    <h1 className="text-lg font-semibold mt-3 mb-1.5" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: React.ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="text-base font-semibold mt-3 mb-1.5" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: React.ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="text-sm font-semibold mt-2 mb-1" {...props}>{children}</h3>
  ),
  code: ({ children, className, ...props }: React.ComponentPropsWithoutRef<'code'>) => {
    const isInline = !className
    return isInline
      ? <code className="bg-stone-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
      : <code className={className} {...props}>{children}</code>
  },
  pre: ({ children, ...props }: React.ComponentPropsWithoutRef<'pre'>) => (
    <pre className="my-2 bg-stone-100 dark:bg-zinc-800 rounded-lg p-3 overflow-x-auto text-xs" {...props}>{children}</pre>
  ),
  blockquote: ({ children, ...props }: React.ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote className="my-2 border-l-2 border-stone-300 dark:border-zinc-600 bg-stone-50 dark:bg-zinc-900/30 pl-3 py-1 text-sm" {...props}>{children}</blockquote>
  ),
  hr: (props: React.ComponentPropsWithoutRef<'hr'>) => (
    <hr className="my-3 border-stone-200 dark:border-zinc-800" {...props} />
  ),
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="max-w-none text-sm break-words overflow-hidden">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  )
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
    <div className={`my-2 rounded-lg border overflow-hidden transition-colors ${
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
              <div className="text-[10px] font-medium text-amber-700/60 dark:text-amber-500/50 uppercase tracking-wider mb-1">Input</div>
              <pre className="text-[11px] text-amber-800/70 dark:text-amber-300/60 bg-white/60 dark:bg-black/30 rounded p-2 overflow-x-auto max-h-32 overflow-y-auto">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}
          {isDone && output && (
            <div>
              <div className="text-[10px] font-medium text-amber-700/60 dark:text-amber-500/50 uppercase tracking-wider mb-1">Result</div>
              <pre className="text-[11px] text-amber-800/70 dark:text-amber-300/60 bg-white/60 dark:bg-black/30 rounded p-2 overflow-x-auto max-h-48 overflow-y-auto">
                {JSON.stringify(output, null, 2)}
              </pre>
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

function TipsSkeletonContent() {
  return (
    <div className="p-4 sm:p-5 space-y-5 sm:space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="rounded-xl bg-stone-100/80 dark:bg-zinc-800/30 border border-stone-200/50 dark:border-zinc-700/30 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-stone-200/80 dark:bg-zinc-700/50" />
              <div className="h-4 w-24 rounded bg-stone-200/80 dark:bg-zinc-700/50" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-stone-200/60 dark:bg-zinc-700/30" />
              <div className="h-3 w-5/6 rounded bg-stone-200/60 dark:bg-zinc-700/30" />
              <div className="h-3 w-4/6 rounded bg-stone-200/60 dark:bg-zinc-700/30" />
              <div className="h-3 w-3/4 rounded bg-stone-200/60 dark:bg-zinc-700/30" />
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-stone-200/50 dark:border-zinc-800/50" />
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-4 rounded bg-stone-200/80 dark:bg-zinc-700/50" />
          <div className="h-4 w-36 rounded bg-stone-200/80 dark:bg-zinc-700/50" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-stone-100/80 dark:bg-zinc-800/30 border border-stone-200/50 dark:border-zinc-700/30 px-3 py-2.5">
              <div className="h-4 w-3/4 rounded bg-stone-200/60 dark:bg-zinc-700/30 mb-1.5" />
              <div className="h-3 w-full rounded bg-stone-200/40 dark:bg-zinc-700/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TipsDropdown({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowContent(false)
      const timer = setTimeout(() => setShowContent(true), 300)
      return () => clearTimeout(timer)
    }
    setShowContent(false)
  }, [isOpen])

  if (!isOpen) return null

  const capabilities = [
    { icon: Mail, title: 'Send & Draft Emails', items: [
      'Send emails to anyone on your behalf',
      'Draft emails for you to review before sending',
      'Edit, update, or delete saved drafts',
      'Reply to emails with context-aware responses',
    ]},
    { icon: Search, title: 'Search & Read', items: [
      'Find any email by sender, subject, date, or keyword',
      'Read full email threads and conversations',
      'Pull up your recent inbox at a glance',
      'Search with filters like "has attachment" or "is unread"',
    ]},
    { icon: Tag, title: 'Labels & Folders', items: [
      'Create new labels to organize your inbox',
      'Sort emails into labels automatically',
      'Apply or remove labels in bulk',
      'Build custom folders like "Receipts" or "Clients"',
    ]},
    { icon: Archive, title: 'Inbox Cleanup', items: [
      'Archive old emails you don\'t need in your inbox',
      'Trash or restore emails',
      'Mark emails as read, unread, starred, or important',
      'Bulk clean — e.g. "archive all promos older than 30 days"',
    ]},
    { icon: Shield, title: 'Spam & Unsubscribe', items: [
      'Find all newsletters and subscriptions in your inbox',
      'One-click unsubscribe from junk mail in bulk',
      'Report spam or rescue emails from spam folder',
      'Clean up your inbox by removing unwanted senders',
    ]},
    { icon: BarChart3, title: 'Analytics & Insights', items: [
      'See your inbox stats — how many emails, top senders, etc.',
      'Look up contact details and sender history',
      'Get a breakdown of your email activity for any time period',
    ]},
  ]

  const examples = [
    { text: 'Clean up my inbox', desc: 'Archives old promos, unsubscribes from junk' },
    { text: 'Unsubscribe me from all newsletters', desc: 'Finds and bulk-unsubscribes in one shot' },
    { text: 'Show me everything from Amazon this month', desc: 'Searches by sender and date range' },
    { text: 'Draft a follow-up to that client email', desc: 'Reads the thread, then writes a smart reply' },
    { text: 'Create a "Receipts" folder and move all receipts there', desc: 'Creates label + searches + organizes' },
    { text: 'Give me a table of my top 10 senders this week', desc: 'Analyzes your inbox and formats results' },
  ]

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed inset-3 z-50 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[600px] max-h-[90vh] sm:max-h-[70vh] overflow-auto rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sm:bg-white/95 sm:dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sm:bg-white/95 sm:dark:bg-zinc-900/95 backdrop-blur-xl rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            </div>
            <h3 className="font-semibold text-base sm:text-lg">What I Can Do</h3>
            <span className="ml-1 sm:ml-2 inline-flex items-center rounded-full bg-stone-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-stone-500 dark:text-zinc-400">33 abilities</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></Button>
        </div>

        {!showContent ? (
          <TipsSkeletonContent />
        ) : (
          <div className="p-4 sm:p-5 space-y-5 sm:space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {capabilities.map((category, idx) => (
                <div key={idx} className="rounded-xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700 p-3 sm:p-4 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <div className="p-1.5 rounded-lg bg-stone-200 dark:bg-zinc-700"><category.icon className="h-4 w-4 text-stone-600 dark:text-zinc-300" /></div>
                    <h4 className="font-medium text-sm">{category.title}</h4>
                  </div>
                  <ul className="space-y-1 sm:space-y-1.5">
                    {category.items.map((item, i) => (
                      <li key={i} className="text-xs text-stone-500 dark:text-zinc-400 flex items-start gap-1.5">
                        <span className="text-stone-400 dark:text-zinc-500 mt-0.5">&#8226;</span><span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="border-t border-stone-200 dark:border-zinc-800" />
            <div>
              <div className="flex items-center gap-2 mb-3"><Lightbulb className="h-4 w-4 text-amber-400" /><h4 className="font-medium text-sm">Try saying things like:</h4></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {examples.map((example, i) => (
                  <div key={i} className="rounded-lg bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 px-3 py-2.5 hover:bg-stone-100 dark:hover:bg-zinc-700 transition-colors cursor-default">
                    <p className="text-sm font-medium text-stone-900 dark:text-white">&ldquo;{example.text}&rdquo;</p>
                    <p className="text-xs text-stone-400 dark:text-zinc-500 mt-0.5">{example.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

const REQUEST_TIMEOUT = 120000

// Wrapper that loads history / creates session before rendering the actual chat
export function AgentChat({ user, isEmailConnected, initialSessionId, onOpenCommandPalette, onSessionCreated }: AgentChatProps) {
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
      onOpenCommandPalette={onOpenCommandPalette}
      onSessionCreated={onSessionCreated}
    />
  )
}

interface AgentChatInnerProps {
  user: User
  isEmailConnected: boolean
  sessionId: string | null
  initialMessages: UIMessage[]
  onOpenCommandPalette?: () => void
  onSessionCreated?: (sessionId: string) => void
}

function AgentChatInner({ user, isEmailConnected, sessionId: initialSessionId, initialMessages, onOpenCommandPalette, onSessionCreated }: AgentChatInnerProps) {
  const [input, setInput] = useState('')
  const [showTips, setShowTips] = useState(false)
  const [isTimedOut, setIsTimedOut] = useState(false)
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId)
  const sessionCreatingRef = useRef(false)

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
  const saveMessage = useCallback(async (role: 'user' | 'assistant', content: string) => {
    if (!content.trim()) return
    const sid = await ensureSession()
    if (!sid) return
    try {
      await fetch(`/api/chats/${sid}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content }),
      })
    } catch (err) {
      console.error('Failed to save message:', err)
    }
  }, [ensureSession])

  // Save assistant message when streaming completes
  useEffect(() => {
    if (prevStatusRef.current === 'streaming' && status === 'ready') {
      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
      if (lastAssistant) {
        const textContent = lastAssistant.parts
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map(p => p.text)
          .join('\n')
        if (textContent) {
          saveMessage('assistant', textContent)
        }
      }
    }
    prevStatusRef.current = status
  }, [status, messages, saveMessage])

  // Auto-scroll only when user is near the bottom (within 150px)
  useEffect(() => {
    const el = scrollAreaRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceFromBottom < 150) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, status])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    setIsTimedOut(false)
    const text = input
    sendMessage({ text })
    setInput('')
    saveMessage('user', text)
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return
    setIsTimedOut(false)
    sendMessage({ text: suggestion })
    saveMessage('user', suggestion)
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
          <Badge variant="secondary" className="bg-stone-100/80 dark:bg-zinc-800/80 text-stone-700 dark:text-zinc-300 border border-stone-200/60 dark:border-zinc-700/60 px-3 py-1 text-xs font-medium tracking-wide rounded-full">
            <Sparkles className="h-3 w-3 mr-1.5 text-stone-400 dark:text-zinc-500" />
            Email AI Intelligence
          </Badge>
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
              <span className="text-xs font-medium hidden sm:inline">Tips & Commands</span>
              <span className="text-xs font-medium sm:hidden">Tips</span>
              <ChevronDown className={`h-3 w-3 text-stone-400 dark:text-zinc-500 transition-transform duration-200 ${showTips ? 'rotate-180' : ''}`} />
            </button>
            <TipsDropdown isOpen={showTips} onClose={() => setShowTips(false)} />
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
          <div className="h-full flex flex-col items-center justify-center">
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
            <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-stone-900 dark:text-white">Hello, {userName}</h2>
            <p className="text-stone-500 dark:text-zinc-400 mb-2 text-center max-w-md text-sm sm:text-base px-4">
              {"I'm BLITZ, your AI email agent. I can search, send, organize, analyze, and unsubscribe — just tell me what you need."}
            </p>
            <button onClick={() => setShowTips(true)} className="text-sm text-stone-900 dark:text-white hover:underline mb-6 sm:mb-8 flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5" />See everything I can do
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 max-w-2xl w-full px-2">
              {suggestions.map((suggestion, i) => (
                <Card key={i} className="p-3 sm:p-4 cursor-pointer hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm dark:shadow-none" onClick={() => handleSuggestionClick(suggestion)}>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Sparkles className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-stone-700 dark:text-zinc-300 break-words">{suggestion}</span>
                  </div>
                </Card>
              ))}
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
                    {message.parts.map((part, index) => {
                      if (part.type === 'text') {
                        if (message.role === 'user') {
                          return <span key={index}>{part.text}</span>
                        }
                        // Check for approval block
                        const approvalParsed = parseApprovalBlock(part.text)
                        if (approvalParsed) {
                          const isLastAssistant = message.id === [...messages].reverse().find(m => m.role === 'assistant')?.id
                          return (
                            <React.Fragment key={index}>
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
                        return <MarkdownContent key={index} content={part.text} />
                      }
                      if (part.type === 'dynamic-tool' || part.type.startsWith('tool-')) {
                        return <ToolCallBlock key={index} part={part as unknown as Record<string, unknown>} />
                      }
                      if (part.type === 'step-start') return null
                      return null
                    })}
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
      <div className="border-t border-stone-200 dark:border-zinc-800 p-3 sm:p-4 bg-[#faf8f5] dark:bg-[#111113]">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl p-1.5 sm:p-2 shadow-sm dark:shadow-none">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your AI email agent anything..."
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
