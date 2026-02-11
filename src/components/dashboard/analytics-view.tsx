'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  BarChart3,
  Mail,
  Loader2,
  RefreshCw,
  AlertCircle,
  Inbox,
  Send,
  Users,
  TrendingUp,
  Star,
  MessageSquare,
  ShieldAlert,
  Trash2,
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
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Inbox Analytics</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Connect your email to see analytics about your inbox activity, top senders, and trends.
        </p>
        <Button onClick={onConnectEmail}>
          <Mail className="h-4 w-4 mr-2" />
          Connect Email
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between bg-card">
        <div>
          <h1 className="text-xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Inbox insights and email activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['today', 'week', 'month'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  timeframe === t
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'today' ? 'Today' : t === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {loading && !stats ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle className="h-8 w-8 text-destructive mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={fetchStats}>Try Again</Button>
          </div>
        ) : !stats ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No data yet</h3>
            <p className="text-muted-foreground text-sm">Analytics will appear once we scan your inbox.</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Primary Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Inbox className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Inbox</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalEmails.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.totalThreads.toLocaleString()} threads</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-amber-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Unread</span>
                </div>
                <p className="text-2xl font-bold">{stats.unreadEmails.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalEmails > 0 ? Math.round((stats.unreadEmails / stats.totalEmails) * 100) : 0}% of inbox
                </p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Send className="h-4 w-4 text-emerald-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Sent</span>
                </div>
                <p className="text-2xl font-bold">{stats.sentEmails.toLocaleString()}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <Star className="h-4 w-4 text-yellow-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Starred</span>
                </div>
                <p className="text-2xl font-bold">{stats.starredEmails.toLocaleString()}</p>
              </Card>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">This {timeframe === 'today' ? 'Day' : timeframe === 'week' ? 'Week' : 'Month'}</span>
                </div>
                <p className="text-2xl font-bold">{stats.emailsInTimeframe}</p>
                <p className="text-xs text-muted-foreground mt-1">emails received</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-cyan-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Unique Senders</span>
                </div>
                <p className="text-2xl font-bold">{stats.uniqueSenders}</p>
                <p className="text-xs text-muted-foreground mt-1">in timeframe</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                    <ShieldAlert className="h-4 w-4 text-rose-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Spam</span>
                </div>
                <p className="text-2xl font-bold">{stats.spamEmails.toLocaleString()}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center">
                    <Trash2 className="h-4 w-4 text-gray-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Trash</span>
                </div>
                <p className="text-2xl font-bold">{stats.trashedEmails.toLocaleString()}</p>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Top Senders Bar Chart */}
              <Card className="p-6">
                <h3 className="font-medium mb-4">Top Senders</h3>
                {stats.topSenders.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.topSenders.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis
                        type="category"
                        dataKey="sender"
                        width={140}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: string) => v.length > 20 ? v.slice(0, 20) + '...' : v}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                    No sender data available
                  </div>
                )}
              </Card>

              {/* Email Distribution Pie Chart */}
              <Card className="p-6">
                <h3 className="font-medium mb-4">Inbox Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Read', value: stats.totalEmails - stats.unreadEmails },
                        { name: 'Unread', value: stats.unreadEmails },
                        { name: 'Starred', value: stats.starredEmails },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[0, 1, 2].map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[0] }} />
                    Read
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[1] }} />
                    Unread
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[2] }} />
                    Starred
                  </div>
                </div>
              </Card>
            </div>

            {/* Top Senders Table */}
            {stats.topSenders.length > 0 && (
              <Card className="p-6">
                <h3 className="font-medium mb-4">All Top Senders</h3>
                <div className="space-y-2">
                  {stats.topSenders.map((sender, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {sender.sender.charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 text-sm truncate">{sender.sender}</span>
                      <span className="text-sm text-muted-foreground">{sender.count} emails</span>
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(sender.count / stats.topSenders[0].count) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
