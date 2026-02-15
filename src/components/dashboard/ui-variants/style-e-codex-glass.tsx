'use client'

import { useState } from 'react'
import {
  Send,
  Brain,
  ChevronRight,
  Search,
  Mail,
  CheckCircle2,
  Loader2,
  Sun,
  Moon,
} from 'lucide-react'

// ─── Theme tokens ───────────────────────────────────────────────────
const themes = {
  dark: {
    bg: 'linear-gradient(160deg, #111113 0%, #18181b 40%, #141416 100%)',
    glowA: 'radial-gradient(circle, rgba(217,190,140,0.5), transparent 70%)',
    glowAOpacity: '0.07',
    glowB: 'radial-gradient(circle, rgba(161,161,170,0.4), transparent 70%)',
    glowBOpacity: '0.05',
    headerBg: 'rgba(255,255,255,0.02)',
    headerBorder: 'rgba(255,255,255,0.07)',
    iconBoxBg: 'rgba(255,255,255,0.08)',
    iconBoxBorder: 'rgba(255,255,255,0.1)',
    iconColor: 'text-zinc-300',
    titleColor: 'text-white',
    subtitleColor: 'text-zinc-500',
    statusBg: 'rgba(255,255,255,0.05)',
    statusBorder: 'rgba(255,255,255,0.08)',
    statusText: 'text-zinc-400',
    timelineLine: 'rgba(255,255,255,0.08)',
    userDotBg: 'rgba(255,255,255,0.08)',
    userDotBorder: 'rgba(255,255,255,0.1)',
    agentDotBg: 'rgba(255,255,255,0.12)',
    agentDotBorder: 'rgba(255,255,255,0.15)',
    userDotText: 'text-zinc-400',
    agentDotIcon: 'text-zinc-300',
    labelText: 'text-zinc-500',
    timeText: 'text-zinc-600',
    userCardBg: 'rgba(255,255,255,0.05)',
    assistantCardBg: 'rgba(255,255,255,0.03)',
    cardBorder: 'rgba(255,255,255,0.08)',
    userText: 'text-zinc-200',
    bodyText: 'text-zinc-300',
    boldText: 'text-white',
    bulletColor: 'text-amber-400/60',
    // tool call
    toolBg: 'rgba(217,190,140,0.08)',
    toolBorder: 'rgba(217,190,140,0.2)',
    toolCheck: 'text-amber-400',
    toolIcon: 'text-amber-500/60',
    toolLabel: 'text-amber-200',
    toolChevron: 'text-amber-500/40',
    toolExpandBorder: 'rgba(217,190,140,0.12)',
    toolExpandBg: 'rgba(0,0,0,0.15)',
    toolSectionLabel: 'text-amber-400/50',
    toolPreBg: 'rgba(0,0,0,0.2)',
    toolPreText: 'text-amber-200/60',
    toolHover: 'hover:bg-white/[0.04]',
    // table
    tableBg: 'rgba(255,255,255,0.04)',
    tableBorder: 'rgba(255,255,255,0.08)',
    tableHeadBg: 'rgba(255,255,255,0.04)',
    tableHeadBorder: 'rgba(255,255,255,0.08)',
    tableHeadText: 'text-zinc-400',
    tableCellText: 'text-zinc-300',
    tableCellBorder: 'rgba(255,255,255,0.05)',
    // input
    inputBg: 'rgba(255,255,255,0.05)',
    inputBorder: 'rgba(255,255,255,0.08)',
    inputText: 'text-zinc-200',
    inputPlaceholder: 'placeholder:text-zinc-600',
    sendBg: 'rgba(255,255,255,0.12)',
    sendBorder: 'rgba(255,255,255,0.15)',
    sendIcon: 'text-zinc-300',
    // toggle
    toggleBg: 'rgba(255,255,255,0.06)',
    toggleBorder: 'rgba(255,255,255,0.1)',
    toggleIcon: 'text-zinc-400',
  },
  light: {
    bg: 'linear-gradient(160deg, #f8f9fb 0%, #eef0f4 40%, #f3f4f7 100%)',
    glowA: 'radial-gradient(circle, rgba(160,180,220,0.3), transparent 70%)',
    glowAOpacity: '0.15',
    glowB: 'radial-gradient(circle, rgba(200,200,210,0.25), transparent 70%)',
    glowBOpacity: '0.1',
    headerBg: 'rgba(255,255,255,0.7)',
    headerBorder: 'rgba(0,0,0,0.06)',
    iconBoxBg: 'rgba(255,255,255,0.8)',
    iconBoxBorder: 'rgba(0,0,0,0.06)',
    iconColor: 'text-zinc-600',
    titleColor: 'text-zinc-900',
    subtitleColor: 'text-zinc-400',
    statusBg: 'rgba(255,255,255,0.6)',
    statusBorder: 'rgba(0,0,0,0.06)',
    statusText: 'text-zinc-500',
    timelineLine: 'rgba(0,0,0,0.07)',
    userDotBg: 'rgba(255,255,255,0.9)',
    userDotBorder: 'rgba(0,0,0,0.08)',
    agentDotBg: 'rgba(255,255,255,0.95)',
    agentDotBorder: 'rgba(0,0,0,0.1)',
    userDotText: 'text-zinc-500',
    agentDotIcon: 'text-zinc-600',
    labelText: 'text-zinc-400',
    timeText: 'text-zinc-400',
    userCardBg: 'rgba(255,255,255,0.8)',
    assistantCardBg: 'rgba(255,255,255,0.65)',
    cardBorder: 'rgba(0,0,0,0.06)',
    userText: 'text-zinc-800',
    bodyText: 'text-zinc-600',
    boldText: 'text-zinc-900',
    bulletColor: 'text-zinc-400',
    // tool call — clean grey-blue glass
    toolBg: 'rgba(255,255,255,0.6)',
    toolBorder: 'rgba(0,0,0,0.07)',
    toolCheck: 'text-emerald-500',
    toolIcon: 'text-zinc-400',
    toolLabel: 'text-zinc-700',
    toolChevron: 'text-zinc-400',
    toolExpandBorder: 'rgba(0,0,0,0.06)',
    toolExpandBg: 'rgba(255,255,255,0.5)',
    toolSectionLabel: 'text-zinc-400',
    toolPreBg: 'rgba(255,255,255,0.7)',
    toolPreText: 'text-zinc-500',
    toolHover: 'hover:bg-white/60',
    // table
    tableBg: 'rgba(255,255,255,0.7)',
    tableBorder: 'rgba(0,0,0,0.06)',
    tableHeadBg: 'rgba(0,0,0,0.02)',
    tableHeadBorder: 'rgba(0,0,0,0.06)',
    tableHeadText: 'text-zinc-400',
    tableCellText: 'text-zinc-600',
    tableCellBorder: 'rgba(0,0,0,0.04)',
    // input
    inputBg: 'rgba(255,255,255,0.75)',
    inputBorder: 'rgba(0,0,0,0.07)',
    inputText: 'text-zinc-800',
    inputPlaceholder: 'placeholder:text-zinc-400',
    sendBg: 'rgba(255,255,255,0.9)',
    sendBorder: 'rgba(0,0,0,0.08)',
    sendIcon: 'text-zinc-600',
    // toggle
    toggleBg: 'rgba(255,255,255,0.7)',
    toggleBorder: 'rgba(0,0,0,0.08)',
    toggleIcon: 'text-zinc-500',
  },
} as const

