'use client'

import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'
import {
  Brain,
  Zap,
  Mail,
  LogOut,
  CheckCircle2,
  Circle,
  FileText,
  Users,
  BarChart3,
  CreditCard,
  X,
  Lock,
  MessageSquare,
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  Settings,
  Repeat2,
  Globe,
} from 'lucide-react'

export type DashboardView = 'agent' | 'email' | 'drafts' | 'contacts' | 'analytics' | 'automations' | 'outreach' | 'billing'

interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface DashboardSidebarProps {
  user: User
  activeView: DashboardView
  onViewChange: (view: DashboardView) => void
  onOpenChat: (sessionId?: string) => void
  onOpenOutreachChat?: (sessionId?: string) => void
  isEmailConnected: boolean
  mobileOpen?: boolean
  onMobileClose?: () => void
  billingGated?: boolean
  activeChatId?: string
  activeOutreachChatId?: string
  userPlan?: string
}

function formatShortTime(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  return `${diffDays}d`
}

function groupSessions(sessions: ChatSession[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)

  const groups: { label: string; sessions: ChatSession[] }[] = [
    { label: 'Today', sessions: [] },
    { label: 'Yesterday', sessions: [] },
    { label: 'Previous 7 Days', sessions: [] },
    { label: 'Older', sessions: [] },
  ]

  for (const session of sessions) {
    const date = new Date(session.updated_at)
    if (date >= today) groups[0].sessions.push(session)
    else if (date >= yesterday) groups[1].sessions.push(session)
    else if (date >= weekAgo) groups[2].sessions.push(session)
    else groups[3].sessions.push(session)
  }

  return groups.filter(g => g.sessions.length > 0)
}

