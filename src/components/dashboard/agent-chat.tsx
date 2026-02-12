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
  deleteDraft: { label: 'Deleting draft', icon: Trash2 },
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

// Markdown renderer with full GFM support (tables, strikethrough, task lists, autolinks)
function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none
      prose-table:w-full prose-table:border-collapse prose-table:text-sm
      prose-th:border prose-th:border-border prose-th:bg-muted/60 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-xs prose-th:uppercase prose-th:tracking-wider
      prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-td:text-sm
      prose-tr:even:bg-muted/20
      prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-muted prose-pre:rounded-lg prose-pre:p-3
      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
      prose-strong:text-foreground
      prose-li:marker:text-muted-foreground
      prose-headings:text-foreground prose-headings:font-semibold
      prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
      prose-p:leading-relaxed prose-p:my-1.5
      prose-ul:my-1.5 prose-ol:my-1.5
      prose-blockquote:border-l-primary/50 prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:not-italic
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}

// Tool call block — shows what the agent is doing
function ToolCallBlock({ part }: { part: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false)
  const toolName = (part.toolName as string) || 'unknown'
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
      isRunning ? 'border-primary/30 bg-primary/5' :
      isError ? 'border-destructive/30 bg-destructive/5' :
      'border-border/50 bg-background/50'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted/50 transition-colors"
      >
        {isRunning && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />}
        {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
        {isError && <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className={`font-medium ${isRunning ? 'text-primary' : 'text-foreground'}`}>{meta.label}</span>
        {inputSummary && (
          <span className="text-muted-foreground truncate max-w-[250px]">— {inputSummary}</span>
        )}
        {isRunning && <span className="text-[10px] text-primary/70 ml-1 animate-pulse">running</span>}
        <ChevronRight className={`h-3 w-3 ml-auto text-muted-foreground transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-border/50 px-3 py-2 space-y-2">
          {input && Object.keys(input).length > 0 && (
            <div>
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Input</div>
              <pre className="text-[11px] text-muted-foreground bg-muted/50 rounded p-2 overflow-x-auto max-h-32 overflow-y-auto">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}
          {isDone && output && (
            <div>
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Result</div>
              <pre className="text-[11px] text-muted-foreground bg-muted/50 rounded p-2 overflow-x-auto max-h-48 overflow-y-auto">
                {JSON.stringify(output, null, 2)}
              </pre>
            </div>
          )}
          {isError && errorText && (
            <div className="text-xs text-destructive">{errorText}</div>
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
      <div className="absolute top-full right-0 mt-2 z-50 w-[600px] max-h-[70vh] overflow-auto rounded-2xl border border-white/20 bg-white/10 dark:bg-black/40 backdrop-blur-xl shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h3 className="font-semibold text-lg">Agent Capabilities</h3>
            <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary border-0">33 Tools</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-white/10"><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-5 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {capabilities.map((category, idx) => (
              <div key={idx} className="rounded-xl bg-white/5 dark:bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-primary/20"><category.icon className="h-4 w-4 text-primary" /></div>
                  <h4 className="font-medium text-sm">{category.title}</h4>
                </div>
                <ul className="space-y-1.5">
                  {category.items.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span><span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10" />
          <div>
            <div className="flex items-center gap-2 mb-3"><Lightbulb className="h-4 w-4 text-amber-400" /><h4 className="font-medium text-sm">Try saying:</h4></div>
            <div className="flex flex-wrap gap-2">
              {examples.map((example, i) => (
                <div key={i} className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors cursor-default">{example}</div>
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
    const toolName = (lastRunning.toolName as string) || 'unknown'
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
    <div className="flex-1 flex flex-col h-screen">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between bg-card">
        <div>
          <h1 className="text-xl font-semibold">AI Email Agent</h1>
          <p className="text-sm text-muted-foreground">Your powerful email assistant with 33 tools</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Badge
              variant="outline"
              className="cursor-pointer px-3 py-1.5 gap-2 hover:bg-primary/10 transition-colors border-primary/30 bg-primary/5"
              onClick={() => setShowTips(!showTips)}
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium">Tips & Commands</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showTips ? 'rotate-180' : ''}`} />
            </Badge>
            <TipsDropdown isOpen={showTips} onClose={() => setShowTips(false)} />
          </div>
          {!isEmailConnected && (
            <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg text-sm">
              <Mail className="h-4 w-4" />Connect your email
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
              <Brain className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Hello, {userName}</h2>
            <p className="text-muted-foreground mb-2 text-center max-w-md">
              {"I'm your AI email agent. I can search, send, organize, analyze, and unsubscribe — just tell me what you need."}
            </p>
            <button onClick={() => setShowTips(true)} className="text-sm text-primary hover:underline mb-8 flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5" />See all 33 capabilities
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
              {suggestions.map((suggestion, i) => (
                <Card key={i} className="p-4 cursor-pointer hover:bg-muted/50 transition-colors border-border" onClick={() => handleSuggestionClick(suggestion)}>
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{suggestion}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                    <Brain className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
                  message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
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
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Show loading only if the last message doesn't already have a running tool visible */}
            {isLoading && !lastMsgHasRunningTool && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <Brain className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {activeToolInfo ? activeToolInfo.label + '...' : status === 'streaming' ? 'Working...' : 'Thinking...'}
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleStop} className="h-7 px-2 text-xs hover:bg-destructive/10 hover:text-destructive">
                      <StopCircle className="h-3 w-3 mr-1" />Stop
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isTimedOut && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
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
        <div className="px-6 py-3 bg-destructive/10 border-t border-destructive/20">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />{error.message || 'An error occurred. Please try again.'}
            </div>
            <Button variant="outline" size="sm" onClick={handleRetry} className="h-7 px-2 text-xs border-destructive/30 hover:bg-destructive/10 text-destructive">
              <RotateCcw className="h-3 w-3 mr-1" />Retry
            </Button>
          </div>
        </div>
      )}

      <div className="border-t border-border p-4 bg-card">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 bg-muted rounded-xl p-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your AI email agent anything..."
              className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="rounded-lg">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
