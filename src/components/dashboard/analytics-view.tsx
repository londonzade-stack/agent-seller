'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  BarChart3,
  Mail,
  RefreshCw,
  AlertCircle,
  Inbox,
  Send,
  Users,
  TrendingUp,
  Star,
  ShieldAlert,
  Trash2,
  ChevronDown,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface InboxStats {
  totalEmails: number
  unreadEmails: number
  totalThreads: number
  sentEmails: number
  spamEmails: number
  trashedEmails: number
  starredEmails: number
  emailsInTimeframe: number
  emailsWithAttachments: number
  uniqueSenders: number
  topSenders: { sender: string; count: number }[]
}

interface SenderEmail {
  id: string
  subject: string
  from: string
  date: string
  snippet: string
}

interface AnalyticsViewProps {
  isEmailConnected: boolean
  onConnectEmail: () => void
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#f43f5e', '#14b8a6']

export function AnalyticsView({ isEmailConnected, onConnectEmail }: AnalyticsViewProps) {
  const [stats, setStats] = useState<InboxStats | null>(null)
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('week')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSender, setExpandedSender] = useState<string | null>(null)
  const [senderEmails, setSenderEmails] = useState<Record<string, SenderEmail[]>>({})
  const [senderEmailsLoading, setSenderEmailsLoading] = useState<string | null>(null)
  const expandedSenderRef = useRef<HTMLDivElement>(null)