export function DashboardSidebar({
  user,
  activeView,
  onViewChange,
  onOpenChat,
  onOpenOutreachChat,
  isEmailConnected,
  mobileOpen,
  onMobileClose,
  billingGated,
  activeChatId,
  activeOutreachChatId,
  userPlan,
}: DashboardSidebarProps) {
  const router = useRouter()
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [loadingChats, setLoadingChats] = useState(false)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  // Manual override: user clicked "Back" or "Settings" to force nav panel while on agent view
  // Default to nav panel (true) unless user has an active chat open
  const [forceNav, setForceNav] = useState(!activeChatId && !activeOutreachChatId)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleNavClick = (view: DashboardView) => {
    // Keep nav panel visible when clicking nav items (new chat starts fresh)
    // Only show chats panel when user explicitly opens an existing chat
    setForceNav(true)
    onViewChange(view)
    onMobileClose?.()
  }

  const fetchChats = useCallback(async () => {
    setLoadingChats(true)
    try {
      const chatType = activeView === 'outreach' ? 'outreach' : 'agent'
      const res = await fetch(`/api/chats?type=${chatType}`)
      if (!res.ok) throw new Error('Failed to fetch chats')
      const data = await res.json()
      setChatSessions(data.sessions || [])
    } catch {
      // Silently fail
    } finally {
      setLoadingChats(false)
    }
  }, [activeView])

  const handleDeleteChat = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/chats/${sessionId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setDeletingIds(prev => new Set(prev).add(sessionId))
      setTimeout(() => {
        setChatSessions(prev => prev.filter(s => s.id !== sessionId))
        setDeletingIds(prev => {
          const next = new Set(prev)
          next.delete(sessionId)
          return next
        })
      }, 400)
    } catch {
      // Silently fail
    }
  }

  const handleOpenChat = (sessionId?: string) => {
    setForceNav(false)
    if (activeView === 'outreach') {
      onOpenOutreachChat?.(sessionId)
    } else {
      onOpenChat(sessionId)
    }
    onMobileClose?.()
  }

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  // Fetch chats on mount and when switching to agent view
  useEffect(() => {
    fetchChats()
  }, [activeView, fetchChats])

  // Reset forceNav when leaving chat views
  useEffect(() => {
    if (activeView !== 'agent' && activeView !== 'outreach') setForceNav(false)
  }, [activeView])

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  // Show chats panel when on agent or outreach view (unless user forced nav open)
  const showChatsPanel = (activeView === 'agent' || activeView === 'outreach') && !forceNav

  const navItems: { id: DashboardView; label: string; icon: typeof Zap; proBadge?: boolean }[] = [
    { id: 'agent', label: 'BLITZ', icon: Zap },
    { id: 'outreach', label: 'Outreach', icon: Globe, proBadge: true },
    { id: 'drafts', label: 'Drafts', icon: FileText },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'automations', label: 'Automations', icon: Repeat2 },
    { id: 'email', label: 'Email Connection', icon: Mail },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ]

  // ─── Chats Panel (shown when on agent view) ────────────────────────
  const chatsPanel = (
    <>
      {/* Header with back arrow */}
      <div className="p-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between">
        <button
          onClick={() => setForceNav(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-stone-600 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {onMobileClose && (
            <Button variant="ghost" size="icon" onClick={onMobileClose} className="lg:hidden h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* New Chat button */}
      <div className="p-3">
        <Button
          variant="outline"
          className="w-full justify-center gap-2 border-stone-200 dark:border-zinc-700 text-sm font-medium"
          onClick={() => handleOpenChat()}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {loadingChats && chatSessions.length === 0 ? (
          <div className="space-y-3 animate-pulse pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-2 py-1.5">
                <div className="h-3.5 rounded bg-stone-200 dark:bg-zinc-800" style={{ width: `${50 + i * 7}%` }} />
                <div className="h-3 w-8 rounded bg-stone-100 dark:bg-zinc-800/60" />
              </div>
            ))}
          </div>
        ) : chatSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-6 w-6 text-stone-300 dark:text-zinc-600 mb-3" />
            <p className="text-xs text-stone-400 dark:text-zinc-500">No chats yet</p>
          </div>
        ) : (
          <div className="pt-1 space-y-1">
            {groupSessions(chatSessions).map((group) => {
              const isCollapsed = collapsedGroups.has(group.label)
              return (
                <div key={group.label}>
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-400 transition-colors w-full"
                  >
                    <ChevronDown className={`h-3 w-3 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                    {group.label}
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-0.5">
                      {group.sessions.map((session) => {
                        const isActive = activeChatId === session.id || activeOutreachChatId === session.id
                        return (
                          <button
                            key={session.id}
                            onClick={() => handleOpenChat(session.id)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg group transition-all ${
                              deletingIds.has(session.id)
                                ? 'opacity-0 -translate-x-8 max-h-0 overflow-hidden duration-400'
                                : isActive
                                  ? 'bg-stone-800 dark:bg-zinc-200 text-white dark:text-black'
                                  : 'opacity-100 translate-x-0 max-h-20 hover:bg-stone-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <MessageSquare className={`h-3 w-3 shrink-0 ${isActive ? 'text-white/70 dark:text-black/70' : 'text-stone-400 dark:text-zinc-600'}`} />
                              <p className={`flex-1 text-sm truncate ${
                                isActive
                                  ? 'text-white dark:text-black font-medium'
                                  : 'text-stone-600 dark:text-zinc-400 group-hover:text-stone-900 dark:group-hover:text-white'
                              } transition-colors`}>
                                {session.title}
                              </p>
                              {!isActive && (
                                <>
                                  <span className="text-[11px] text-stone-400 dark:text-zinc-600 tabular-nums shrink-0 group-hover:hidden">
                                    {formatShortTime(session.updated_at)}
                                  </span>
                                  <button
                                    onClick={(e) => handleDeleteChat(e, session.id)}
                                    className="hidden group-hover:block p-0.5 rounded text-stone-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 shrink-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-stone-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-medium">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-stone-500 dark:text-zinc-400 truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </>
  )

  // ─── Nav Panel (shown when NOT on agent view, or user clicked Settings) ──
  const navPanel = (
    <>
      <div className="p-4 border-b border-stone-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 dark:bg-zinc-800">
              <Brain className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold font-mono tracking-wider">EMAILLIGENCE</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {onMobileClose && (
              <Button variant="ghost" size="icon" onClick={onMobileClose} className="lg:hidden h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {(activeView === 'agent' || activeView === 'outreach') && (
          <button
            onClick={() => setForceNav(false)}
            className="flex items-center gap-1.5 text-sm font-medium text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white transition-colors mt-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to chats
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isLocked = billingGated && item.id !== 'billing'
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              disabled={isLocked}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === item.id
                  ? 'bg-stone-800 dark:bg-zinc-200 text-white dark:text-black'
                  : isLocked
                    ? 'text-stone-300 dark:text-zinc-600 cursor-not-allowed'
                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
              {item.proBadge && (
                <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400 shrink-0">PRO</span>
              )}
              {isLocked && (
                <Lock className="h-3 w-3 ml-auto shrink-0" />
              )}
              {!isLocked && item.id === 'email' && (
                isEmailConnected ? (
                  <CheckCircle2 className="h-3 w-3 ml-auto text-emerald-500" />
                ) : (
                  <Circle className="h-3 w-3 ml-auto" />
                )
              )}
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-stone-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-medium">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-stone-500 dark:text-zinc-400 truncate">{user.email}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </>
  )

  const sidebarContent = showChatsPanel ? chatsPanel : navPanel

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-stone-200 dark:border-zinc-800 bg-[#faf8f5] dark:bg-[#111113] flex-col shrink-0 overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[80vw] max-w-72 bg-[#faf8f5] dark:bg-[#111113] border-r border-stone-200 dark:border-zinc-800 flex flex-col lg:hidden shadow-2xl overflow-hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
