'use client'

import { useState } from 'react'
import {
  Send,
  Brain,
  ChevronRight,
  Search,
  Mail,
  CheckCircle2,
  BarChart3,
  Loader2,
  User as UserIcon,
  Sparkles,
  Tag,
} from 'lucide-react'

// ─── Mock Data ──────────────────────────────────────────────────────
const MOCK_MESSAGES = [
  {
    id: '1',
    role: 'user' as const,
    text: 'Scan my inbox for newsletters and unsubscribe from the ones I never read',
    time: '3:42 PM',
  },
  {
    id: '2',
    role: 'assistant' as const,
    text: 'I found **27 newsletter subscriptions** in your inbox. Of those, you haven\'t opened **19** in the last 3 months. Here\'s the breakdown:\n\n- **8** you read regularly (keeping)\n- **12** you never opened (safe to unsubscribe)\n- **7** you opened once (your call)\n\nShall I unsubscribe from the 12 you never read?',
    time: '3:42 PM',
    toolCalls: [
      {
        name: 'findUnsubscribableEmails',
        label: 'Scanning subscriptions',
        icon: Search,
        input: { lookback: '90d' },
        output: { total: 27, neverOpened: 12, readOnce: 7, regular: 8 },
        state: 'done' as const,
      },
    ],
  },
  {
    id: '3',
    role: 'user' as const,
    text: 'Yes, unsubscribe from all 12 and label the others',
    time: '3:43 PM',
  },
  {
    id: '4',
    role: 'assistant' as const,
    text: 'All done. Successfully unsubscribed from **12 newsletters** and labeled the remaining 15 as "Newsletters" for easy access.\n\nYou should see fewer unwanted emails going forward.',
    time: '3:44 PM',
    toolCalls: [
      {
        name: 'bulkUnsubscribe',
        label: 'Bulk unsubscribing',
        icon: Mail,
        input: { emailIds: ['...12 newsletters'] },
        output: { unsubscribed: 12, failed: 0 },
        state: 'done' as const,
      },
      {
        name: 'applyLabels',
        label: 'Applying labels',
        icon: Tag,
        input: { labelName: 'Newsletters', count: 15 },
        output: { applied: 15 },
        state: 'done' as const,
      },
    ],
  },
]

// ─── Tool Call (Glass Panel) ────────────────────────────────────────
function ToolCallGlass({
  tool,
}: {
  tool: {
    name: string
    label: string
    icon: typeof Search
    input: Record<string, unknown>
    output: Record<string, unknown>
    state: string
  }
}) {
  const [expanded, setExpanded] = useState(false)
  const Icon = tool.icon
  const isDone = tool.state === 'done'

  return (
    <div
      className="my-2.5 rounded-xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs hover:bg-white/[0.03] transition-colors"
      >
        {isDone ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        ) : (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400 shrink-0" />
        )}
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.3))',
          }}
        >
          <Icon className="h-3 w-3 text-white/80" />
        </div>
        <span className="font-medium text-white/90">{tool.label}</span>
        {isDone && (
          <span className="text-[10px] text-emerald-400/60 ml-1">done</span>
        )}
        <ChevronRight
          className={`h-3 w-3 ml-auto text-white/30 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>
      {expanded && (
        <div
          className="px-3.5 py-3 space-y-2"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          <div>
            <div className="text-[10px] font-semibold text-purple-300/50 uppercase tracking-wider mb-1">
              Input
            </div>
            <pre
              className="text-[11px] text-white/50 rounded-lg p-2.5 overflow-x-auto"
              style={{ background: 'rgba(0,0,0,0.3)' }}
            >
              {JSON.stringify(tool.input, null, 2)}
            </pre>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-purple-300/50 uppercase tracking-wider mb-1">
              Result
            </div>
            <pre
              className="text-[11px] text-white/50 rounded-lg p-2.5 overflow-x-auto"
              style={{ background: 'rgba(0,0,0,0.3)' }}
            >
              {JSON.stringify(tool.output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Inline Markdown ────────────────────────────────────────────────
function GlassMarkdown({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  const renderInline = (text: string, key: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={`${key}-${i}`} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return <span key={`${key}-${i}`}>{part}</span>
    })
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()

    if (trimmed.startsWith('- ')) {
      elements.push(
        <div key={idx} className="flex items-start gap-2 my-0.5">
          <span
            className="mt-2 w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
            }}
          />
          <span className="text-sm text-white/70 leading-relaxed">
            {renderInline(trimmed.slice(2), `li-${idx}`)}
          </span>
        </div>
      )
    } else if (trimmed === '') {
      elements.push(<div key={idx} className="h-1.5" />)
    } else {
      elements.push(
        <p key={idx} className="text-sm text-white/70 leading-relaxed my-1">
          {renderInline(trimmed, `p-${idx}`)}
        </p>
      )
    }
  })

  return <div>{elements}</div>
}

// ─── Main Component ─────────────────────────────────────────────────
export function StyleDGlassmorphism() {
  const [inputValue, setInputValue] = useState('')

  return (
    <div
      className="flex flex-col h-full relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 30%, #0a1628 60%, #0f1a2e 100%)',
      }}
    >
      {/* Background gradient orbs */}
      <div
        className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.4), transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-15 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.4), transparent 70%)',
        }}
      />
      <div
        className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full opacity-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(236,72,153,0.4), transparent 70%)',
        }}
      />

      {/* Header */}
      <header
        className="relative z-10 px-6 py-4 flex items-center justify-between"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.5), rgba(59,130,246,0.5))',
              boxShadow: '0 0 20px rgba(139,92,246,0.2)',
            }}
          >
            <Brain className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight">
              AI Email Agent
            </h1>
            <p className="text-xs text-white/30">Glassmorphism</p>
          </div>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-xs text-white/60 font-medium">Pro</span>
        </div>
      </header>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {MOCK_MESSAGES.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(59,130,246,0.4))',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <Brain className="h-4 w-4 text-white/90" />
                </div>
              )}

              <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'space-y-2'}`}>
                {msg.role === 'user' ? (
                  <div
                    className="rounded-2xl rounded-br-md px-4 py-3"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(59,130,246,0.4))',
                      border: '1px solid rgba(139,92,246,0.3)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                    }}
                  >
                    <p className="text-sm text-white">{msg.text}</p>
                  </div>
                ) : (
                  <>
                    {msg.toolCalls?.map((tool, i) => (
                      <ToolCallGlass key={i} tool={tool} />
                    ))}
                    <div
                      className="rounded-2xl rounded-bl-md px-4 py-3"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <GlassMarkdown content={msg.text} />
                    </div>
                  </>
                )}
                <div
                  className={`text-[10px] mt-1 ${
                    msg.role === 'user'
                      ? 'text-purple-300/40 text-right'
                      : 'text-white/20'
                  }`}
                >
                  {msg.time}
                </div>
              </div>

              {msg.role === 'user' && (
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <UserIcon className="h-4 w-4 text-white/60" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div
        className="relative z-10 p-4"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="max-w-3xl mx-auto">
          <div
            className="flex items-center gap-3 rounded-xl p-2"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask your AI email agent..."
              className="flex-1 bg-transparent border-0 outline-none text-sm text-white placeholder:text-white/30 px-2"
            />
            <button
              className="rounded-lg h-9 w-9 flex items-center justify-center hover:opacity-80 transition-opacity shrink-0"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                boxShadow: '0 0 15px rgba(139,92,246,0.3)',
              }}
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
