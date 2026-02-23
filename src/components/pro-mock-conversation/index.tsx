'use client'

import { useState, useEffect, type ReactNode } from 'react'
import {
  Search,
  Mail,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Send,
  User as UserIcon,
  Sparkles,
  X,
  Wrench,
  Users,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BlitzAvatar } from '@/components/blitz-avatar'
import { PRO_MOCK_CONVERSATIONS, type ProMockToolCall, type ProMockMessage, type ProMockApproval } from './data'

// ─── Icon map for pro tool calls ────────────────────────────────────
const PRO_TOOL_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  findCompanies: Users,
  researchCompany: Search,
  webSearch: Globe,
  draftEmail: Mail,
  sendEmail: Send,
  searchEmails: Search,
  getInboxStats: BarChart3,
}

// ─── Approval action → icon map ─────────────────────────────────────
function getApprovalIcon(action: string) {
  const lower = action.toLowerCase()
  if (lower.includes('send')) return Send
  if (lower.includes('research')) return Search
  return Globe
}

// ─── ProMockApprovalCard — blue-themed approval card ────────────────
function ProMockApprovalCard({ approval }: { approval: ProMockApproval }) {
  const ActionIcon = getApprovalIcon(approval.action)

  return (
    <div className="my-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-stone-100 dark:border-zinc-800">
        <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
          <ActionIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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

// ─── SimpleMarkdown — renders bold, bullets, tables ─────────────────
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
          <span className="text-blue-400 dark:text-blue-500 mt-1.5 text-[8px]">&#9679;</span>
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

// ─── ProMockToolCallBlock — blue-themed tool calls ──────────────────
function ProMockToolCallBlock({
  tool,
  isExpanded,
  onToggle,
}: {
  tool: ProMockToolCall
  isExpanded: boolean
  onToggle: () => void
}) {
  const Icon = PRO_TOOL_ICON_MAP[tool.name] || Wrench

  return (
    <div className="my-2 rounded-lg border overflow-hidden border-blue-200/60 dark:border-blue-800/30 bg-blue-50/40 dark:bg-blue-950/15">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-colors"
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <Icon className="h-3.5 w-3.5 text-blue-700/60 dark:text-blue-500/60 shrink-0" />
        <span className="font-medium text-blue-900 dark:text-blue-200">{tool.label}</span>
        <span className="text-blue-700/50 dark:text-blue-400/50 truncate max-w-[120px] sm:max-w-[250px]">
          — {tool.inputSummary}
        </span>
        <ChevronRight className={`h-3 w-3 ml-auto text-blue-400 dark:text-blue-600 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {isExpanded && (
        <div className="border-t border-blue-200/60 dark:border-blue-800/20 px-3 py-2 space-y-2 bg-blue-50/20 dark:bg-blue-950/10">
          <div>
            <div className="text-[10px] font-medium text-blue-700/60 dark:text-blue-500/50 uppercase tracking-wider mb-1">What it&apos;s doing</div>
            <div className="text-[11px] text-blue-800/70 dark:text-blue-300/60 bg-white/60 dark:bg-black/30 rounded p-2">
              {tool.inputSummary}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-blue-700/60 dark:text-blue-500/50 uppercase tracking-wider mb-1">Result</div>
            <div className="text-[11px] text-blue-800/70 dark:text-blue-300/60 bg-white/60 dark:bg-black/30 rounded p-2">
              {tool.outputSummary}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ProMockMessageBubble ───────────────────────────────────────────
function ProMockMessageBubble({
  message,
  conversationId,
  expandedTools,
  onToolToggle,
}: {
  message: ProMockMessage
  conversationId: string
  expandedTools: Set<string>
  onToolToggle: (key: string) => void
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[85%] rounded-xl px-3 py-2 bg-stone-800 dark:bg-zinc-200 text-white dark:text-zinc-900 text-sm">
          {message.text}
        </div>
        <div className="w-7 h-7 rounded-lg bg-stone-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
          <UserIcon className="h-3.5 w-3.5 text-stone-600 dark:text-zinc-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start gap-2">
      <div className="shrink-0">
        <BlitzAvatar size="sm" variant="blue" />
      </div>
      <div className="max-w-[85%] rounded-xl px-3 py-2 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
        {message.toolCalls?.map((tool, i) => {
          const toolKey = `${conversationId}-${message.id}-${i}`
          return (
            <ProMockToolCallBlock
              key={toolKey}
              tool={tool}
              isExpanded={expandedTools.has(toolKey)}
              onToggle={() => onToolToggle(toolKey)}
            />
          )
        })}
        <SimpleMarkdown content={message.text} />
        {message.approval && <ProMockApprovalCard approval={message.approval} />}
      </div>
    </div>
  )
}

// ─── Core ProMockConversation ───────────────────────────────────────
function ProMockConversation({
  variant,
  onPromptSelect,
}: {
  variant: 'homepage' | 'chat-dropdown'
  onPromptSelect?: (prompt: string) => void
}) {
  const [activeId, setActiveId] = useState(PRO_MOCK_CONVERSATIONS[0].id)
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())

  const activeConversation = PRO_MOCK_CONVERSATIONS.find((c) => c.id === activeId) || PRO_MOCK_CONVERSATIONS[0]

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
        {/* Header — blue-themed */}
        <div className="border-b border-zinc-200 dark:border-white/10 px-5 py-3 flex items-center gap-3">
          <BlitzAvatar size="sm" variant="blue" />
          <span className="font-mono font-bold text-blue-500 text-sm">BLITZ</span>
          <span className="text-xs text-zinc-400 dark:text-zinc-600">Sales Outreach Agent</span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400">PRO</span>
          </div>
        </div>

        {/* Conversation tabs */}
        <div className="border-b border-zinc-200 dark:border-white/10 px-4 py-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {PRO_MOCK_CONVERSATIONS.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveId(conv.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeId === conv.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-zinc-700'
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
            <ProMockMessageBubble
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
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl px-3 py-2">
            <span className="flex-1 text-sm text-stone-400 dark:text-zinc-600 italic truncate">
              Try: &ldquo;{activeConversation.promptText}&rdquo;
            </span>
            <div className="rounded-lg bg-blue-500 h-7 w-7 flex items-center justify-center opacity-50 shrink-0">
              <Send className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Chat dropdown variant ──────────────────────────────────────
  const dropdownBodyHeight = 'calc(60vh - 60px)'

  return (
    <div className="flex flex-col sm:flex-row" style={{ height: dropdownBodyHeight }}>
      {/* Mobile: horizontal pills */}
      <div className="sm:hidden shrink-0 border-b border-stone-200 dark:border-zinc-800 px-3 py-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {PRO_MOCK_CONVERSATIONS.map((conv) => (
          <button
            key={conv.id}
            onClick={() => setActiveId(conv.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeId === conv.id
                ? 'bg-blue-500 text-white'
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
          {PRO_MOCK_CONVERSATIONS.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveId(conv.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                activeId === conv.id
                  ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/30'
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
              className="w-full text-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Try this prompt
            </button>
          </div>
        )}
      </div>

      {/* Messages — scrollable area */}
      <div
        key={activeId}
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-6 space-y-3 animate-in fade-in duration-200"
      >
        {activeConversation.messages.map((msg) => (
          <ProMockMessageBubble
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
            className="w-full text-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Try this prompt
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Skeleton for loading state ─────────────────────────────────────
function ProMockConversationSkeleton() {
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
export function ProMockConversationDemo() {
  return <ProMockConversation variant="homepage" />
}

// ─── Chat dropdown export ───────────────────────────────────────────
export function ProMockConversationDropdown({
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
        {/* Header — blue-themed */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-stone-200 dark:border-zinc-800 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Globe className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-base sm:text-lg">Pro Outreach Examples</h3>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400">PRO</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {!showContent ? (
            <ProMockConversationSkeleton />
          ) : (
            <ProMockConversation variant="chat-dropdown" onPromptSelect={onPromptSelect} />
          )}
        </div>
      </div>
    </>
  )
}
