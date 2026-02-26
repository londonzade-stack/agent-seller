'use client'

import { useState, useEffect, type ReactNode } from 'react'
import {
  Search,
  Mail,
  Archive,
  Tag,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Send,
  Sparkles,
  X,
  Wrench,
  Trash2,
  Shield,
  AlertCircle,
  Star,
  Repeat2,
  Clock,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MOCK_CONVERSATIONS, type MockToolCall, type MockMessage, type MockApproval } from './data'

// ─── Icon map for tool calls ────────────────────────────────────────
const TOOL_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  searchEmails: Search,
  getEmailThread: Mail,
  getRecentEmails: Mail,
  draftEmail: Mail,
  sendEmail: Send,
  archiveEmails: Archive,
  trashEmails: Trash2,
  applyLabels: Tag,
  createLabel: Tag,
  getInboxStats: BarChart3,
  findUnsubscribableEmails: Search,
  bulkUnsubscribe: Mail,
  createRecurringTask: RotateCcw,
}

// ─── Approval action → icon map ─────────────────────────────────────
function getApprovalIcon(action: string) {
  const lower = action.toLowerCase()
  if (lower.includes('trash') || lower.includes('delete')) return Trash2
  if (lower.includes('archive')) return Archive
  if (lower.includes('send')) return Send
  if (lower.includes('unsubscribe')) return Mail
  if (lower.includes('spam')) return Shield
  if (lower.includes('label')) return Tag
  if (lower.includes('star')) return Star
  return AlertCircle
}

