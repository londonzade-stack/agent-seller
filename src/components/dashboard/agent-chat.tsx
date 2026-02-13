'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Send,
  Brain,
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

// Styled markdown components for ChatGPT-style tables and clean rendering
const markdownComponents = {
  table: ({ children, ...props }: React.ComponentPropsWithoutRef<'table'>) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-white/10">
      <table className="w-full border-collapse text-sm" {...props}>{children}</table>
    </div>
  ),
  thead: ({ children, ...props }: React.ComponentPropsWithoutRef<'thead'>) => (
    <thead className="bg-zinc-50 dark:bg-zinc-900/50" {...props}>{children}</thead>
  ),
  th: ({ children, ...props }: React.ComponentPropsWithoutRef<'th'>) => (
    <th className="border-b border-zinc-200 dark:border-white/10 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400" {...props}>{children}</th>
  ),
  td: ({ children, ...props }: React.ComponentPropsWithoutRef<'td'>) => (
    <td className="border-b border-zinc-100 dark:border-white/5 px-3 py-2 text-sm" {...props}>{children}</td>
  ),
  tr: ({ children, ...props }: React.ComponentPropsWithoutRef<'tr'>) => (
    <tr className="even:bg-zinc-50/50 dark:even:bg-zinc-900/20 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors" {...props}>{children}</tr>
  ),
  p: ({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) => (
    <p className="my-1.5 leading-relaxed" {...props}>{children}</p>
  ),
  strong: ({ children, ...props }: React.ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-semibold text-zinc-900 dark:text-white" {...props}>{children}</strong>
  ),
  a: ({ children, ...props }: React.ComponentPropsWithoutRef<'a'>) => (
    <a className="text-zinc-900 dark:text-white underline underline-offset-2" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
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
      ? <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
      : <code className={className} {...props}>{children}</code>
  },
  pre: ({ children, ...props }: React.ComponentPropsWithoutRef<'pre'>) => (
    <pre className="my-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 overflow-x-auto text-xs" {...props}>{children}</pre>
  ),
  blockquote: ({ children, ...props }: React.ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote className="my-2 border-l-2 border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900/30 pl-3 py-1 text-sm" {...props}>{children}</blockquote>
  ),
  hr: (props: React.ComponentPropsWithoutRef<'hr'>) => (
    <hr className="my-3 border-zinc-200 dark:border-white/10" {...props} />
  ),
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="max-w-none text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  )
}

