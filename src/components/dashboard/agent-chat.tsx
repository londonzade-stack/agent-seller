'use client'

import { useState, useRef, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

import ReactMarkdown from 'react-markdown'
import {
  Send,
  Brain,
  Sparkles,
  AlertCircle,
  Loader2,
  User as UserIcon,
  Mail,
} from 'lucide-react'

interface AgentChatProps {
  user: User
  isEmailConnected: boolean
}

export function AgentChat({ user, isEmailConnected }: AgentChatProps) {
  const [input, setInput] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, status, error } = useChat({
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

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return
    sendMessage({ text: suggestion })
  }

  const suggestions = [
    'Find potential leads from my recent emails',
    'Draft a follow-up email for a prospect',
    'Summarize my sales activity this week',
    'Help me write a cold outreach email',
  ]

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  return (
    <div className="flex-1 flex flex-col h-screen">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between bg-card">
        <div>
          <h1 className="text-xl font-semibold">AI Sales Agent</h1>
          <p className="text-sm text-muted-foreground">
            Your intelligent assistant for medical sales
          </p>
        </div>
        {!isEmailConnected && (
          <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg text-sm">
            <Mail className="h-4 w-4" />
            Connect your email for full functionality
          </div>
        )}
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
            <p className="text-muted-foreground mb-8 text-center max-w-md">
              {"I'm your AI sales assistant. I can help you find leads, draft emails, and manage your sales pipeline."}
            </p>

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
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <Brain className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-xl px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="px-6 py-3 bg-destructive/10 border-t border-destructive/20">
          <div className="max-w-3xl mx-auto flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {error.message || 'An error occurred. Please try again.'}
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
              placeholder="Ask your AI sales agent anything..."
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
