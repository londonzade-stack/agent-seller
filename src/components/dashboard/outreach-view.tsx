'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { BlitzAvatar } from '@/components/blitz-avatar'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
  User as UserIcon,
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
  const partType = part.type as string
  const toolName = partType === 'dynamic-tool'
    ? (part.toolName as string) || 'unknown'
    : partType.startsWith('tool-') ? partType.slice(5) : (part.toolName as string) || 'unknown'
  const state = part.state as string
  const meta = getToolMeta(toolName)
  const Icon = meta.icon
  const input = part.input as Record<string, unknown> | undefined
  const output = part.output as unknown

  const isRunning = state === 'input-streaming' || state === 'input-available' || state === 'call' || state === 'partial-call'
  const isDone = state === 'output-available' || state === 'result'
  const isError = state === 'output-error'
  const errorText = isError ? ((part.output as Record<string, unknown>)?.error as string) || 'Tool call failed' : null

  const inputSummary = input?.query ? `"${String(input.query).slice(0, 40)}"` : null

  return (
    <div className={`my-2 rounded-lg border overflow-hidden transition-colors max-w-full ${
      isRunning
        ? 'border-blue-300 dark:border-blue-700/40 bg-blue-50/60 dark:bg-blue-950/20'
        : isError
          ? 'border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-900/10'
          : 'border-blue-200/60 dark:border-blue-800/30 bg-blue-50/40 dark:bg-blue-950/15'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-colors"
      >
        {isRunning && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />}
        {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
        {isError && <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
        <Icon className="h-3.5 w-3.5 text-blue-700/60 dark:text-blue-500/60 shrink-0" />
        <span className="font-medium text-blue-900 dark:text-blue-200">{meta.label}</span>
        {inputSummary && (
          <span className="text-blue-700/50 dark:text-blue-400/50 truncate max-w-[120px] sm:max-w-[250px]">— {inputSummary}</span>
        )}
        {isRunning && <span className="text-[10px] text-blue-600 dark:text-blue-400 ml-1 animate-pulse">running</span>}
        <ChevronRight className={`h-3 w-3 ml-auto text-blue-400 dark:text-blue-600 transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-blue-200/60 dark:border-blue-800/20 px-3 py-2 space-y-2 bg-blue-50/20 dark:bg-blue-950/10">
          {input && Object.keys(input).length > 0 && (
            <div>
              <div className="text-[10px] font-medium text-blue-700/60 dark:text-blue-500/50 uppercase tracking-wider mb-1">What it&apos;s doing</div>
              <div className="text-[11px] text-blue-800/70 dark:text-blue-300/60 bg-white/60 dark:bg-black/30 rounded p-2 space-y-0.5 break-words overflow-hidden">
                {summarizeInput(toolName, input).map((line, i) => (
                  <div key={i} className="break-words">{line}</div>
                ))}
              </div>
            </div>
          )}
          {isDone && output != null && (
            <div>
              <div className="text-[10px] font-medium text-blue-700/60 dark:text-blue-500/50 uppercase tracking-wider mb-1">Result</div>
              <div className="text-[11px] text-blue-800/70 dark:text-blue-300/60 bg-white/60 dark:bg-black/30 rounded p-2 space-y-0.5 break-words overflow-hidden">
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
  )
}

// Markdown renderer
const markdownComponents = {
  p: ({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) => (
    <p className="my-1.5 leading-relaxed" {...props}>{children}</p>
  ),
  strong: ({ children, ...props }: React.ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-semibold text-zinc-900 dark:text-white" {...props}>{children}</strong>
  ),
  a: ({ children, ...props }: React.ComponentPropsWithoutRef<'a'>) => (
    <a {...props} className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300 transition-colors" target="_blank" rel="noopener noreferrer">{children}</a>
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
  table: ({ children, ...props }: React.ComponentPropsWithoutRef<'table'>) => (
    <div className="my-3 -mx-1 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="min-w-[480px] w-full border-collapse text-sm" {...props}>{children}</table>
    </div>
  ),
  thead: ({ children, ...props }: React.ComponentPropsWithoutRef<'thead'>) => (
    <thead className="bg-zinc-50 dark:bg-zinc-800/50" {...props}>{children}</thead>
  ),
  th: ({ children, ...props }: React.ComponentPropsWithoutRef<'th'>) => (
    <th className="border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500" {...props}>{children}</th>
  ),
  td: ({ children, ...props }: React.ComponentPropsWithoutRef<'td'>) => (
    <td className="border-b border-zinc-100 dark:border-zinc-800/50 px-3 py-2 text-sm" {...props}>{children}</td>
  ),
  tr: ({ children, ...props }: React.ComponentPropsWithoutRef<'tr'>) => (
    <tr className="even:bg-zinc-50/50 dark:even:bg-zinc-800/20" {...props}>{children}</tr>
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
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="max-w-none text-sm break-words overflow-hidden [&>*]:max-w-full">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>
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
  onNavigateToBilling?: () => void
  onOpenCommandPalette?: () => void
  onSessionCreated?: (sessionId: string) => void
}

const REQUEST_TIMEOUT = 120000

export function OutreachView({ user, isEmailConnected, userPlan, initialSessionId, onNavigateToBilling, onSessionCreated }: OutreachViewProps) {
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
      initialMessages={initialMessages}
      onNavigateToBilling={onNavigateToBilling}
      onSessionCreated={onSessionCreated}
    />
  )
}

function OutreachViewInner({ user, isEmailConnected, userPlan, initialSessionId, initialMessages, onNavigateToBilling, onSessionCreated }: OutreachViewProps & { initialMessages: UIMessage[] }) {
  const isPro = userPlan === 'pro'
  const [input, setInput] = useState('')
  const [showExamples, setShowExamples] = useState(false)
  const [isTimedOut, setIsTimedOut] = useState(false)
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
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
      setIsTimedOut(false)
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

  // Save assistant messages when streaming completes
  const prevStatusRef = useRef(status)
  useEffect(() => {
    if (prevStatusRef.current === 'streaming' && status === 'ready') {
      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
      if (lastAssistant) {
        const textContent = lastAssistant.parts
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map(p => p.text)
          .join('\n')
        if (textContent) saveMessage('assistant', textContent)
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
    const text = input
    sendMessage({ text })
    setInput('')
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
            <div className="mb-4 sm:mb-5">
              <BlitzAvatar size="lg" variant="blue" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-stone-900 dark:text-white">Sales Outreach</h2>
            <p className="text-stone-500 dark:text-zinc-400 mb-2 text-center max-w-md text-sm sm:text-base px-4">
              Search the web, research companies, and draft personalized outreach — all powered by BLITZ.
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
                    Click any card above or type your own prompt below. BLITZ will research, draft, and present everything for your review before any emails go out.
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
              <div key={message.id} className={`flex gap-2 sm:gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="shrink-0">
                    <BlitzAvatar size="sm" variant="blue" />
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
            ))}

            {/* Loading indicator */}
            {isLoading && !lastMsgHasRunningTool && (
              <div className="flex gap-2 sm:gap-4 justify-start">
                <div className="shrink-0">
                  <BlitzAvatar size="sm" variant="blue" />
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

      {/* Input bar */}
      <div className="border-t border-stone-200 dark:border-zinc-800 p-3 sm:p-4 bg-[#faf8f5] dark:bg-[#111113] shrink-0">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl p-1.5 sm:p-2 shadow-sm dark:shadow-none">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search for companies, draft outreach, or ask BLITZ anything..."
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
