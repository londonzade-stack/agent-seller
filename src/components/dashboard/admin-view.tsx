'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Shield,
  Users,
  MessageSquare,
  BarChart3,
  Mail,
  Loader2,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  UserIcon,
  Zap,
  Clock,
  Search,
  Globe,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────
interface AdminUser {
  id: string
  email: string
  plan: string
  subscriptionStatus: string
  trialEnd: string | null
  signupDate: string
  lastActive: string
  emailConnected: boolean
  emailProvider: string | null
  connectedEmail: string | null
  totalSessions: number
  totalMessages: number
}

interface AdminStats {
  totalUsers: number
  activeUsersThisWeek: number
  totalSessions: number
  totalMessages: number
  emailConnections: number
  subscriptions: {
    trialing: number
    active: number
    canceled: number
    none: number
    pastDue: number
    accessCode: number
  }
}

interface UserQuery {
  id: string
  content: string
  createdAt: string
  chatType: string
  userEmail: string
  sessionTitle: string
}

interface ChatSession {
  id: string
  title: string
  chatType: string
  createdAt: string
  updatedAt: string
  messageCount: number
  messages: { id: string; role: string; content: string; createdAt: string }[]
}

// ─── Helpers ─────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function timeAgo(dateStr: string) {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

function planBadge(plan: string, status: string) {
  if (plan === 'access_code') return { label: 'Access Code', className: 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400' }
  if (status === 'trialing') return { label: 'Trial', className: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' }
  if (status === 'active') return { label: 'Pro', className: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' }
  if (status === 'canceled') return { label: 'Canceled', className: 'bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-400' }
  if (status === 'past_due') return { label: 'Past Due', className: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' }
  return { label: 'Basic', className: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400' }
}

// ─── Component ───────────────────────────────────────────────────
export function AdminView() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [queries, setQueries] = useState<UserQuery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // User drill-down
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserChats, setSelectedUserChats] = useState<ChatSession[]>([])
  const [loadingChats, setLoadingChats] = useState(false)
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null)

  // Tab state
  const [activeTab, setActiveTab] = useState<'users' | 'queries'>('users')

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, usersRes, queriesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
        fetch('/api/admin/popular-queries'),
      ])

      if (!statsRes.ok || !usersRes.ok || !queriesRes.ok) {
        throw new Error('Failed to fetch admin data')
      }

      const [statsData, usersData, queriesData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        queriesRes.json(),
      ])

      setStats(statsData)
      setUsers(usersData.users || [])
      setQueries(queriesData.queries || [])
    } catch {
      setError('Failed to load admin data. Are you authorized?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const fetchUserChats = async (userId: string) => {
    if (selectedUserId === userId) {
      setSelectedUserId(null)
      setSelectedUserChats([])
      return
    }
    setSelectedUserId(userId)
    setLoadingChats(true)
    setExpandedSessionId(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/chats`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setSelectedUserChats(data.sessions || [])
    } catch {
      setSelectedUserChats([])
    } finally {
      setLoadingChats(false)
    }
  }

  const filteredUsers = searchQuery
    ? users.filter(u =>
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.plan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.connectedEmail?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <Shield className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-zinc-500 mb-4">{error}</p>
        <Button variant="outline" onClick={fetchAll}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <header className="relative z-10 border-b border-white/30 dark:border-white/[0.06] px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-[#faf8f5] dark:bg-[#111113] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <Badge variant="secondary" className="bg-red-100/80 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200/60 dark:border-red-700/40 px-3 py-1 text-xs font-medium tracking-wide rounded-full">
          <Shield className="h-3 w-3 mr-1.5" />
          Admin Dashboard
        </Badge>
        <Button variant="outline" size="sm" onClick={fetchAll} className="border-stone-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/60 shadow-sm">
          <RefreshCw className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </header>

      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* ─── Stats Cards ─── */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-4 bg-white dark:bg-black border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    <p className="text-xs text-zinc-500">Total Users</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-white dark:bg-black border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeUsersThisWeek}</p>
                    <p className="text-xs text-zinc-500">Active This Week</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-white dark:bg-black border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalMessages}</p>
                    <p className="text-xs text-zinc-500">Total Messages</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-white dark:bg-black border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                    <Mail className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.emailConnections}</p>
                    <p className="text-xs text-zinc-500">Email Connections</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ─── Subscription Breakdown ─── */}
          {stats && (
            <Card className="p-4 bg-white dark:bg-black border-zinc-200 dark:border-white/10">
              <h3 className="text-sm font-medium mb-3 text-zinc-500">Subscription Breakdown</h3>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Trial: <strong>{stats.subscriptions.trialing}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm">Active: <strong>{stats.subscriptions.active}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm">Canceled: <strong>{stats.subscriptions.canceled}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-violet-500" />
                  <span className="text-sm">Access Code: <strong>{stats.subscriptions.accessCode}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-zinc-400" />
                  <span className="text-sm">Free/None: <strong>{stats.subscriptions.none}</strong></span>
                </div>
              </div>
            </Card>
          )}

          {/* ─── Tab Switcher ─── */}
          <div className="flex gap-1 border-b border-zinc-200 dark:border-white/10">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <Users className="h-3.5 w-3.5 inline mr-1.5" />
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('queries')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'queries'
                  ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 inline mr-1.5" />
              User Queries ({queries.length})
            </button>
          </div>

          {/* ─── Users Tab ─── */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users by email or plan..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Users List */}
              {filteredUsers.map((user) => {
                const badge = planBadge(user.plan, user.subscriptionStatus)
                const isSelected = selectedUserId === user.id
                return (
                  <div key={user.id}>
                    <Card
                      className={`p-0 overflow-hidden border-zinc-200 dark:border-white/10 bg-white dark:bg-black cursor-pointer transition-colors ${
                        isSelected ? 'ring-2 ring-blue-500/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                      }`}
                      onClick={() => fetchUserChats(user.id)}
                    >
                      <div className="p-3 sm:p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0">
                          <UserIcon className="h-4 w-4 text-zinc-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium truncate">{user.email}</span>
                            <Badge className={`${badge.className} text-[10px] px-1.5 py-0`}>{badge.label}</Badge>
                            {user.emailConnected && (
                              <Badge className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5 py-0">
                                {user.emailProvider === 'gmail' ? 'Gmail' : user.emailProvider === 'outlook' ? 'Outlook' : 'Email'} connected
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                            <span>Joined {formatDate(user.signupDate)}</span>
                            <span>Active {timeAgo(user.lastActive)}</span>
                            <span>{user.totalSessions} chats</span>
                            <span>{user.totalMessages} msgs</span>
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 text-zinc-300 transition-transform shrink-0 ${isSelected ? 'rotate-90' : ''}`} />
                      </div>
                    </Card>

                    {/* Chat Drill-Down */}
                    {isSelected && (
                      <div className="ml-4 sm:ml-8 mt-2 mb-2 space-y-2">
                        {loadingChats ? (
                          <div className="flex items-center gap-2 py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                            <span className="text-sm text-zinc-500">Loading chats...</span>
                          </div>
                        ) : selectedUserChats.length === 0 ? (
                          <p className="text-sm text-zinc-400 py-2">No chat sessions found.</p>
                        ) : (
                          selectedUserChats.map((session) => {
                            const isExpanded = expandedSessionId === session.id
                            return (
                              <Card key={session.id} className="p-0 overflow-hidden border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/50">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setExpandedSessionId(isExpanded ? null : session.id) }}
                                  className="w-full p-3 flex items-center gap-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                  )}
                                  <Badge className={`text-[10px] px-1.5 py-0 ${
                                    session.chatType === 'outreach'
                                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                      : 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                                  }`}>
                                    {session.chatType === 'outreach' ? 'Outreach' : 'BLITZ'}
                                  </Badge>
                                  <span className="text-sm font-medium truncate flex-1">{session.title}</span>
                                  <span className="text-xs text-zinc-400 shrink-0">{session.messageCount} msgs</span>
                                  <span className="text-xs text-zinc-400 shrink-0">{formatDateTime(session.createdAt)}</span>
                                </button>

                                {isExpanded && (
                                  <div className="border-t border-zinc-200 dark:border-white/10 p-3 space-y-2 max-h-[400px] overflow-auto">
                                    {session.messages.map((msg) => (
                                      <div
                                        key={msg.id}
                                        className={`rounded-lg px-3 py-2 text-sm ${
                                          msg.role === 'user'
                                            ? 'bg-stone-800 dark:bg-zinc-200 text-white dark:text-zinc-900 ml-8'
                                            : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 mr-8'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <span className="text-[10px] font-medium opacity-60">
                                            {msg.role === 'user' ? 'User' : 'BLITZ'}
                                          </span>
                                          <span className="text-[10px] opacity-40">{formatDateTime(msg.createdAt)}</span>
                                        </div>
                                        <div className="whitespace-pre-wrap break-words text-xs leading-relaxed line-clamp-6">
                                          {msg.content}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </Card>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ─── Queries Tab ─── */}
          {activeTab === 'queries' && (
            <div className="space-y-2">
              {queries.length === 0 ? (
                <p className="text-sm text-zinc-400 py-4 text-center">No user queries found yet.</p>
              ) : (
                queries.map((q) => (
                  <Card key={q.id} className="p-3 bg-white dark:bg-black border-zinc-200 dark:border-white/10">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0 mt-0.5">
                        <MessageSquare className="h-3 w-3 text-zinc-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm break-words line-clamp-3">{q.content}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[11px] text-zinc-400">{q.userEmail}</span>
                          <Badge className={`text-[10px] px-1.5 py-0 ${
                            q.chatType === 'outreach'
                              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                              : 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                          }`}>
                            {q.chatType === 'outreach' ? 'Outreach' : 'BLITZ'}
                          </Badge>
                          <span className="text-[11px] text-zinc-400">{timeAgo(q.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
