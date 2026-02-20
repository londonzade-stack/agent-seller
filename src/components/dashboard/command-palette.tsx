'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useTheme } from 'next-themes'
import type { DashboardView } from './dashboard-sidebar'
import {
  Search,
  Zap,
  MessageSquare,
  FileText,
  Users,
  BarChart3,
  Globe,
  Repeat2,
  Mail,
  CreditCard,
  Lock,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────
interface Contact {
  email: string
  name: string
  totalEmails: number
  lastContactDate: string
}

interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface CommandItem {
  id: string
  label: string
  sublabel?: string
  icon: React.ComponentType<{ className?: string }>
  section: 'pages' | 'chats' | 'contacts'
  onSelect: () => void
  locked?: boolean
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (view: DashboardView) => void
  onOpenChat: (sessionId: string) => void
  billingGated?: boolean
}

// ─── Static page items ──────────────────────────────────────────────
const PAGE_ITEMS: { id: DashboardView; label: string; icon: typeof Zap }[] = [
  { id: 'agent', label: 'BLITZ', icon: Zap },
  { id: 'outreach', label: 'Outreach', icon: Globe },
  { id: 'drafts', label: 'Drafts', icon: FileText },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'automations', label: 'Automations', icon: Repeat2 },
  { id: 'email', label: 'Email Connection', icon: Mail },
  { id: 'billing', label: 'Billing', icon: CreditCard },
]

// ─── Helpers ─────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

