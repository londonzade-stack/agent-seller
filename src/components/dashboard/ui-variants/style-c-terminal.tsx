'use client'

import { useState } from 'react'
import {
  Send,
  ChevronRight,
  Search,
  Mail,
  CheckCircle2,
  BarChart3,
  Loader2,
  Tag,
  Terminal,
  Circle,
} from 'lucide-react'

// ─── Mock Data ──────────────────────────────────────────────────────
const MOCK_MESSAGES = [
  {
    id: '1',
    role: 'user' as const,
    text: 'Find all emails from clients with attachments this month',
    time: '14:31:22',
  },
  {
    id: '2',
    role: 'assistant' as const,
    text: 'Found **8 emails** from clients with attachments this month.\n\nBreakdown by type:\n- **PDF** contracts: 3\n- **XLSX** spreadsheets: 2\n- **PNG/JPG** images: 3\n\nTotal attachment size: **24.7 MB**',
    time: '14:31:25',
    toolCalls: [
      {
        name: 'searchEmails',
        label: 'search_emails',
        icon: Search,
        input: { query: 'has:attachment from:clients newer_than:30d' },
        output: { results: 8, totalSize: '24.7MB' },
        state: 'done' as const,
      },
    ],
  },
  {
    id: '3',
    role: 'user' as const,
    text: 'Create a label called "Client Attachments" and move them there',
    time: '14:32:01',
  },
  {
    id: '4',
    role: 'assistant' as const,
    text: 'Label created and emails organized. All 8 client attachment emails are now in the "Client Attachments" label.',
    time: '14:32:04',
    toolCalls: [
      {
        name: 'createLabel',
        label: 'create_label',
        icon: Tag,
        input: { name: 'Client Attachments' },
        output: { labelId: 'Label_892', name: 'Client Attachments' },
        state: 'done' as const,
      },
      {
        name: 'applyLabels',
        label: 'apply_labels',
        icon: Tag,
        input: { labelId: 'Label_892', emailIds: ['...8 emails'] },
        output: { applied: 8 },
        state: 'done' as const,
      },
    ],
  },
  {
    id: '5',
    role: 'user' as const,
    text: 'Now get my inbox stats',
    time: '14:33:15',
  },
  {
    id: '6',
    role: 'assistant' as const,
    text: '```\n INBOX SUMMARY\n ─────────────────────────────\n Total      : 234 emails\n Unread     : 18\n Starred    : 7\n Drafts     : 3\n Labels     : 12 (1 new)\n Avg/day    : 33.4 emails\n Top sender : sarah@acme.co (14)\n```',
    time: '14:33:18',
    toolCalls: [
      {
        name: 'getInboxStats',
        label: 'get_inbox_stats',
        icon: BarChart3,
        input: { timeframe: '7d' },
        output: { total: 234, unread: 18, starred: 7 },
        state: 'done' as const,
      },
    ],
  },
]

