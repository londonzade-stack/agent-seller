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
  Sun,
  Moon,
} from 'lucide-react'

// ─── Theme tokens ───────────────────────────────────────────────────
const themes = {
  light: {
    pageBg: '#faf8f5',
    headerBorder: 'border-stone-200',
    timelineLine: 'bg-stone-200',
    titleColor: 'text-stone-900',
    subtitleColor: 'text-stone-400',
    statusBg: 'bg-stone-100',
    statusText: 'text-stone-500',
    userDotBg: 'bg-stone-200',
    userDotText: 'text-stone-600',
    agentDotBg: 'bg-stone-800',
    agentDotIcon: 'text-white',
    labelText: 'text-stone-500',
    timeText: 'text-stone-400',
    cardBg: 'bg-white',
    cardBorder: 'border-stone-200',
    cardShadow: 'shadow-sm',
    userText: 'text-stone-800',
    bodyText: 'text-stone-700',
    boldText: 'text-stone-900',
    bulletColor: 'text-amber-400',
    // tool call
    toolBg: 'bg-amber-50/40',
    toolBorder: 'border-amber-200/60',
    toolCheck: 'text-amber-600',
    toolIcon: 'text-amber-700/60',
    toolLabel: 'text-amber-900',
    toolChevron: 'text-amber-400',
    toolHover: 'hover:bg-amber-50/60',
    toolExpandBg: 'bg-amber-50/20',
    toolExpandBorder: 'border-amber-200/60',
    toolSectionLabel: 'text-amber-700/60',
    toolPreBg: 'bg-white/60',
    toolPreText: 'text-amber-800/70',
    // table
    tableBg: 'bg-white/80',
    tableBorder: 'border-stone-200',
    tableHeadBg: 'bg-stone-50',
    tableHeadText: 'text-stone-500',
    tableHeadBorder: 'border-stone-200',
    tableCellText: 'text-stone-700',
    tableCellBorder: 'border-stone-100',
    tableRowEven: 'even:bg-stone-50/50',
    // input
    inputBg: 'bg-white',
    inputBorder: 'border-stone-200',
    inputText: 'text-stone-800',
    inputPlaceholder: 'placeholder:text-stone-400',
    sendBg: 'bg-stone-800',
    sendHover: 'hover:bg-stone-700',
    sendIcon: 'text-white',
    // toggle
    toggleBg: 'bg-stone-100',
    toggleBorder: 'border-stone-200',
    toggleIcon: 'text-stone-500',
  },
  dark: {
    pageBg: '#111113',
    headerBorder: 'border-zinc-800',
    timelineLine: 'bg-zinc-800',
    titleColor: 'text-white',
    subtitleColor: 'text-zinc-500',
    statusBg: 'bg-zinc-800',
    statusText: 'text-zinc-400',
    userDotBg: 'bg-zinc-700',
    userDotText: 'text-zinc-300',
    agentDotBg: 'bg-zinc-200',
    agentDotIcon: 'text-zinc-900',
    labelText: 'text-zinc-500',
    timeText: 'text-zinc-600',
    cardBg: 'bg-zinc-900',
    cardBorder: 'border-zinc-800',
    cardShadow: 'shadow-none',
    userText: 'text-zinc-200',
    bodyText: 'text-zinc-400',
    boldText: 'text-white',
    bulletColor: 'text-amber-500',
    // tool call
    toolBg: 'bg-amber-950/30',
    toolBorder: 'border-amber-800/30',
    toolCheck: 'text-amber-400',
    toolIcon: 'text-amber-500/60',
    toolLabel: 'text-amber-200',
    toolChevron: 'text-amber-600',
    toolHover: 'hover:bg-amber-950/40',
    toolExpandBg: 'bg-amber-950/20',
    toolExpandBorder: 'border-amber-800/20',
    toolSectionLabel: 'text-amber-500/50',
    toolPreBg: 'bg-black/30',
    toolPreText: 'text-amber-300/60',
    // table
    tableBg: 'bg-zinc-900/80',
    tableBorder: 'border-zinc-800',
    tableHeadBg: 'bg-zinc-800/50',
    tableHeadText: 'text-zinc-500',
    tableHeadBorder: 'border-zinc-800',
    tableCellText: 'text-zinc-400',
    tableCellBorder: 'border-zinc-800/50',
    tableRowEven: 'even:bg-zinc-800/20',
    // input
    inputBg: 'bg-zinc-900',
    inputBorder: 'border-zinc-800',
    inputText: 'text-zinc-200',
    inputPlaceholder: 'placeholder:text-zinc-600',
    sendBg: 'bg-zinc-200',
    sendHover: 'hover:bg-zinc-300',
    sendIcon: 'text-zinc-900',
    // toggle
    toggleBg: 'bg-zinc-800',
    toggleBorder: 'border-zinc-700',
    toggleIcon: 'text-zinc-400',
  },
} as const

