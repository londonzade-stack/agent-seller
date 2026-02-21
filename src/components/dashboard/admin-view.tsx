'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MarkdownContent } from './markdown-content'
import {
  Shield,
  Users,
  MessageSquare,
  Mail,
  Loader2,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Search,
  Zap,
  BarChart3,
  Info,
  MessageCircle,
} from 'lucide-react'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts'

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

interface SparklinePoint {
  date: string
  count: number
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
  sparklines?: {
    signups: SparklinePoint[]
    messages: SparklinePoint[]
    sessions: SparklinePoint[]
    connections: SparklinePoint[]
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
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
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

const PIE_COLORS = ['#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#6b7280']

// ─── Mini Sparkline Component ────────────────────────────────────
function Sparkline({ data, color }: { data: SparklinePoint[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="count"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Chat Type Badge ─────────────────────────────────────────────
function ChatTypeBadge({ chatType }: { chatType: string }) {
  return (
    <Badge className={`text-[10px] px-1.5 py-0 shrink-0 ${
      chatType === 'outreach'
        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
        : 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
    }`}>
      {chatType === 'outreach' ? 'Outreach' : 'BLITZ'}
    </Badge>
  )
}

// ─── Component ───────────────────────────────────────────────────
export function AdminView() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [queries, setQueries] = useState<UserQuery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'chats'>('overview')

  // Overview: Users table search
  const [searchQuery, setSearchQuery] = useState('')

  // Chats tab state
  const [chatUsers, setChatUsers] = useState<{ userId: string; email: string; sessions: ChatSession[] }[]>([])
  const [expandedChatUserId, setExpandedChatUserId] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [selectedSessionUserEmail, setSelectedSessionUserEmail] = useState<string>('')
  const [loadingUserChats, setLoadingUserChats] = useState<string | null>(null)
  const [chatSearchQuery, setChatSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, usersRes, queriesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
        fetch('/api/admin/popular-queries'),
      ])
      if (!statsRes.ok || !usersRes.ok || !queriesRes.ok) throw new Error('Failed to fetch admin data')
      const [statsData, usersData, queriesData] = await Promise.all([
        statsRes.json(), usersRes.json(), queriesRes.json(),
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

  // Scroll to bottom when selected session changes
  useEffect(() => {
    if (selectedSession) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [selectedSession])

  // Fetch chats for a user in the Chats sidebar
  const fetchUserChats = async (userId: string, email: string) => {
    if (expandedChatUserId === userId) {
      setExpandedChatUserId(null)
      return
    }
    // Check if already fetched
    const existing = chatUsers.find(u => u.userId === userId)
    if (existing) {
      setExpandedChatUserId(userId)
      return
    }
    setExpandedChatUserId(userId)
    setLoadingUserChats(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/chats`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setChatUsers(prev => [...prev.filter(u => u.userId !== userId), { userId, email, sessions: data.sessions || [] }])
    } catch {
      setChatUsers(prev => [...prev.filter(u => u.userId !== userId), { userId, email, sessions: [] }])
    } finally {
      setLoadingUserChats(null)
    }
  }

  const selectSession = (session: ChatSession, email: string) => {
    setSelectedSession(session)
    setSelectedSessionUserEmail(email)
  }

  // Navigate from overview user table to chats tab for a specific user
  const goToUserChats = (user: AdminUser) => {
    setActiveTab('chats')
    fetchUserChats(user.id, user.email)
  }

  const filteredUsers = searchQuery
    ? users.filter(u =>
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.plan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.connectedEmail?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users

  const filteredChatUsers = chatSearchQuery
    ? users.filter(u => u.email?.toLowerCase().includes(chatSearchQuery.toLowerCase()))
    : users

  // ─── Loading / Error states ─────────────────────────────────────
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

  // ─── Subscription pie data ──────────────────────────────────────
  const subPieData = stats ? [
    { name: 'Trial', value: stats.subscriptions.trialing },
    { name: 'Active', value: stats.subscriptions.active },
    { name: 'Canceled', value: stats.subscriptions.canceled },
    { name: 'Access Code', value: stats.subscriptions.accessCode },
    { name: 'Past Due', value: stats.subscriptions.pastDue },
    { name: 'Free', value: stats.subscriptions.none },
  ].filter(d => d.value > 0) : []

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* ─── Header ─── */}
      <header className="relative z-10 border-b border-zinc-200/80 dark:border-white/[0.06] px-4 py-4 sm:px-6 bg-[#faf8f5] dark:bg-[#111113]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-center flex-1">
            <h1 className="text-xl font-bold tracking-tight">Admin</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">System monitoring and management</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAll} className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 border-stone-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/60 shadow-sm">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </header>

      {/* ─── Tab Bar ─── */}
      <div className="border-b border-zinc-200/80 dark:border-white/[0.06] bg-[#faf8f5] dark:bg-[#111113] px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex gap-0">
          {([
            { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
            { id: 'chats' as const, label: 'Chats', icon: MessageCircle },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tab Content ─── */}
      {activeTab === 'overview' ? (
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* ─── Stats Cards with Sparklines ─── */}
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {([
                  { label: 'Total Users', value: stats.totalUsers, icon: Users, color: '#3b82f6', bg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400', sparkline: stats.sparklines?.signups },
                  { label: 'Active This Week', value: stats.activeUsersThisWeek, icon: Zap, color: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400', sparkline: stats.sparklines?.sessions },
                  { label: 'Total Messages', value: stats.totalMessages, icon: MessageSquare, color: '#f59e0b', bg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400', sparkline: stats.sparklines?.messages },
                  { label: 'Total Sessions', value: stats.totalSessions, icon: MessageCircle, color: '#8b5cf6', bg: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600 dark:text-violet-400', sparkline: stats.sparklines?.sessions },
                  { label: 'Email Connections', value: stats.emailConnections, icon: Mail, color: '#ec4899', bg: 'bg-pink-100 dark:bg-pink-900/30', iconColor: 'text-pink-600 dark:text-pink-400', sparkline: stats.sparklines?.connections },
                ] as const).map((card) => (
                  <Card key={card.label} className="p-4 bg-white dark:bg-black border-zinc-200 dark:border-white/10 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`p-1.5 rounded-lg ${card.bg}`}>
                        <card.icon className={`h-3.5 w-3.5 ${card.iconColor}`} />
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{card.label}</span>
                    </div>
                    <p className="text-2xl font-bold mb-1">{card.value.toLocaleString()}</p>
                    {card.sparkline && card.sparkline.length > 0 && (
                      <div className="h-[40px] -mx-2 -mb-2">
                        <Sparkline data={card.sparkline} color={card.color} />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* ─── Users Table + Subscription Pie ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Users Table */}
              <Card className="lg:col-span-2 p-0 bg-white dark:bg-black border-zinc-200 dark:border-white/10 overflow-hidden">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
                  <h3 className="font-medium text-sm">Users</h3>
                  <span className="text-xs text-zinc-400">{users.length} total</span>
                </div>
                {/* Search */}
                <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800/60">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                </div>
                {/* Table */}
                <div className="overflow-auto max-h-[400px]">
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/50 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-zinc-500 dark:text-zinc-400">User</th>
                        <th className="text-left px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">Plan</th>
                        <th className="text-left px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400 hidden md:table-cell">Provider</th>
                        <th className="text-center px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">Chats</th>
                        <th className="text-center px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">Msgs</th>
                        <th className="text-right px-4 py-2 font-medium text-zinc-500 dark:text-zinc-400">Last Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => {
                        const badge = planBadge(user.plan, user.subscriptionStatus)
                        return (
                          <tr
                            key={user.id}
                            onClick={() => goToUserChats(user)}
                            className="border-b border-zinc-100 dark:border-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-2.5">
                              <span className="font-medium truncate block max-w-[200px]">{user.email}</span>
                            </td>
                            <td className="px-3 py-2.5 hidden sm:table-cell">
                              <Badge className={`${badge.className} text-[10px] px-1.5 py-0`}>{badge.label}</Badge>
                            </td>
                            <td className="px-3 py-2.5 hidden md:table-cell text-zinc-500">
                              {user.emailConnected ? (user.emailProvider === 'gmail' ? 'Gmail' : 'Outlook') : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-center">{user.totalSessions}</td>
                            <td className="px-3 py-2.5 text-center hidden sm:table-cell">{user.totalMessages}</td>
                            <td className="px-4 py-2.5 text-right text-zinc-500">{timeAgo(user.lastActive)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Subscription Breakdown Pie */}
              <Card className="p-4 bg-white dark:bg-black border-zinc-200 dark:border-white/10">
                <h3 className="font-medium text-sm mb-3">Subscriptions</h3>
                {subPieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={subPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {subPieData.map((_, index) => (
                            <Cell key={`pie-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          content={({ active, payload }: any) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-xs shadow-lg border border-zinc-200 dark:border-zinc-700">
                                <span className="font-medium">{payload[0].name}: {payload[0].value}</span>
                              </div>
                            )
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                      {subPieData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-1.5 text-[11px]">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                          <span className="text-zinc-600 dark:text-zinc-400">{entry.name}: <strong>{entry.value}</strong></span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-zinc-400 py-8 text-center">No subscription data</p>
                )}
              </Card>
            </div>

            {/* ─── Recent Queries ─── */}
            <Card className="p-0 bg-white dark:bg-black border-zinc-200 dark:border-white/10 overflow-hidden">
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
                <h3 className="font-medium text-sm">Recent User Queries</h3>
                <span className="text-xs text-zinc-400">{queries.length} recent</span>
              </div>
              <div className="max-h-[300px] overflow-auto divide-y divide-zinc-100 dark:divide-zinc-800/40">
                {queries.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-6 text-center">No queries yet</p>
                ) : (
                  queries.slice(0, 50).map((q) => (
                    <div key={q.id} className="px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                      <p className="text-xs break-words line-clamp-2 mb-1">{q.content}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-zinc-400">{q.userEmail}</span>
                        <ChatTypeBadge chatType={q.chatType} />
                        <span className="text-[11px] text-zinc-400">{timeAgo(q.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════
           CHATS TAB — Two-panel layout
           ═══════════════════════════════════════════════════════════ */
        <div className="flex-1 flex min-h-0">
          {/* ─── Left Sidebar ─── */}
          <div className="w-72 lg:w-80 border-r border-zinc-200 dark:border-white/[0.06] flex flex-col bg-[#faf8f5] dark:bg-[#111113]">
            {/* Sidebar Search */}
            <div className="p-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">
                {users.length} users · {users.reduce((sum, u) => sum + u.totalSessions, 0)} conversations
              </p>
            </div>

            {/* User Accordion List */}
            <div className="flex-1 overflow-auto">
              {filteredChatUsers.map((user) => {
                const isExpanded = expandedChatUserId === user.id
                const isLoading = loadingUserChats === user.id
                const userData = chatUsers.find(u => u.userId === user.id)
                return (
                  <div key={user.id}>
                    <button
                      onClick={() => fetchUserChats(user.id, user.email)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800/30 ${
                        isExpanded ? 'bg-zinc-100 dark:bg-zinc-800/40' : ''
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 text-zinc-400 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-zinc-400 shrink-0" />
                      )}
                      <span className="text-xs font-medium truncate flex-1">{user.email}</span>
                      <Badge className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] px-1.5 py-0">
                        {user.totalSessions}
                      </Badge>
                    </button>
                    {isExpanded && (
                      <div className="bg-zinc-50 dark:bg-zinc-900/30">
                        {isLoading ? (
                          <div className="flex items-center gap-2 px-6 py-3">
                            <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />
                            <span className="text-[11px] text-zinc-400">Loading...</span>
                          </div>
                        ) : userData && userData.sessions.length > 0 ? (
                          userData.sessions.map((session) => {
                            const isActive = selectedSession?.id === session.id
                            return (
                              <button
                                key={session.id}
                                onClick={() => selectSession(session, user.email)}
                                className={`w-full flex items-center gap-2 px-5 py-2 text-left transition-colors border-l-2 ${
                                  isActive
                                    ? 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-l-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/40'
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <ChatTypeBadge chatType={session.chatType} />
                                    <span className="text-[11px] text-zinc-400">{session.messageCount} msgs</span>
                                  </div>
                                  <p className="text-xs truncate">{session.title}</p>
                                  <p className="text-[10px] text-zinc-400">{timeAgo(session.updatedAt)}</p>
                                </div>
                              </button>
                            )
                          })
                        ) : (
                          <p className="text-[11px] text-zinc-400 px-6 py-3">No conversations</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ─── Right Panel: Chat Viewer ─── */}
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-black">
            {selectedSession ? (
              <>
                {/* Session Header */}
                <div className="px-4 sm:px-6 py-3 border-b border-zinc-200 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-zinc-900/30">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-medium text-sm truncate">{selectedSession.title}</h2>
                    <ChatTypeBadge chatType={selectedSession.chatType} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400">
                    <span>{selectedSessionUserEmail}</span>
                    <span>{formatDate(selectedSession.createdAt)}</span>
                    <span>{selectedSession.messageCount} messages</span>
                  </div>
                </div>

                {/* Info Banner */}
                <div className="px-4 sm:px-6 py-2 border-b border-zinc-100 dark:border-zinc-800/40 bg-blue-50/50 dark:bg-blue-900/10">
                  <div className="flex items-center gap-1.5">
                    <Info className="h-3 w-3 text-blue-400" />
                    <span className="text-[11px] text-blue-500 dark:text-blue-400">Tool call details are not stored in chat history</span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-auto px-4 sm:px-6 py-4 space-y-3">
                  {selectedSession.messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-stone-800 dark:bg-zinc-200 text-white dark:text-zinc-900'
                          : 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                            msg.role === 'user' ? 'text-white/60 dark:text-zinc-900/60' : 'text-zinc-400'
                          }`}>
                            {msg.role === 'user' ? 'User' : 'BLITZ'}
                          </span>
                          <span className={`text-[10px] ${
                            msg.role === 'user' ? 'text-white/40 dark:text-zinc-900/40' : 'text-zinc-400/60'
                          }`}>
                            {formatDateTime(msg.createdAt)}
                          </span>
                        </div>
                        {msg.role === 'assistant' ? (
                          <MarkdownContent content={msg.content} />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </>
            ) : (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                  <MessageCircle className="h-7 w-7 text-zinc-400" />
                </div>
                <h3 className="font-medium text-sm mb-1">Select a conversation</h3>
                <p className="text-xs text-zinc-400 max-w-[240px]">Choose a user and chat session from the sidebar to view the full conversation.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