// ─── MockApprovalCard — mirrors the real ApprovalCard ───────────────
function MockApprovalCard({ approval }: { approval: MockApproval }) {
  const ActionIcon = getApprovalIcon(approval.action)

  return (
    <div className="my-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-stone-100 dark:border-zinc-800">
        <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
          <ActionIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <span className="text-sm font-semibold text-stone-800 dark:text-zinc-200">Approval Required</span>
      </div>

      <div className="px-4 py-3 space-y-3">
        <p className="text-sm text-stone-600 dark:text-zinc-300">{approval.description}</p>

        {approval.details.length > 0 && (
          <div>
            <p className="text-xs font-medium text-stone-400 dark:text-zinc-500 mb-1.5">Details</p>
            <div className="flex flex-wrap gap-1.5">
              {approval.details.map((item, i) => (
                <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md bg-stone-100 dark:bg-zinc-800 text-xs text-stone-600 dark:text-zinc-400 border border-stone-200/60 dark:border-zinc-700/60">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-stone-100 dark:border-zinc-800">
        <div className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium ${
          approval.responded === 'approved'
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
            : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800/40'
        }`}>
          {approval.responded === 'approved' ? (
            <><CheckCircle2 className="h-4 w-4" /> Approved</>
          ) : (
            <><X className="h-4 w-4" /> Denied</>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── SimpleMarkdown — adapted from style-a-minimal.tsx ──────────────
function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: ReactNode[] = []
  let tableRows: string[][] = []
  let tableHeaders: string[] = []
  let inTable = false

  const renderInline = (text: string, key: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={`${key}-${i}`} className="font-semibold text-stone-900 dark:text-white">
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
        <div key={`table-${elements.length}`} className="my-3 overflow-x-auto rounded-lg border border-stone-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-stone-50 dark:bg-zinc-800/50">
              <tr>
                {tableHeaders.map((h, i) => (
                  <th key={i} className="border-b border-stone-200 dark:border-zinc-800 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-500">
                    {h.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, ri) => (
                <tr key={ri} className="even:bg-stone-50/50 dark:even:bg-zinc-800/20">
                  {row.map((cell, ci) => (
                    <td key={ci} className="border-b border-stone-100 dark:border-zinc-800/50 px-3 py-2 text-sm text-stone-700 dark:text-zinc-400">
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
          <span className="text-amber-400 dark:text-amber-500 mt-1.5 text-[8px]">&#9679;</span>
          <span className="text-sm text-stone-700 dark:text-zinc-300 leading-relaxed">
            {renderInline(trimmed.slice(2), `li-${idx}`)}
          </span>
        </div>
      )
      return
    }

    if (trimmed === '') {
      elements.push(<div key={idx} className="h-2" />)
      return
    }

    elements.push(
      <p key={idx} className="text-sm text-stone-700 dark:text-zinc-300 leading-relaxed">
        {renderInline(trimmed, `p-${idx}`)}
      </p>
    )
  })

  if (inTable) flushTable()

  return <div className="space-y-1">{elements}</div>
}

// ─── MockToolCallBlock ──────────────────────────────────────────────
function MockToolCallBlock({
  tool,
  isExpanded,
  onToggle,
}: {
  tool: MockToolCall
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="my-2">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-sm text-foreground hover:text-foreground/80 transition-colors cursor-pointer"
      >
        <span>Agent used 1 tool</span>
        <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {isExpanded && (
        <div className="mt-1.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background pl-1 pr-3 py-1 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
            <span className="text-xs italic text-muted-foreground truncate">
              {tool.label} — {tool.inputSummary}
            </span>
            <CheckCircle2 className="h-3.5 w-3.5 text-foreground shrink-0" />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MockAutomationsPanel — visual embed of the automations dashboard ─
const MOCK_AUTOMATIONS_DATA = [
  {
    title: 'Weekly Promotions Archive',
    type: 'Archive emails',
    schedule: 'Weekly on Sundays at 9:00 AM',
    icon: Archive,
    nextRun: 'in 4d',
  },
  {
    title: 'Daily Inbox Stats',
    type: 'Inbox statistics',
    schedule: 'Daily at 8:00 AM',
    icon: BarChart3,
    nextRun: 'in 14h',
  },
  {
    title: 'Monthly Unsubscribe Sweep',
    type: 'Unsubscribe sweep',
    schedule: 'Monthly on the 1st at 9:00 AM',
    icon: Mail,
    nextRun: 'Mar 1',
  },
]

function MockAutomationsPanel() {
  return (
    <div className="mt-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-[#faf8f5] dark:bg-[#111113] overflow-hidden shadow-sm">
      {/* Panel header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-stone-200 dark:border-zinc-800">
        <Repeat2 className="h-4 w-4 text-amber-500" />
        <span className="text-xs font-semibold text-stone-800 dark:text-zinc-200">Automations</span>
        <span className="text-[10px] text-stone-400 dark:text-zinc-600 ml-1">3 active</span>
      </div>

      {/* Automation rows */}
      <div className="divide-y divide-stone-100 dark:divide-zinc-800/50">
        {MOCK_AUTOMATIONS_DATA.map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-800/20 shrink-0">
                <Icon className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-stone-800 dark:text-zinc-200 truncate">{item.title}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-green-300 dark:border-green-800 text-green-600 dark:text-green-400 font-medium leading-none">Active</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">
                  <span>{item.type}</span>
                  <span className="text-stone-300 dark:text-zinc-700">&middot;</span>
                  <span>{item.schedule}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-stone-400 dark:text-zinc-600 mt-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  <span>Next: {item.nextRun}</span>
                </div>
              </div>
              {/* Toggle */}
              <div className="relative inline-flex h-4 w-7 items-center rounded-full bg-amber-500 shrink-0">
                <span className="inline-block h-3 w-3 rounded-full bg-white translate-x-3.5" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── MockMessageBubble ──────────────────────────────────────────────
function MockMessageBubble({
  message,
  conversationId,
  expandedTools,
  onToolToggle,
}: {
  message: MockMessage
  conversationId: string
  expandedTools: Set<string>
  onToolToggle: (key: string) => void
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 bg-foreground text-background shadow-sm text-sm">
          {message.text}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] sm:max-w-[85%] text-[15px] leading-[1.75] text-foreground/90">
        {message.toolCalls?.map((tool, i) => {
          const toolKey = `${conversationId}-${message.id}-${i}`
          return (
            <MockToolCallBlock
              key={toolKey}
              tool={tool}
              isExpanded={expandedTools.has(toolKey)}
              onToggle={() => onToolToggle(toolKey)}
            />
          )
        })}
        <SimpleMarkdown content={message.text} />
        {message.approval && <MockApprovalCard approval={message.approval} />}
        {message.embed === 'automations-panel' && <MockAutomationsPanel />}
      </div>
    </div>
  )
}

// ─── Core MockConversation ──────────────────────────────────────────
function MockConversation({
  variant,
  onPromptSelect,
}: {
  variant: 'homepage' | 'chat-dropdown'
  onPromptSelect?: (prompt: string) => void
}) {
  const [activeId, setActiveId] = useState(MOCK_CONVERSATIONS[0].id)
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())

  const activeConversation = MOCK_CONVERSATIONS.find((c) => c.id === activeId) || MOCK_CONVERSATIONS[0]

  const handleToolToggle = (key: string) => {
    setExpandedTools((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (variant === 'homepage') {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/30 overflow-hidden">
        {/* Header */}
        <div className="border-b border-zinc-200 dark:border-white/10 px-5 py-3 flex items-center gap-3">
          <span className="font-mono font-bold text-stone-800 dark:text-zinc-200 text-sm">Agent</span>
          <span className="text-xs text-zinc-400 dark:text-zinc-600">AI Email Agent</span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-zinc-500 dark:text-zinc-600">Live demo</span>
          </div>
        </div>

        {/* Conversation tabs */}
        <div className="border-b border-zinc-200 dark:border-white/10 px-4 py-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {MOCK_CONVERSATIONS.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveId(conv.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeId === conv.id
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
                  : 'bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-700'
              }`}
            >
              {conv.title}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div
          key={activeId}
          className="h-80 sm:h-96 overflow-y-auto px-4 py-4 pb-8 space-y-4 bg-[#faf8f5] dark:bg-[#111113] animate-in fade-in duration-200"
        >
          {activeConversation.messages.map((msg) => (
            <MockMessageBubble
              key={msg.id}
              message={msg}
              conversationId={activeId}
              expandedTools={expandedTools}
              onToolToggle={handleToolToggle}
            />
          ))}
        </div>

        {/* Static input */}
        <div className="border-t border-zinc-200 dark:border-white/10 px-4 py-3 bg-[#faf8f5] dark:bg-[#111113]">
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-black/20 dark:border-white/15 rounded-md px-3 py-2">
            <span className="flex-1 text-[13px] text-muted-foreground italic truncate">
              Try: &ldquo;{activeConversation.promptText}&rdquo;
            </span>
            <div className="rounded-md bg-foreground h-7 w-7 flex items-center justify-center opacity-50 shrink-0">
              <Send className="h-3.5 w-3.5 text-background" />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/70 text-center mt-1.5">Agent can make mistakes. Please double check responses.</p>
        </div>
      </div>
    )
  }

  // ─── Chat dropdown variant ──────────────────────────────────────
  // Use a fixed height so overflow scrolling works inside the dropdown.
  // calc(60vh - 60px) accounts for the dropdown header.
  const dropdownBodyHeight = 'calc(60vh - 60px)'

  return (
    <div className="flex flex-col sm:flex-row" style={{ height: dropdownBodyHeight }}>
      {/* Mobile: horizontal pills */}
      <div className="sm:hidden shrink-0 border-b border-stone-200 dark:border-zinc-800 px-3 py-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {MOCK_CONVERSATIONS.map((conv) => (
          <button
            key={conv.id}
            onClick={() => setActiveId(conv.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeId === conv.id
                ? 'bg-stone-900 dark:bg-white text-white dark:text-black'
                : 'bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300'
            }`}
          >
            {conv.title}
          </button>
        ))}
      </div>

      {/* Desktop: sidebar */}
      <div className="hidden sm:flex flex-col w-44 shrink-0 border-r border-stone-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {MOCK_CONVERSATIONS.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveId(conv.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                activeId === conv.id
                  ? 'bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-white'
                  : 'hover:bg-stone-50 dark:hover:bg-zinc-800/50 text-stone-600 dark:text-zinc-400'
              }`}
            >
              <div className="text-xs font-medium leading-tight">{conv.title}</div>
              <div className="text-[10px] text-stone-400 dark:text-zinc-600 mt-0.5 line-clamp-2">{conv.description}</div>
            </button>
          ))}
        </div>
        {onPromptSelect && (
          <div className="shrink-0 p-3 border-t border-stone-200 dark:border-zinc-800">
            <button
              onClick={() => onPromptSelect(activeConversation.promptText)}
              className="w-full text-center text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Try this prompt
            </button>
          </div>
        )}
      </div>

      {/* Messages — scrollable area with contained scroll */}
      <div
        key={activeId}
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-6 space-y-3 animate-in fade-in duration-200"
      >
        {activeConversation.messages.map((msg) => (
          <MockMessageBubble
            key={msg.id}
            message={msg}
            conversationId={activeId}
            expandedTools={expandedTools}
            onToolToggle={handleToolToggle}
          />
        ))}
      </div>

      {/* Mobile: try prompt button */}
      {onPromptSelect && (
        <div className="sm:hidden shrink-0 border-t border-stone-200 dark:border-zinc-800 p-3">
          <button
            onClick={() => onPromptSelect(activeConversation.promptText)}
            className="w-full text-center text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
          >
            Try this prompt
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Skeleton for loading state ─────────────────────────────────────
function MockConversationSkeleton() {
  return (
    <div className="flex h-full min-h-[400px]">
      <div className="hidden sm:block w-44 border-r border-stone-200 dark:border-zinc-800 p-3 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-3 bg-stone-200 dark:bg-zinc-700 rounded w-24 mb-1" />
            <div className="h-2 bg-stone-100 dark:bg-zinc-800 rounded w-32" />
          </div>
        ))}
      </div>
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className={`h-10 rounded-xl ${i % 2 === 0 ? 'bg-stone-200 dark:bg-zinc-700 w-3/5 ml-auto' : 'bg-stone-100 dark:bg-zinc-800 w-4/5'}`} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Homepage export ────────────────────────────────────────────────
export function MockConversationDemo() {
  return <MockConversation variant="homepage" />
}

// ─── Chat dropdown export (replaces TipsDropdown) ───────────────────
export function MockConversationDropdown({
  isOpen,
  onClose,
  onPromptSelect,
}: {
  isOpen: boolean
  onClose: () => void
  onPromptSelect?: (prompt: string) => void
}) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowContent(false)
      const timer = setTimeout(() => setShowContent(true), 200)
      return () => clearTimeout(timer)
    }
    setShowContent(false)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed inset-3 z-50 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[600px] max-h-[90vh] sm:max-h-[70vh] overflow-hidden flex flex-col rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sm:bg-white/95 sm:dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
        {/* Header — pinned */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-stone-200 dark:border-zinc-800 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            </div>
            <h3 className="font-semibold text-base sm:text-lg">See What Agent Can Do</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body — fills remaining space, clipped */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {!showContent ? (
            <MockConversationSkeleton />
          ) : (
            <MockConversation variant="chat-dropdown" onPromptSelect={onPromptSelect} />
          )}
        </div>
      </div>
    </>
  )
}