  const fetchSenderEmails = async (senderEmail: string) => {
    if (expandedSender === senderEmail) {
      setExpandedSender(null)
      return
    }
    setExpandedSender(senderEmail)
    // Scroll expanded section into view after animation starts
    setTimeout(() => {
      expandedSenderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 350)
    if (senderEmails[senderEmail]) return
    setSenderEmailsLoading(senderEmail)
    try {
      const res = await fetch(`/api/contacts/emails?sender=${encodeURIComponent(senderEmail)}`)
      if (!res.ok) throw new Error('Failed to fetch emails')
      const data = await res.json()
      setSenderEmails(prev => ({ ...prev, [senderEmail]: data.emails || [] }))
    } catch {
      setSenderEmails(prev => ({ ...prev, [senderEmail]: [] }))
    } finally {
      setSenderEmailsLoading(null)
    }
  }

  const fetchStats = async () => {
    if (!isEmailConnected) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/analytics?timeframe=${timeframe}`)
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const data = await res.json()
      setStats(data.stats || null)
    } catch {
      setError('Failed to load analytics. Try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [isEmailConnected, timeframe])

  if (!isEmailConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
          <BarChart3 className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Inbox Analytics</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-center max-w-md">
          Connect your email to see analytics about your inbox activity, top senders, and trends.
        </p>
        <Button onClick={onConnectEmail} className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
          <Mail className="h-4 w-4 mr-2" />
          Connect Email
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="border-b border-zinc-200 dark:border-white/10 px-3 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-black">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold">Analytics</h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Inbox insights and email activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-zinc-200 dark:border-white/10 overflow-hidden">
            {(['today', 'week', 'month'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors ${
                  timeframe === t
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
                    : 'bg-white dark:bg-black text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {t === 'today' ? 'Today' : t === 'week' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading} className="border-zinc-200 dark:border-white/10">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-3 sm:p-6">
        {loading && !stats ? (
          <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
            {/* Skeleton: Primary Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {[0, 80, 160, 240].map((delay, i) => (
                <div key={i} className="animate-skeleton-drop" style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
                  <Card className="p-3 sm:p-4 border-stone-200 dark:border-zinc-800 bg-white dark:bg-black">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-200 dark:bg-zinc-800 animate-pulse" />
                      <div className="h-3 w-12 rounded bg-stone-200 dark:bg-zinc-800 animate-pulse" />
                    </div>
                    <div className="h-7 w-16 rounded bg-stone-200 dark:bg-zinc-800 mb-2 animate-pulse" />
                    <div className="h-3 w-20 rounded bg-stone-100 dark:bg-zinc-800/60 animate-pulse" />
                  </Card>
                </div>
              ))}
            </div>
            {/* Skeleton: Secondary Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {[320, 400, 480, 560].map((delay, i) => (
                <div key={i} className="animate-skeleton-drop" style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
                  <Card className="p-3 sm:p-4 border-stone-200 dark:border-zinc-800 bg-white dark:bg-black">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-200 dark:bg-zinc-800 animate-pulse" />
                      <div className="h-3 w-14 rounded bg-stone-200 dark:bg-zinc-800 animate-pulse" />
                    </div>
                    <div className="h-7 w-12 rounded bg-stone-200 dark:bg-zinc-800 mb-2 animate-pulse" />
                    <div className="h-3 w-16 rounded bg-stone-100 dark:bg-zinc-800/60 animate-pulse" />
                  </Card>
                </div>
              ))}
            </div>
            {/* Skeleton: Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="animate-skeleton-drop" style={{ animationDelay: '640ms', animationFillMode: 'both' }}>
                <Card className="p-4 sm:p-6 border-stone-200 dark:border-zinc-800 bg-white dark:bg-black">
                  <div className="h-4 w-24 rounded bg-stone-200 dark:bg-zinc-800 mb-4 animate-pulse" />
                  <div className="space-y-3">
                    {[100, 80, 60, 45, 70, 35].map((w, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-3 w-16 rounded bg-stone-100 dark:bg-zinc-800/60 animate-pulse" />
                        <div className="h-5 rounded bg-stone-200 dark:bg-zinc-800 animate-pulse" style={{ width: `${w}%` }} />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
              <div className="animate-skeleton-drop" style={{ animationDelay: '720ms', animationFillMode: 'both' }}>
                <Card className="p-4 sm:p-6 border-stone-200 dark:border-zinc-800 bg-white dark:bg-black">
                  <div className="h-4 w-28 rounded bg-stone-200 dark:bg-zinc-800 mb-4 animate-pulse" />
                  <div className="flex items-center justify-center h-[250px]">
                    <div className="w-[180px] h-[180px] rounded-full border-[24px] border-stone-200 dark:border-zinc-800 animate-pulse" />
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-stone-200 dark:bg-zinc-800 animate-pulse" />
                        <div className="h-3 w-8 rounded bg-stone-100 dark:bg-zinc-800/60 animate-pulse" />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
            {/* Skeleton: Top Senders Table */}
            <div className="animate-skeleton-drop" style={{ animationDelay: '800ms', animationFillMode: 'both' }}>
              <Card className="p-4 sm:p-6 border-stone-200 dark:border-zinc-800 bg-white dark:bg-black">
                <div className="h-4 w-28 rounded bg-stone-200 dark:bg-zinc-800 mb-4 animate-pulse" />
                <div className="space-y-2">
                  {[90, 75, 60, 50, 40].map((w, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-stone-100 dark:border-zinc-800/60 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-zinc-800 animate-pulse" />
                      <div className="h-3 rounded bg-stone-200 dark:bg-zinc-800 animate-pulse" style={{ width: `${w + 30}px` }} />
                      <div className="flex-1" />
                      <div className="h-3 w-12 rounded bg-stone-100 dark:bg-zinc-800/60 hidden sm:block animate-pulse" />
                      <div className="w-16 sm:w-24 h-2 bg-stone-100 dark:bg-zinc-800/60 rounded-full overflow-hidden animate-pulse">
                        <div className="h-full bg-stone-200 dark:bg-zinc-800 rounded-full" style={{ width: `${w}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">{error}</p>
            <Button variant="outline" onClick={fetchStats} className="border-zinc-200 dark:border-white/10">Try Again</Button>
          </div>
        ) : !stats ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
              <BarChart3 className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No data yet</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Analytics will appear once we scan your inbox.</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
            {/* Primary Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Card className="p-3 sm:p-4 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Inbox className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                  </div>
                  <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Inbox</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">{stats.totalEmails.toLocaleString()}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{stats.totalThreads.toLocaleString()} threads</p>
              </Card>
              <Card className="p-3 sm:p-4 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                  </div>
                  <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Unread</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">{stats.unreadEmails.toLocaleString()}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {stats.totalEmails > 0 ? Math.round((stats.unreadEmails / stats.totalEmails) * 100) : 0}% of inbox
                </p>
              </Card>
              <Card className="p-3 sm:p-4 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                  </div>
                  <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Sent</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">{stats.sentEmails.toLocaleString()}</p>
              </Card>
              <Card className="p-3 sm:p-4 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
                  </div>
                  <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Starred</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">{stats.starredEmails.toLocaleString()}</p>
              </Card>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Card className="p-3 sm:p-4 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />
                  </div>
                  <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate">This {timeframe === 'today' ? 'Day' : timeframe === 'week' ? 'Week' : 'Month'}</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">{stats.emailsInTimeframe}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">received</p>
              </Card>
              <Card className="p-3 sm:p-4 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-500" />
                  </div>
                  <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Senders</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">{stats.uniqueSenders}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">unique</p>
              </Card>
              <Card className="p-3 sm:p-4 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                    <ShieldAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-500" />
                  </div>
                  <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Spam</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">{stats.spamEmails.toLocaleString()}</p>
              </Card>
              <Card className="p-3 sm:p-4 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-500/10 flex items-center justify-center">
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                  </div>
                  <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Trash</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">{stats.trashedEmails.toLocaleString()}</p>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Top Senders Bar Chart */}
              <Card className="p-4 sm:p-6 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                <h3 className="font-medium mb-4">Top Senders</h3>
                {stats.topSenders.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={stats.topSenders.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis
                        type="category"
                        dataKey="sender"
                        width={120}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '...' : v}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          return (
                            <div className="rounded-xl px-3 py-2 text-xs shadow-lg border border-white/30 dark:border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)' }}>
                              <p className="font-medium text-stone-700 mb-1">{String(label)}</p>
                              <p className="text-stone-500">Emails: <span className="font-semibold text-stone-800">{payload[0].value}</span></p>
                            </div>
                          )
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {stats.topSenders.slice(0, 8).map((_, index) => (
                          <Cell key={`bar-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-sm">
                    No sender data available
                  </div>
                )}
              </Card>

              {/* Email Distribution Pie Chart */}
              <Card className="p-4 sm:p-6 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                <h3 className="font-medium mb-4">Inbox Breakdown</h3>
                {(() => {
                  const breakdownData = [
                    { name: 'Read', value: stats.totalEmails - stats.unreadEmails },
                    { name: 'Unread', value: stats.unreadEmails },
                    { name: 'Starred', value: stats.starredEmails },
                    { name: 'Sent', value: stats.sentEmails },
                    { name: 'Spam', value: stats.spamEmails },
                    { name: 'With Attachments', value: stats.emailsWithAttachments },
                    { name: 'Trashed', value: stats.trashedEmails },
                  ].filter(d => d.value > 0)
                  return (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={breakdownData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {breakdownData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null
                              const data = payload[0]
                              return (
                                <div className="rounded-xl px-3 py-2 text-xs shadow-lg border border-white/30 dark:border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)' }}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload?.fill || '#888' }} />
                                    <span className="font-medium text-stone-700">{data.name}</span>
                                    <span className="font-semibold text-stone-800">{data.value}</span>
                                  </div>
                                </div>
                              )
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center gap-3 sm:gap-4 mt-2 flex-wrap">
                        {breakdownData.map((entry, index) => (
                          <div key={entry.name} className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            {entry.name}
                          </div>
                        ))}
                      </div>
                    </>
                  )
                })()}
              </Card>
            </div>

            {/* Top Senders Table */}
            {stats.topSenders.length > 0 && (
              <Card className="p-4 sm:p-6 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                <h3 className="font-medium mb-4">All Top Senders</h3>
                <div className="space-y-1">
                  {stats.topSenders.map((sender, i) => {
                    const isExpanded = expandedSender === sender.sender
                    const isLoading = senderEmailsLoading === sender.sender
                    const emails = senderEmails[sender.sender]
                    return (
                      <div key={i}>
                        <button
                          onClick={() => fetchSenderEmails(sender.sender)}
                          className="w-full flex items-center gap-3 py-2.5 px-2 rounded-lg border-b border-zinc-200 dark:border-white/10 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer text-left"
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                            {sender.sender.charAt(0).toUpperCase()}
                          </div>
                          <span className="flex-1 text-sm truncate">{sender.sender}</span>
                          <span className="text-sm text-zinc-500 dark:text-zinc-400 hidden sm:inline">{sender.count} emails</span>
                          <span className="text-sm text-zinc-500 dark:text-zinc-400 sm:hidden">{sender.count}</span>
                          <div className="w-16 sm:w-24 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(sender.count / stats.topSenders[0].count) * 100}%`,
                                backgroundColor: COLORS[i % COLORS.length],
                              }}
                            />
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {isExpanded && (
                          <div ref={expandedSenderRef} className="pl-4 sm:pl-12 pr-2 py-3 space-y-2">
                            {isLoading ? (
                              <div className="space-y-2">
                                {[0, 1, 2].map((j) => (
                                  <div key={j} className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/50 p-3 sm:p-4 animate-email-drop" style={{ animationDelay: `${j * 120}ms` }}>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div className="h-4 w-3/5 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                                      <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                                    </div>
                                    <div className="space-y-1.5">
                                      <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                                      <div className="h-3 w-4/5 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : emails && emails.length > 0 ? (
                              emails.slice(0, 5).map((email, idx) => (
                                <div
                                  key={email.id}
                                  className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/50 p-3 sm:p-4 animate-email-drop"
                                  style={{ animationDelay: `${idx * 120}ms` }}
                                >
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <p className="font-medium text-sm truncate">{email.subject}</p>
                                    <span className="text-xs text-zinc-500 dark:text-zinc-500 whitespace-nowrap shrink-0">
                                      {new Date(email.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-zinc-400 line-clamp-2">{email.snippet}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-zinc-400 py-4 text-center">No emails found</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