// Tool call block — shows what the agent is doing
function ToolCallBlock({ part }: { part: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false)
  // For static tools: type is 'tool-searchEmails' -> extract 'searchEmails'
  // For dynamic tools: type is 'dynamic-tool' -> use toolName property
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
      isRunning ? 'border-zinc-300 dark:border-white/20 bg-zinc-50 dark:bg-zinc-900/30' :
      isError ? 'border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-900/10' :
      'border-zinc-200 dark:border-white/10 bg-white dark:bg-black/20'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors"
      >
        {isRunning && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-900 dark:text-white shrink-0" />}
        {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
        {isError && <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
        <Icon className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
        <span className={`font-medium ${isRunning ? 'text-zinc-900 dark:text-white' : 'text-zinc-900 dark:text-white'}`}>{meta.label}</span>
        {inputSummary && (
          <span className="text-zinc-500 dark:text-zinc-400 truncate max-w-[200px] sm:max-w-[250px]">— {inputSummary}</span>
        )}
        {isRunning && <span className="text-[10px] text-zinc-500 dark:text-zinc-400 ml-1 animate-pulse">running</span>}
        <ChevronRight className={`h-3 w-3 ml-auto text-zinc-400 transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-zinc-200 dark:border-white/10 px-3 py-2 space-y-2">
          {input && Object.keys(input).length > 0 && (
            <div>
              <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Input</div>
              <pre className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/30 rounded p-2 overflow-x-auto max-h-32 overflow-y-auto">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}
          {isDone && output && (
            <div>
              <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Result</div>
              <pre className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/30 rounded p-2 overflow-x-auto max-h-48 overflow-y-auto">
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

function TipsDropdown({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  const capabilities = [
    { icon: Mail, title: 'Email Operations', items: ['sendEmail - Send emails directly', 'draftEmail - Create drafts', 'getDrafts - View all drafts', 'updateDraft - Edit drafts', 'sendDraft - Send saved drafts', 'deleteDraft - Delete drafts'] },
    { icon: Search, title: 'Search & Read', items: ['searchEmails - Power search with Gmail syntax', 'readEmail - Read full email content', 'getEmailThread - Read conversation threads', 'getRecentEmails - Quick inbox overview'] },
    { icon: Tag, title: 'Labels & Organization', items: ['getLabels - List all labels', 'createLabel - Create custom labels', 'applyLabels - Apply labels (bulk!)', 'removeLabels - Remove labels (bulk!)'] },
    { icon: Archive, title: 'Inbox Management', items: ['archiveEmails - Archive emails', 'trashEmails - Move to trash', 'untrashEmails - Restore from trash', 'markAsRead / markAsUnread', 'starEmails / unstarEmails', 'markAsImportant / markAsNotImportant'] },
    { icon: Shield, title: 'Spam & Unsubscribe', items: ['reportSpam - Report as spam', 'markNotSpam - Rescue from spam', 'findUnsubscribableEmails - Find newsletters', 'bulkUnsubscribe - Unsubscribe in bulk'] },
    { icon: BarChart3, title: 'Analytics & Insights', items: ['getInboxStats - Email analytics', 'getContactDetails - Contact info', 'getSenderHistory - Interaction history'] },
  ]

  const examples = [
    '"Archive all promotional emails older than 30 days"',
    '"Star all emails from my boss"',
    '"Unsubscribe me from all newsletters"',
    '"Show me my conversation with sarah@company.com"',
    '"Clean up my inbox"',
    '"Give me a table of my top senders this week"',
  ]

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      {/* Mobile: full-screen modal. Desktop: positioned dropdown */}
      <div className="fixed inset-2 z-50 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[600px] max-h-[90vh] sm:max-h-[70vh] overflow-auto rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 sm:bg-white/95 sm:dark:bg-black/90 backdrop-blur-xl shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 sm:bg-white/95 sm:dark:bg-black/90 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h3 className="font-semibold text-base sm:text-lg">Agent Capabilities</h3>
            <Badge variant="secondary" className="ml-1 sm:ml-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-0 text-xs">33 Tools</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-4 sm:p-5 space-y-5 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {capabilities.map((category, idx) => (
              <div key={idx} className="rounded-xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/10 p-3 sm:p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800"><category.icon className="h-4 w-4 text-zinc-600 dark:text-zinc-300" /></div>
                  <h4 className="font-medium text-sm">{category.title}</h4>
                </div>
                <ul className="space-y-1 sm:space-y-1.5">
                  {category.items.map((item, i) => (
                    <li key={i} className="text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-1.5">
                      <span className="text-zinc-400 dark:text-zinc-500 mt-0.5">&#8226;</span><span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-200 dark:border-white/10" />
          <div>
            <div className="flex items-center gap-2 mb-3"><Lightbulb className="h-4 w-4 text-amber-400" /><h4 className="font-medium text-sm">Try saying:</h4></div>
            <div className="flex flex-wrap gap-2">
              {examples.map((example, i) => (
                <div key={i} className="text-xs px-3 py-1.5 rounded-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-default">{example}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const REQUEST_TIMEOUT = 120000

export function AgentChat({ user, isEmailConnected }: AgentChatProps) {
  const [input, setInput] = useState('')
  const [showTips, setShowTips] = useState(false)
  const [isTimedOut, setIsTimedOut] = useState(false)
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { messages, sendMessage, status, error, stop } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/agent',
      body: { userId: user.id, userEmail: user.email, isEmailConnected },
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Figure out what the agent is actively doing right now (for the streaming indicator)
  const activeToolInfo = useMemo(() => {
    if (!isLoading) return null
    // Look at the last assistant message's parts for any running tool calls
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

  // Auto-scroll on new content
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, status])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    setIsTimedOut(false)
    sendMessage({ text: input })
    setInput('')
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return
    setIsTimedOut(false)
    sendMessage({ text: suggestion })
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
      <header className="border-b border-zinc-200 dark:border-white/10 px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-white dark:bg-black">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold truncate">AI Email Agent</h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 hidden sm:block">Your powerful email assistant with 33 tools</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative">
            <Badge
              variant="outline"
              className="cursor-pointer px-2 py-1 sm:px-3 sm:py-1.5 gap-1.5 sm:gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-zinc-300 dark:border-white/20 bg-zinc-50 dark:bg-zinc-900/30"
              onClick={() => setShowTips(!showTips)}
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium hidden sm:inline">Tips & Commands</span>
              <span className="text-xs font-medium sm:hidden">Tips</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showTips ? 'rotate-180' : ''}`} />
            </Badge>
            <TipsDropdown isOpen={showTips} onClose={() => setShowTips(false)} />
          </div>
          {!isEmailConnected && (
            <div className="hidden sm:flex items-center gap-2 text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg text-sm">
              <Mail className="h-4 w-4" />Connect your email
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-auto px-3 py-4 sm:p-6" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5 sm:mb-6">
              <Brain className="h-7 w-7 sm:h-8 sm:w-8 text-zinc-500 dark:text-zinc-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-2">Hello, {userName}</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-2 text-center max-w-md text-sm sm:text-base px-4">
              {"I'm your AI email agent. I can search, send, organize, analyze, and unsubscribe — just tell me what you need."}
            </p>
            <button onClick={() => setShowTips(true)} className="text-sm text-zinc-900 dark:text-white hover:underline mb-6 sm:mb-8 flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5" />See all 33 capabilities
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 max-w-2xl w-full px-2">
              {suggestions.map((suggestion, i) => (
                <Card key={i} className="p-3 sm:p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors border-zinc-200 dark:border-white/10 bg-white dark:bg-black" onClick={() => handleSuggestionClick(suggestion)}>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Sparkles className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                    <span className="text-sm">{suggestion}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-2 sm:gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0">
                    <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white dark:text-black" />
                  </div>
                )}
                <div className={`max-w-[90%] sm:max-w-[85%] rounded-xl px-3 py-2 sm:px-4 sm:py-3 ${
                  message.role === 'user'
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
                    : 'bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/10'
                }`}>
                  {message.parts.map((part, index) => {
                    if (part.type === 'text') {
                      if (message.role === 'user') {
                        return <span key={index}>{part.text}</span>
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
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Show loading only if the last message doesn't already have a running tool visible */}
            {isLoading && !lastMsgHasRunningTool && (
              <div className="flex gap-2 sm:gap-4 justify-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0">
                  <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white dark:text-black" />
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 sm:px-4 sm:py-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-900 dark:text-white" />
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
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
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 sm:px-4 sm:py-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-sm text-amber-600 dark:text-amber-400">Request timed out.</span>
                    <Button variant="outline" size="sm" onClick={handleRetry} className="h-7 px-2 text-xs border-amber-500/30 hover:bg-amber-500/10">
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
        <div className="px-3 sm:px-6 py-3 bg-red-50 dark:bg-red-900/10 border-t border-red-200 dark:border-red-500/20">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />{error.message || 'An error occurred. Please try again.'}
            </div>
            <Button variant="outline" size="sm" onClick={handleRetry} className="h-7 px-2 text-xs border-red-300 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
              <RotateCcw className="h-3 w-3 mr-1" />Retry
            </Button>
          </div>
        </div>
      )}

      <div className="border-t border-zinc-200 dark:border-white/10 p-3 sm:p-4 bg-white dark:bg-black">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/10 rounded-xl p-1.5 sm:p-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your AI email agent anything..."
              className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 h-8 w-8 sm:h-9 sm:w-9 shrink-0">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