type Theme = { [K in keyof typeof themes.dark]: string }

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

// ─── Tool Call (Glassy Amber Card) ──────────────────────────────────
function ToolCallGlassMinimal({
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
    <div
      className="my-2.5 rounded-xl overflow-hidden"
      style={{
        background: t.toolBg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${t.toolBorder}`,
      }}
    >
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
        <div
          className="px-3 py-2 space-y-2"
          style={{
            borderTop: `1px solid ${t.toolExpandBorder}`,
            background: t.toolExpandBg,
          }}
        >
          <div>
            <div className={`text-[10px] font-medium ${t.toolSectionLabel} uppercase tracking-wider mb-1`}>
              Input
            </div>
            <pre
              className={`text-[11px] ${t.toolPreText} rounded-lg p-2 overflow-x-auto`}
              style={{ background: t.toolPreBg }}
            >
              {JSON.stringify(tool.input, null, 2)}
            </pre>
          </div>
          <div>
            <div className={`text-[10px] font-medium ${t.toolSectionLabel} uppercase tracking-wider mb-1`}>
              Result
            </div>
            <pre
              className={`text-[11px] ${t.toolPreText} rounded-lg p-2 overflow-x-auto`}
              style={{ background: t.toolPreBg }}
            >
              {JSON.stringify(tool.output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Markdown Renderer ──────────────────────────────────────────────
function GlassMinimalMarkdown({ content, t }: { content: string; t: Theme }) {
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
        <div
          key={`table-${elements.length}`}
          className="my-3 overflow-x-auto rounded-xl"
          style={{
            background: t.tableBg,
            border: `1px solid ${t.tableBorder}`,
          }}
        >
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={{ background: t.tableHeadBg }}>
                {tableHeaders.map((h, i) => (
                  <th
                    key={i}
                    className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${t.tableHeadText}`}
                    style={{ borderBottom: `1px solid ${t.tableHeadBorder}` }}
                  >
                    {h.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`px-3 py-2 text-sm ${t.tableCellText}`}
                      style={{ borderBottom: `1px solid ${t.tableCellBorder}` }}
                    >
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
export function StyleECodexGlass() {
  const [inputValue, setInputValue] = useState('')
  const [mode, setMode] = useState<'dark' | 'light'>('dark')
  const t = themes[mode]

  return (
    <div
      className="flex flex-col h-full relative overflow-hidden"
      style={{ background: t.bg }}
    >
      {/* Subtle background glows — warm neutral, no purple */}
      <div
        className="absolute top-[-15%] right-[10%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: t.glowA,
          opacity: t.glowAOpacity,
        }}
      />
      <div
        className="absolute bottom-[-20%] left-[5%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: t.glowB,
          opacity: t.glowBOpacity,
        }}
      />

      {/* Header */}
      <header
        className="relative z-10 px-6 py-4 flex items-center justify-between"
        style={{
          borderBottom: `1px solid ${t.headerBorder}`,
          background: t.headerBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: t.iconBoxBg,
              border: `1px solid ${t.iconBoxBorder}`,
            }}
          >
            <Brain className={`h-4.5 w-4.5 ${t.iconColor}`} />
          </div>
          <div>
            <h1 className={`text-lg font-semibold ${t.titleColor} tracking-tight`}>
              AI Email Agent
            </h1>
            <p className={`text-xs ${t.subtitleColor}`}>Codex Glass</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{
              background: t.toggleBg,
              border: `1px solid ${t.toggleBorder}`,
            }}
            title={mode === 'dark' ? 'Switch to light' : 'Switch to dark'}
          >
            {mode === 'dark' ? (
              <Sun className={`h-3.5 w-3.5 ${t.toggleIcon}`} />
            ) : (
              <Moon className={`h-3.5 w-3.5 ${t.toggleIcon}`} />
            )}
          </button>

          {/* Status pill */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: t.statusBg,
              border: `1px solid ${t.statusBorder}`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className={`text-xs ${t.statusText} font-medium`}>Online</span>
          </div>
        </div>
      </header>

      {/* Timeline Messages */}
      <div className="relative z-10 flex-1 overflow-auto px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div
              className="absolute left-[15px] top-0 bottom-0 w-px"
              style={{ background: t.timelineLine }}
            />

            {MOCK_MESSAGES.map((msg) => (
              <div key={msg.id} className="relative flex gap-4 mb-6">
                {/* Timeline dot */}
                <div className="relative z-10 shrink-0">
                  <div
                    className="w-[31px] h-[31px] rounded-full flex items-center justify-center"
                    style={
                      msg.role === 'user'
                        ? { background: t.userDotBg, border: `1px solid ${t.userDotBorder}` }
                        : { background: t.agentDotBg, border: `1px solid ${t.agentDotBorder}` }
                    }
                  >
                    {msg.role === 'user' ? (
                      <span className={`text-xs font-medium ${t.userDotText}`}>You</span>
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
                    <span className={`text-[10px] ${t.timeText}`}>{msg.time}</span>
                  </div>

                  <div
                    className="rounded-xl px-4 py-3"
                    style={{
                      background: msg.role === 'user' ? t.userCardBg : t.assistantCardBg,
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: `1px solid ${t.cardBorder}`,
                    }}
                  >
                    {msg.role === 'user' ? (
                      <p className={`text-sm ${t.userText}`}>{msg.text}</p>
                    ) : (
                      <>
                        {'toolCalls' in msg &&
                          msg.toolCalls?.map((tool, i) => (
                            <ToolCallGlassMinimal key={i} tool={tool} t={t} />
                          ))}
                        <GlassMinimalMarkdown content={msg.text} t={t} />
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
      <div
        className="relative z-10 p-4"
        style={{
          borderTop: `1px solid ${t.headerBorder}`,
          background: t.headerBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="max-w-2xl mx-auto">
          <div
            className="flex items-center gap-3 rounded-xl p-2"
            style={{
              background: t.inputBg,
              border: `1px solid ${t.inputBorder}`,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask your AI email agent..."
              className={`flex-1 bg-transparent border-0 outline-none text-sm ${t.inputText} ${t.inputPlaceholder} px-2`}
            />
            <button
              className="rounded-lg h-8 w-8 flex items-center justify-center hover:opacity-80 transition-opacity shrink-0"
              style={{
                background: t.sendBg,
                border: `1px solid ${t.sendBorder}`,
              }}
            >
              <Send className={`h-4 w-4 ${t.sendIcon}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