// ─── Component ───────────────────────────────────────────────────────
export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  onOpenChat,
  billingGated = false,
}: CommandPaletteProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Close helper
  const close = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  // Fetch data when palette opens
  useEffect(() => {
    if (!open) return
    setQuery('')
    setSelectedIndex(0)
    setLoading(true)

    Promise.all([
      fetch('/api/contacts').then(r => r.json()).catch(() => ({ contacts: [] })),
      fetch('/api/chats').then(r => r.json()).catch(() => ({ sessions: [] })),
    ]).then(([contactsData, chatsData]) => {
      setContacts(contactsData.contacts || [])
      setChatSessions(chatsData.sessions || [])
    }).finally(() => setLoading(false))
  }, [open])

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      // Focus input after a tick (for animation)
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Build filtered items list
  const items = useMemo(() => {
    const q = query.toLowerCase().trim()
    const result: CommandItem[] = []

    // Pages
    const filteredPages = PAGE_ITEMS.filter(p =>
      p.label.toLowerCase().includes(q)
    )
    for (const page of filteredPages) {
      const isLocked = billingGated && page.id !== 'billing'
      result.push({
        id: `page-${page.id}`,
        label: page.label,
        icon: page.icon,
        section: 'pages',
        locked: isLocked,
        onSelect: () => {
          if (!isLocked) {
            onNavigate(page.id)
            close()
          }
        },
      })
    }

    // Recent Chats
    const filteredChats = chatSessions
      .filter(c => c.title.toLowerCase().includes(q))
      .slice(0, 5)
    for (const chat of filteredChats) {
      result.push({
        id: `chat-${chat.id}`,
        label: chat.title,
        sublabel: timeAgo(chat.updated_at),
        icon: MessageSquare,
        section: 'chats',
        onSelect: () => {
          onOpenChat(chat.id)
          close()
        },
      })
    }

    // Contacts
    const filteredContacts = contacts
      .filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      )
      .slice(0, 5)
    for (const contact of filteredContacts) {
      result.push({
        id: `contact-${contact.email}`,
        label: contact.name || contact.email,
        sublabel: contact.name ? contact.email : `${contact.totalEmails} emails`,
        icon: Users,
        section: 'contacts',
        onSelect: () => {
          onNavigate('contacts')
          close()
        },
      })
    }

    return result
  }, [query, chatSessions, contacts, billingGated, onNavigate, onOpenChat, close])

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Scroll selected item into view
  useEffect(() => {
    const el = itemRefs.current[selectedIndex]
    if (el) {
      el.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % (items.length || 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + (items.length || 1)) % (items.length || 1))
        break
      case 'Enter':
        e.preventDefault()
        if (items[selectedIndex]) {
          items[selectedIndex].onSelect()
        }
        break
      case 'Escape':
        e.preventDefault()
        close()
        break
    }
  }

  if (!open) return null

  // Group items by section for rendering
  const sections: { key: string; label: string; items: (CommandItem & { globalIndex: number })[] }[] = []
  const sectionOrder = ['pages', 'chats', 'contacts'] as const
  const sectionLabels = { pages: 'Pages', chats: 'Recent Chats', contacts: 'Contacts' }

  let globalIndex = 0
  for (const sectionKey of sectionOrder) {
    const sectionItems = items
      .filter(item => item.section === sectionKey)
      .map(item => ({ ...item, globalIndex: globalIndex++ }))
    // only skip globalIndex increment if no items — but we already incremented above
    // We need to reset: actually let's do it properly
  }

  // Redo with correct indexing
  const sectionsFinal: typeof sections = []
  let idx = 0
  for (const sectionKey of sectionOrder) {
    const sectionItems: (CommandItem & { globalIndex: number })[] = []
    for (const item of items) {
      if (item.section === sectionKey) {
        sectionItems.push({ ...item, globalIndex: idx })
        idx++
      }
    }
    if (sectionItems.length > 0) {
      sectionsFinal.push({
        key: sectionKey,
        label: sectionLabels[sectionKey],
        items: sectionItems,
      })
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={close}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[18vh] sm:pt-[20vh] pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-[640px] mx-4 overflow-hidden rounded-2xl border border-stone-200/60 dark:border-white/10 animate-command-palette-in"
          style={{
            background: isDark ? 'rgba(24, 24, 27, 0.88)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: isDark
              ? '0 24px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
              : '0 24px 80px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-stone-200/40 dark:border-white/[0.06]">
            <Search className="h-5 w-5 text-stone-400 dark:text-zinc-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, contacts, chats..."
              className="flex-1 bg-transparent border-0 outline-none text-base text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-stone-400 dark:text-zinc-500 bg-stone-100/80 dark:bg-white/[0.06] border border-stone-200/60 dark:border-white/[0.08]">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[360px] overflow-y-auto py-1" role="listbox">
            {loading ? (
              // Skeleton loading
              <div className="px-4 py-3 space-y-3 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-stone-200/60 dark:bg-white/[0.06]" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-28 rounded bg-stone-200/60 dark:bg-white/[0.06]" />
                      <div className="h-3 w-40 rounded bg-stone-200/40 dark:bg-white/[0.04]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              // Empty state
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-stone-400 dark:text-zinc-500">No results found</p>
                <p className="text-xs text-stone-300 dark:text-zinc-600 mt-1">Try a different search term</p>
              </div>
            ) : (
              // Grouped results
              sectionsFinal.map(section => (
                <div key={section.key}>
                  <div className="px-4 pt-2.5 pb-1 text-[11px] font-medium text-stone-400 dark:text-zinc-500 uppercase tracking-wider">
                    {section.label}
                  </div>
                  {section.items.map(item => {
                    const isSelected = item.globalIndex === selectedIndex
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        ref={el => { itemRefs.current[item.globalIndex] = el }}
                        onClick={item.onSelect}
                        onMouseEnter={() => setSelectedIndex(item.globalIndex)}
                        disabled={item.locked}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isSelected
                            ? 'bg-stone-100/80 dark:bg-white/[0.08]'
                            : 'hover:bg-stone-50/60 dark:hover:bg-white/[0.04]'
                        } ${item.locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className={`flex items-center justify-center h-8 w-8 rounded-lg shrink-0 ${
                          item.section === 'pages'
                            ? 'bg-stone-100/80 dark:bg-white/[0.06]'
                            : item.section === 'chats'
                              ? 'bg-amber-50 dark:bg-amber-900/20'
                              : 'bg-blue-50 dark:bg-blue-900/20'
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            item.section === 'pages'
                              ? 'text-stone-500 dark:text-zinc-400'
                              : item.section === 'chats'
                                ? 'text-amber-500 dark:text-amber-400'
                                : 'text-blue-500 dark:text-blue-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-900 dark:text-white truncate">
                            {item.label}
                          </p>
                          {item.sublabel && (
                            <p className="text-xs text-stone-400 dark:text-zinc-500 truncate">
                              {item.sublabel}
                            </p>
                          )}
                        </div>
                        {item.locked && (
                          <Lock className="h-3.5 w-3.5 text-stone-300 dark:text-zinc-600 shrink-0" />
                        )}
                        {isSelected && !item.locked && (
                          <CornerDownLeft className="h-3.5 w-3.5 text-stone-300 dark:text-zinc-600 shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hints */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-stone-200/40 dark:border-white/[0.06] text-[11px] text-stone-400 dark:text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              <ArrowDown className="h-3 w-3" />
              navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" />
              select
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded text-[10px] bg-stone-100/80 dark:bg-white/[0.06] border border-stone-200/60 dark:border-white/[0.08]">esc</kbd>
              close
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
