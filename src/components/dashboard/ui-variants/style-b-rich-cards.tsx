'use client'

import { useState } from 'react'
import {
  Send,
  Brain,
  ChevronDown,
  ChevronRight,
  Search,
  Mail,
  CheckCircle2,
  BarChart3,
  Loader2,
  User as UserIcon,
  Tag,
  Inbox,
  TrendingUp,
  Clock,
} from 'lucide-react'

// ─── Mock Data ──────────────────────────────────────────────────────
const MOCK_MESSAGES = [
  {
    id: '1',
    role: 'user' as const,
    text: 'Give me a full breakdown of my inbox this week',
    time: '2:14 PM',
  },
  {
    id: '2',
    role: 'assistant' as const,
    text: 'Here is your inbox breakdown for the past 7 days. You have a few items that need attention.',
    time: '2:14 PM',
    toolCalls: [
      {
        name: 'getInboxStats',
        label: 'Analyzing inbox',
        icon: BarChart3,
        input: { timeframe: '7d' },
        output: {
          totalEmails: 147,
          unread: 23,
          sent: 34,
          topSenders: [
            { name: 'Sarah Chen', count: 12 },
            { name: 'Mike Ross', count: 8 },
          ],
        },
        state: 'done' as const,
      },
    ],
    stats: [
      { label: 'TOTAL EMAILS', value: '147', icon: Inbox, color: 'text-blue-400' },
      { label: 'UNREAD', value: '23', icon: Mail, color: 'text-amber-400' },
      { label: 'SENT', value: '34', icon: Send, color: 'text-emerald-400' },
      { label: 'AVG RESPONSE', value: '2.4h', icon: Clock, color: 'text-purple-400' },
    ],
    badges: [
      { label: 'Clients', count: 18, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      { label: 'Newsletters', count: 42, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      { label: 'Internal', count: 31, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      { label: 'Promotions', count: 56, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
    ],
  },
  {
    id: '3',
    role: 'user' as const,
    text: 'Label all client emails and archive the promotions',
    time: '2:15 PM',
  },
  {
    id: '4',
    role: 'assistant' as const,
    text: 'Done. I labeled **18 client emails** with "Clients" and archived **56 promotional emails**. Your inbox is now much cleaner.',
    time: '2:16 PM',
    toolCalls: [
      {
        name: 'applyLabels',
        label: 'Applying labels',
        icon: Tag,
        input: { labelName: 'Clients', emailIds: ['...18 emails'] },
        output: { applied: 18 },
        state: 'done' as const,
      },
      {
        name: 'archiveEmails',
        label: 'Archiving emails',
        icon: Mail,
        input: { emailIds: ['...56 emails'] },
        output: { archived: 56 },
        state: 'done' as const,
      },
    ],
    resultCards: [
      { label: 'Labeled', value: '18', sublabel: 'Client emails', icon: Tag, color: 'text-blue-400' },
      { label: 'Archived', value: '56', sublabel: 'Promotions', icon: Mail, color: 'text-emerald-400' },
    ],
  },
]

// ─── Tool Call (Rich Collapsible Block) ─────────────────────────────
function ToolCallRich({
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
    <div className="my-2 rounded-lg border border-white/[0.08] bg-white/[0.03] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs hover:bg-white/[0.04] transition-colors"
      >
        {isDone ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        ) : (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400 shrink-0" />
        )}
        <div className="w-6 h-6 rounded-md bg-white/[0.06] flex items-center justify-center">
          <Icon className="h-3 w-3 text-zinc-400" />
        </div>
        <span className="font-medium text-zinc-200">{tool.label}</span>
        {isDone && (
          <span className="ml-1 text-[10px] text-emerald-400/70 font-medium">
            completed
          </span>
        )}
        <ChevronDown
          className={`h-3 w-3 ml-auto text-zinc-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      {expanded && (
        <div className="border-t border-white/[0.06] px-3.5 py-3 space-y-2.5 bg-black/20">
          <div>
            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Input
            </div>
            <pre className="text-[11px] text-zinc-400 bg-black/30 rounded-md p-2.5 overflow-x-auto font-mono">
              {JSON.stringify(tool.input, null, 2)}
            </pre>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Output
            </div>
            <pre className="text-[11px] text-zinc-400 bg-black/30 rounded-md p-2.5 overflow-x-auto font-mono">
              {JSON.stringify(tool.output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Stat Card ──────────────────────────────────────────────────────
function StatCard({
  stat,
}: {
  stat: {
    label: string
    value: string
    icon: typeof Inbox
    color: string
    sublabel?: string
  }
}) {
  const Icon = stat.icon
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 hover:bg-white/[0.05] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
          {stat.label}
        </span>
        <Icon className={`h-4 w-4 ${stat.color}`} />
      </div>
      <div className="text-3xl font-bold text-white tracking-tight">
        {stat.value}
      </div>
      {stat.sublabel && (
        <div className="text-xs text-zinc-500 mt-1">{stat.sublabel}</div>
      )}
    </div>
  )
}

// ─── Inline Markdown (simplified) ───────────────────────────────────
function InlineMarkdown({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g)
  return (
    <p className="text-sm text-zinc-300 leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </p>
  )
}

// ─── Main Component ─────────────────────────────────────────────────
export function StyleBRichCards() {
  const [inputValue, setInputValue] = useState('')

  return (
    <div className="flex flex-col h-full bg-[#0a0a0b]">
      {/* Header */}
      <header className="border-b border-white/[0.08] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Brain className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight">
              AI Email Agent
            </h1>
            <p className="text-xs text-zinc-500">Rich Data Cards</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Connected</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {MOCK_MESSAGES.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                  <Brain className="h-4 w-4 text-white" />
                </div>
              )}

              <div
                className={`max-w-[85%] ${
                  msg.role === 'user'
                    ? 'rounded-2xl rounded-br-md bg-blue-600 px-4 py-3'
                    : 'space-y-3'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="text-sm text-white">{msg.text}</p>
                ) : (
                  <>
                    {/* Tool calls */}
                    {msg.toolCalls?.map((tool, i) => (
                      <ToolCallRich key={i} tool={tool} />
                    ))}

                    {/* Stat cards grid */}
                    {'stats' in msg && msg.stats && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {msg.stats.map((stat, i) => (
                          <StatCard key={i} stat={stat} />
                        ))}
                      </div>
                    )}

                    {/* Result cards (for action results) */}
                    {'resultCards' in msg && msg.resultCards && (
                      <div className="grid grid-cols-2 gap-2.5">
                        {msg.resultCards.map((card, i) => (
                          <StatCard key={i} stat={card} />
                        ))}
                      </div>
                    )}

                    {/* Badge chips */}
                    {'badges' in msg && msg.badges && (
                      <div className="flex flex-wrap gap-2">
                        {msg.badges.map((badge, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.color}`}
                          >
                            {badge.label}
                            <span className="opacity-70">{badge.count}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Text content */}
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                      <InlineMarkdown content={msg.text} />
                    </div>
                  </>
                )}

                <div
                  className={`text-[10px] mt-1 ${
                    msg.role === 'user' ? 'text-blue-300/60 text-right' : 'text-zinc-600'
                  }`}
                >
                  {msg.time}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <UserIcon className="h-4 w-4 text-zinc-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-white/[0.08] p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-xl p-2">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask your AI email agent..."
              className="flex-1 bg-transparent border-0 outline-none text-sm text-white placeholder:text-zinc-600 px-2"
            />
            <button className="rounded-lg bg-blue-600 text-white h-9 w-9 flex items-center justify-center hover:bg-blue-500 transition-colors shrink-0">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