type Theme = { [K in keyof typeof themes.light]: string }

// ─── Mock Data ──────────────────────────────────────────────────────
const MOCK_MESSAGES = [
  {
    id: '1',
    role: 'user' as const,
    text: 'Show me all unread emails from this week',
    time: '10:24 AM',
  },
  {
    id: '2',
    role: 'assistant' as const,
    text: 'I found **12 unread emails** from this week. Here are the highlights:\n\n- **3** from clients awaiting responses\n- **5** newsletters\n- **4** internal team updates\n\nWould you like me to organize them by priority?',
    time: '10:24 AM',
    toolCalls: [
      {
        name: 'searchEmails',
        label: 'Searching emails',
        icon: Search,
        input: { query: 'is:unread after:2025/06/09' },
        output: { count: 12, threads: 12 },
        state: 'done' as const,
      },
    ],
  },
  {
    id: '3',
    role: 'user' as const,
    text: 'Yes, prioritize client emails and draft replies',
    time: '10:25 AM',
  },
  {
    id: '4',
    role: 'assistant' as const,
    text: 'I\'ve drafted replies for all 3 client emails. Each draft references the original conversation context. You can review them in your drafts folder.\n\n| Client | Subject | Status |\n|--------|---------|--------|\n| Acme Corp | Q3 Proposal | Draft ready |\n| Globex | Invoice #4521 | Draft ready |\n| Initech | Onboarding | Draft ready |',
    time: '10:26 AM',
    toolCalls: [
      {
        name: 'getRecentEmails',
        label: 'Getting recent emails',
        icon: Mail,
        input: { count: 3 },
        output: { emails: ['...'] },
        state: 'done' as const,
      },
      {
        name: 'draftEmail',
        label: 'Creating drafts',
        icon: Mail,
        input: { to: 'client@acme.com', subject: 'Re: Q3 Proposal' },
        output: { draftId: 'draft_123' },
        state: 'done' as const,
      },
    ],
  },
]

