'use client'

import { useState, useRef, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import ReactMarkdown from 'react-markdown'
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
  Search,
  Tag,
  Archive,
  Trash2,
  Star,
  BarChart3,
  Paperclip,
  Shield,
  Users,
  RotateCcw,
  StopCircle,
} from 'lucide-react'

interface AgentChatProps {
  user: User
  isEmailConnected: boolean
}

function TipsDropdown({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  const capabilities = [
    {
      icon: Mail,
      title: 'Email Operations',
      items: [
        'sendEmail - Send emails directly',
        'draftEmail - Create drafts',
        'getDrafts - View all drafts',
        'updateDraft - Edit drafts',
        'sendDraft - Send saved drafts',
        'deleteDraft - Delete drafts',
      ],
    },
    {
      icon: Search,
      title: 'Search & Read',
      items: [
        'searchEmails - Power search with Gmail syntax',
        'readEmail - Read full email content',
        'getEmailThread - Read conversation threads',
        'getRecentEmails - Quick inbox overview',
      ],
    },
    {
      icon: Tag,
      title: 'Labels & Organization',
      items: [
        'getLabels - List all labels',
        'createLabel - Create custom labels',
        'applyLabels - Apply labels (bulk!)',
        'removeLabels - Remove labels (bulk!)',
      ],
    },
    {
      icon: Archive,
      title: 'Inbox Management',
      items: [
        'archiveEmails - Archive emails',
        'trashEmails - Move to trash',
        'untrashEmails - Restore from trash',
        'markAsRead / markAsUnread',
        'starEmails / unstarEmails',
        'markAsImportant / markAsNotImportant',
      ],
    },
    {
      icon: Shield,
      title: 'Spam Management',
      items: [
        'reportSpam - Report as spam',
        'markNotSpam - Rescue from spam',
      ],
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      items: [
        'getInboxStats - Email analytics',
        'getContactDetails - Contact info',
        'getSenderHistory - Interaction history',
      ],
    },
  ]

  const examples = [
    '"Archive all promotional emails older than 30 days"',
    '"Star all emails from my boss"',
    '"Send an email to john@example.com..."',
    '"Show me my conversation with sarah@company.com"',
    '"Clean up my inbox"',
    '"Create an Urgent label and apply it"',
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Dropdown */}
      <div className="absolute top-full right-0 mt-2 z-50 w-[600px] max-h-[70vh] overflow-auto rounded-2xl border border-white/20 bg-white/10 dark:bg-black/40 backdrop-blur-xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h3 className="font-semibold text-lg">Agent Capabilities</h3>
            <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary border-0">
              30+ Tools
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* Capabilities Grid */}
          <div className="grid grid-cols-2 gap-4">
            {capabilities.map((category, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-white/5 dark:bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-primary/20">
                    <category.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="font-medium text-sm">{category.title}</h4>
                </div>
                <ul className="space-y-1.5">
                  {category.items.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Examples Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <h4 className="font-medium text-sm">Try saying:</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {examples.map((example, i) => (
                <div
                  key={i}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors cursor-default"
                >
                  {example}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Timeout duration in milliseconds (2 minutes - bulk operations need time)
const REQUEST_TIMEOUT = 120000

export function AgentChat({ user, isEmailConnected }: AgentChatProps) {
  const [input, setInput] = useState('')
  const [showTips, setShowTips] = useState(false)
  const [isTimedOut, setIsTimedOut] = useState(false)
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const { messages, sendMessage, status, error, stop, reload } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/agent',
      body: {
        userId: user.id,
        userEmail: user.email,
        isEmailConnected,
      },
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Handle timeout
  useEffect(() => {
    if (isLoading && !loadingStartTime) {
      setLoadingStartTime(Date.now())
      setIsTimedOut(false)

      // Set timeout
      timeoutRef.current = setTimeout(() => {
        setIsTimedOut(true)
        // Try to stop the request
        if (stop) {
          stop()
        }
      }, REQUEST_TIMEOUT)
    }

    if (!isLoading) {
      setLoadingStartTime(null)
      setIsTimedOut(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isLoading, loadingStartTime, stop])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

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

  const handleStop = () => {
    if (stop) {
      stop()
    }
    setIsTimedOut(false)
    setLoadingStartTime(null)
  }

  const handleRetry = () => {
    setIsTimedOut(false)
    setLoadingStartTime(null)
    if (reload) {
      reload()
    }
  }

  const suggestions = [
    'Show me my unread emails from today',
    'Draft a follow-up email for a prospect',
    'Archive all emails older than 30 days',
    'Get my inbox stats for this week',
  ]

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  return (
    <div className="flex-1 flex flex-col h-screen">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between bg-card">
        <div>
          <h1 className="text-xl font-semibold">AI Email Agent</h1>
          <p className="text-sm text-muted-foreground">
            Your powerful email assistant with 30+ capabilities
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tips Badge */}
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
              <Mail className="h-4 w-4" />
              Connect your email
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
            <h2 className="text-2xl font-semibold mb-2">
              Hello, {userName}
            </h2>
            <p className="text-muted-foreground mb-2 text-center max-w-md">
              {"I'm your powerful AI email assistant. I can search, send, organize, and analyze your emails."}
            </p>
            <button
              onClick={() => setShowTips(true)}
              className="text-sm text-primary hover:underline mb-8 flex items-center gap-1"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              See all 30+ capabilities
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
              {suggestions.map((suggestion, i) => (
                <Card
                  key={i}
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors border-border"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
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
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                    <Brain className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.parts.map((part, index) => {
                    if (part.type === 'text') {
                      return (
                        <div key={index} className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{part.text}</ReactMarkdown>
                        </div>
                      )
                    }
                    if (part.type.startsWith('tool-')) {
                      // Handle tool invocation states
                      const toolPart = part as { type: string; toolCallId: string; toolName?: string; state?: string }
                      if (toolPart.state === 'call' || toolPart.state === 'partial-call' || toolPart.state === 'input-streaming') {
                        return (
                          <div key={index} className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Using tool: {toolPart.toolName || 'processing...'}
                          </div>
                        )
                      }
                      // Tool result - don't show anything special
                      return null
                    }
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

            {/* Loading state with stop/retry */}
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <Brain className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      {status === 'streaming' ? 'Working...' : 'Thinking...'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleStop}
                      className="h-7 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                    >
                      <StopCircle className="h-3 w-3 mr-1" />
                      Stop
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Timeout state */}
            {isTimedOut && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-amber-600 dark:text-amber-400">
                      Request timed out. The operation took too long.
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      className="h-7 px-2 text-xs border-amber-500/30 hover:bg-amber-500/10"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Retry
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
              <AlertCircle className="h-4 w-4" />
              {error.message || 'An error occurred. Please try again.'}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="h-7 px-2 text-xs border-destructive/30 hover:bg-destructive/10 text-destructive"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Retry
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
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="rounded-lg"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