// ─── Tool Call (Command Block) ──────────────────────────────────────
function ToolCallCommand({
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
  const isDone = tool.state === 'done'

  return (
    <div className="my-2 rounded border border-cyan-900/40 bg-[#0c1117] overflow-hidden font-mono">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-cyan-900/10 transition-colors"
      >
        {isDone ? (
          <Circle className="h-2.5 w-2.5 fill-emerald-400 text-emerald-400 shrink-0" />
        ) : (
          <Loader2 className="h-3 w-3 animate-spin text-cyan-400 shrink-0" />
        )}
        <span className="text-cyan-600">$</span>
        <span className="text-cyan-300">{tool.label}</span>
        <span className="text-zinc-600 truncate">
          {Object.entries(tool.input)
            .map(([k, v]) => `--${k}="${typeof v === 'string' ? v : JSON.stringify(v)}"`)
            .join(' ')}
        </span>
        {isDone && (
          <span className="ml-auto text-[10px] text-emerald-500/60">
            exit 0
          </span>
        )}
        <ChevronRight
          className={`h-3 w-3 text-zinc-600 transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`}
        />
      </button>
      {expanded && (
        <div className="border-t border-cyan-900/30 px-3 py-2 space-y-2">
          <div>
            <span className="text-[10px] text-cyan-700 font-semibold">
              {'// input'}
            </span>
            <pre className="text-[11px] text-emerald-300/70 mt-0.5 overflow-x-auto">
              {JSON.stringify(tool.input, null, 2)}
            </pre>
          </div>
          <div>
            <span className="text-[10px] text-cyan-700 font-semibold">
              {'// output'}
            </span>
            <pre className="text-[11px] text-zinc-400 mt-0.5 overflow-x-auto">
              {JSON.stringify(tool.output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Simple Markdown ────────────────────────────────────────────────
function TerminalMarkdown({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeLines: string[] = []

  const renderInline = (text: string, key: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={`${key}-${i}`} className="font-bold text-cyan-300">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return <span key={`${key}-${i}`}>{part}</span>
    })
  }

  const flushCode = () => {
    if (codeLines.length > 0) {
      elements.push(
        <pre
          key={`code-${elements.length}`}
          className="my-2 bg-[#0c1117] border border-cyan-900/30 rounded p-3 text-xs text-emerald-300/80 overflow-x-auto font-mono"
        >
          {codeLines.join('\n')}
        </pre>
      )
      codeLines = []
    }
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCode()
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      return
    }

    if (inCodeBlock) {
      codeLines.push(line)
      return
    }

    if (trimmed.startsWith('- ')) {
      elements.push(
        <div key={idx} className="flex items-start gap-2 my-0.5">
          <span className="text-cyan-600 mt-0.5">-</span>
          <span className="text-sm text-zinc-300">
            {renderInline(trimmed.slice(2), `li-${idx}`)}
          </span>
        </div>
      )
    } else if (trimmed === '') {
      elements.push(<div key={idx} className="h-1" />)
    } else {
      elements.push(
        <p key={idx} className="text-sm text-zinc-300 leading-relaxed my-0.5">
          {renderInline(trimmed, `p-${idx}`)}
        </p>
      )
    }
  })

  if (inCodeBlock) flushCode()

  return <div>{elements}</div>
}

// ─── Main Component ─────────────────────────────────────────────────
export function StyleCTerminal() {
  const [inputValue, setInputValue] = useState('')

  return (
    <div className="flex flex-col h-full bg-[#080b10] font-mono">
      {/* Header — Terminal Tab Bar Style */}
      <header className="border-b border-cyan-900/30 px-4 py-3 flex items-center gap-3">
        {/* Traffic light dots */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>
        <div className="flex items-center gap-2 ml-3">
          <Terminal className="h-4 w-4 text-cyan-500" />
          <span className="text-sm text-zinc-400">
            agent-seller
          </span>
          <span className="text-zinc-700">~</span>
          <span className="text-sm text-cyan-400 font-medium">
            email-agent
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" />
          <span className="text-[10px] text-emerald-400/70">LIVE</span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Session start marker */}
          <div className="flex items-center gap-2 text-[10px] text-zinc-700">
            <div className="flex-1 border-t border-zinc-800" />
            <span>session started at 14:31:00</span>
            <div className="flex-1 border-t border-zinc-800" />
          </div>

          {MOCK_MESSAGES.map((msg) => (
            <div key={msg.id} className="space-y-1">
              {/* Timestamp + role prefix */}
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-zinc-700">[{msg.time}]</span>
                <span
                  className={
                    msg.role === 'user' ? 'text-amber-500' : 'text-cyan-500'
                  }
                >
                  {msg.role === 'user' ? 'user' : 'agent'}
                </span>
              </div>

              {/* Content */}
              <div
                className={`pl-4 border-l-2 ${
                  msg.role === 'user'
                    ? 'border-amber-500/30'
                    : 'border-cyan-500/30'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="text-sm text-zinc-200">{msg.text}</p>
                ) : (
                  <>
                    {msg.toolCalls?.map((tool, i) => (
                      <ToolCallCommand key={i} tool={tool} />
                    ))}
                    <TerminalMarkdown content={msg.text} />
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Cursor blink */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-cyan-600">$</span>
            <span className="w-2 h-4 bg-cyan-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-cyan-900/30 p-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 bg-[#0c1117] border border-cyan-900/30 rounded-lg p-2">
            <span className="text-cyan-600 text-sm pl-1">$</span>
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="enter command..."
              className="flex-1 bg-transparent border-0 outline-none text-sm text-zinc-200 placeholder:text-zinc-700 font-mono"
            />
            <button className="rounded-md bg-cyan-600 text-white h-7 w-7 flex items-center justify-center hover:bg-cyan-500 transition-colors shrink-0">
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