// ─── Tool Call (Minimal Inline Card) ────────────────────────────────
function ToolCallMinimal({
  tool,
  t,
}: {
  tool: {
    name: string
    label: string
    icon: typeof Search
    input: Record<string, unknown>
    output: Record<string, unknown>
    state: string
  }
  t: Theme
}) {
  const [expanded, setExpanded] = useState(false)
  const Icon = tool.icon
  const isDone = tool.state === 'done'

  return (
    <div className={`my-2.5 rounded-lg border ${t.toolBorder} ${t.toolBg} overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-xs ${t.toolHover} transition-colors`}
      >
        {isDone ? (
          <CheckCircle2 className={`h-3.5 w-3.5 ${t.toolCheck} shrink-0`} />
        ) : (
          <Loader2 className={`h-3.5 w-3.5 animate-spin ${t.toolCheck} shrink-0`} />
        )}
        <Icon className={`h-3.5 w-3.5 ${t.toolIcon} shrink-0`} />
        <span className={`font-medium ${t.toolLabel}`}>{tool.label}</span>
        <ChevronRight
          className={`h-3 w-3 ml-auto ${t.toolChevron} transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>
      {expanded && (
        <div className={`border-t ${t.toolExpandBorder} px-3 py-2 space-y-2 ${t.toolExpandBg}`}>
          <div>
            <div className={`text-[10px] font-medium ${t.toolSectionLabel} uppercase tracking-wider mb-1`}>
              Input
            </div>
            <pre className={`text-[11px] ${t.toolPreText} ${t.toolPreBg} rounded p-2 overflow-x-auto`}>
              {JSON.stringify(tool.input, null, 2)}
            </pre>
          </div>
          <div>
            <div className={`text-[10px] font-medium ${t.toolSectionLabel} uppercase tracking-wider mb-1`}>
              Result
            </div>
            <pre className={`text-[11px] ${t.toolPreText} ${t.toolPreBg} rounded p-2 overflow-x-auto`}>
              {JSON.stringify(tool.output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Markdown Renderer (simplified) ─────────────────────────────────
function SimpleMarkdown({ content, t }: { content: string; t: Theme }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let tableRows: string[][] = []
  let tableHeaders: string[] = []
  let inTable = false

  const renderInline = (text: string, key: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={`${key}-${i}`} className={`font-semibold ${t.boldText}`}>
            {part.slice(2, -2)}
          </strong>
        )
      }
      return <span key={`${key}-${i}`}>{part}</span>
    })
  }

  const flushTable = () => {
    if (tableHeaders.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} className={`my-3 overflow-x-auto rounded-lg border ${t.tableBorder} ${t.tableBg}`}>
          <table className="w-full border-collapse text-sm">
            <thead className={t.tableHeadBg}>
              <tr>
                {tableHeaders.map((h, i) => (
                  <th key={i} className={`border-b ${t.tableHeadBorder} px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${t.tableHeadText}`}>
                    {h.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, ri) => (
                <tr key={ri} className={t.tableRowEven}>
                  {row.map((cell, ci) => (
                    <td key={ci} className={`border-b ${t.tableCellBorder} px-3 py-2 text-sm ${t.tableCellText}`}>
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    tableHeaders = []
    tableRows = []
    inTable = false
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').filter(Boolean)
      if (cells.every((c) => c.trim().match(/^-+$/))) {
        inTable = true
        return
      }
      if (!inTable && tableHeaders.length === 0) {
        tableHeaders = cells
        return
      }
      tableRows.push(cells)
      return
    }

    if (inTable) flushTable()

    if (trimmed.startsWith('- ')) {
      elements.push(
        <div key={idx} className="flex items-start gap-2 my-0.5 ml-1">
          <span className={`${t.bulletColor} mt-1.5 text-[8px]`}>&#9679;</span>
          <span className={`text-sm ${t.bodyText} leading-relaxed`}>
            {renderInline(trimmed.slice(2), `li-${idx}`)}
          </span>
        </div>
      )
    } else if (trimmed === '') {
      elements.push(<div key={idx} className="h-1.5" />)
    } else {
      elements.push(
        <p key={idx} className={`text-sm ${t.bodyText} leading-relaxed my-1`}>
          {renderInline(trimmed, `p-${idx}`)}
        </p>
      )
    }
  })

  if (inTable) flushTable()

  return <div>{elements}</div>
}

// ─── Main Component ─────────────────────────────────────────────────
export function StyleAMinimal() {
  const [inputValue, setInputValue] = useState('')
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const t = themes[mode]

  return (
    <div className="flex flex-col h-full" style={{ background: t.pageBg }}>
      {/* Header */}
      <header className={`border-b ${t.headerBorder} px-6 py-4 flex items-center justify-between`} style={{ background: t.pageBg }}>
        <div>
          <h1 className={`text-xl font-semibold ${t.titleColor} tracking-tight`}>
            AI Email Agent
          </h1>
          <p className={`text-sm ${t.subtitleColor} mt-0.5`}>
            Minimal Clean
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${t.toggleBg} ${t.toggleBorder}`}
            title={mode === 'light' ? 'Switch to dark' : 'Switch to light'}
          >
            {mode === 'light' ? (
              <Moon className={`h-3.5 w-3.5 ${t.toggleIcon}`} />
            ) : (
              <Sun className={`h-3.5 w-3.5 ${t.toggleIcon}`} />
            )}
          </button>

          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${t.statusBg} text-xs ${t.statusText}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Online
          </span>
        </div>
      </header>

      {/* Timeline Messages */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Timeline line */}
          <div className="relative">
            <div className={`absolute left-[15px] top-0 bottom-0 w-px ${t.timelineLine}`} />

            {MOCK_MESSAGES.map((msg) => (
              <div key={msg.id} className="relative flex gap-4 mb-6">
                {/* Timeline dot */}
                <div className="relative z-10 shrink-0">
                  <div
                    className={`w-[31px] h-[31px] rounded-full flex items-center justify-center ${
                      msg.role === 'user' ? t.userDotBg : t.agentDotBg
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <span className={`text-xs font-medium ${t.userDotText}`}>
                        You
                      </span>
                    ) : (
                      <Brain className={`h-3.5 w-3.5 ${t.agentDotIcon}`} />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-xs font-medium ${t.labelText}`}>
                      {msg.role === 'user' ? 'You' : 'Agent'}
                    </span>
                    <span className={`text-[10px] ${t.timeText}`}>
                      {msg.time}
                    </span>
                  </div>

                  <div className={`rounded-xl px-4 py-3 ${t.cardBg} border ${t.cardBorder} ${t.cardShadow}`}>
                    {msg.role === 'user' ? (
                      <p className={`text-sm ${t.userText}`}>{msg.text}</p>
                    ) : (
                      <>
                        {'toolCalls' in msg &&
                          msg.toolCalls?.map((tool, i) => (
                            <ToolCallMinimal key={i} tool={tool} t={t} />
                          ))}
                        <SimpleMarkdown content={msg.text} t={t} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className={`border-t ${t.headerBorder} p-4`} style={{ background: t.pageBg }}>
        <div className="max-w-2xl mx-auto">
          <div className={`flex items-center gap-3 ${t.inputBg} border ${t.inputBorder} rounded-xl p-2 ${t.cardShadow}`}>
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask your AI email agent..."
              className={`flex-1 bg-transparent border-0 outline-none text-sm ${t.inputText} ${t.inputPlaceholder} px-2`}
            />
            <button className={`rounded-lg ${t.sendBg} ${t.sendIcon} h-8 w-8 flex items-center justify-center ${t.sendHover} transition-colors shrink-0`}>
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
