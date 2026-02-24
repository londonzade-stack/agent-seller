'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Lock,
  Sparkles,
  Clock,
  TrendingUp,
  BarChart3,
  MailMinus,
  ArrowRight,
  Loader2,
  Zap,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────
interface ProAnalyticsData {
  dailyVolume: { date: string; count: number }[]
  hourlyDistribution: { hour: number; count: number }[]
  responseTimeStats: {
    avgMinutes: number
    fastestMinutes: number
    slowestMinutes: number
    medianMinutes: number
    sampleSize: number
  } | null
  unsubscribeSuggestions: { sender: string; count: number; emailId: string; canAutoUnsubscribe: boolean }[]
  aiSummary: string
  totalReceived: number
  totalSent: number
  uniqueSenders: number
}

interface ProAnalyticsSectionProps {
  userPlan?: string
  onNavigateToBilling: () => void
  isEmailConnected: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────
function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  const remaining = mins % 60
  if (hours < 24) return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

function formatHour(hour: number): string {
  if (hour === 0) return '12a'
  if (hour < 12) return `${hour}a`
  if (hour === 12) return '12p'
  return `${hour - 12}p`
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-3 py-2 shadow-lg">
      <p className="text-xs font-medium">{label}</p>
      <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{payload[0].value} emails</p>
    </div>
  )
}

// ─── Pro Lock Overlay ────────────────────────────────────────────
function ProLockOverlay({ onNavigateToBilling }: { onNavigateToBilling: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 rounded-xl">
      <div className="bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-zinc-200 dark:border-zinc-700 shadow-lg">
        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
          <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <p className="text-sm font-semibold mb-1">Pro Analytics</p>
        <p className="text-xs text-zinc-500 mb-3">Upgrade to unlock advanced insights</p>
        <Button size="sm" onClick={onNavigateToBilling} className="bg-zinc-900 dark:bg-white text-white dark:text-black text-xs">
          Upgrade to Pro <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────
export function ProAnalyticsSection({ userPlan, onNavigateToBilling, isEmailConnected }: ProAnalyticsSectionProps) {
  const isPro = userPlan === 'pro'
  const [data, setData] = useState<ProAnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isPro || !isEmailConnected) return
    setLoading(true)
    fetch('/api/analytics/pro')
      .then(res => {
        if (!res.ok) throw new Error('Failed')
        return res.json()
      })
      .then(d => setData(d))
      .catch(() => setError('Failed to load pro analytics'))
      .finally(() => setLoading(false))
  }, [isPro, isEmailConnected])

  if (!isEmailConnected) return null

  // Fake data for blurred preview
  const fakeDaily = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
    count: Math.floor(Math.random() * 30) + 5,
  }))
  const fakeHourly = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: Math.floor(Math.random() * 20) + 2 }))

  // Get max hour for color intensity
  const hourlyData = isPro && data ? data.hourlyDistribution : fakeHourly
  const maxHourCount = Math.max(...hourlyData.map(h => h.count), 1)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-blue-500" />
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Pro Analytics</h2>
        {!isPro && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">PRO</span>
        )}
      </div>

      {/* Loading */}
      {isPro && loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      )}

      {/* Error */}
      {isPro && error && (
        <Card className="p-6 text-center bg-white dark:bg-black border-zinc-200 dark:border-white/10">
          <p className="text-sm text-zinc-500">{error}</p>
        </Card>
      )}

      {/* ─── AI Summary Card ─── */}
      {(!isPro || data) && (
        <div className="relative">
          {!isPro && <ProLockOverlay onNavigateToBilling={onNavigateToBilling} />}
          <Card className={`p-5 bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20 border-blue-200/60 dark:border-blue-800/30 ${!isPro ? 'blur-[3px] pointer-events-none' : ''}`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 shrink-0">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">Inbox Intelligence</h3>
                <p className="text-sm text-blue-800/80 dark:text-blue-300/70 leading-relaxed">
                  {isPro && data ? data.aiSummary : 'Over the last 30 days, you received 342 emails from 67 unique senders and sent 89 emails. Your top sender is Newsletter Co with 28 emails. Your inbox is busiest around 10 AM.'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ─── Email Volume Over Time ─── */}
      {(!isPro || data) && (
        <div className="relative">
          {!isPro && <ProLockOverlay onNavigateToBilling={onNavigateToBilling} />}
          <Card className={`p-5 bg-white dark:bg-black border-zinc-200 dark:border-white/10 ${!isPro ? 'blur-[3px] pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold">Email Volume (30 Days)</h3>
            </div>
            <div className="h-[200px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={isPro && data ? data.dailyVolume : fakeDaily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateShort}
                    tick={{ fontSize: 10, fill: '#999' }}
                    interval={6}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#999' }} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* ─── Response Time + Busiest Hours Row ─── */}
      {(!isPro || data) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Response Time Stats */}
          <div className="relative">
            {!isPro && <ProLockOverlay onNavigateToBilling={onNavigateToBilling} />}
            <Card className={`p-5 bg-white dark:bg-black border-zinc-200 dark:border-white/10 h-full ${!isPro ? 'blur-[3px] pointer-events-none' : ''}`}>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold">Response Time</h3>
              </div>
              {(isPro && data?.responseTimeStats) ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Average</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatMinutes(data.responseTimeStats.avgMinutes)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Fastest</span>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{formatMinutes(data.responseTimeStats.fastestMinutes)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Slowest</span>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{formatMinutes(data.responseTimeStats.slowestMinutes)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Median</span>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{formatMinutes(data.responseTimeStats.medianMinutes)}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 pt-1">Based on {data.responseTimeStats.sampleSize} replies</p>
                </div>
              ) : isPro ? (
                <p className="text-sm text-zinc-400">Not enough sent emails to calculate response times.</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><span className="text-xs text-zinc-500">Average</span><span className="text-lg font-bold">2h 15m</span></div>
                  <div className="flex items-center justify-between"><span className="text-xs text-zinc-500">Fastest</span><span className="text-sm font-medium">4m</span></div>
                  <div className="flex items-center justify-between"><span className="text-xs text-zinc-500">Slowest</span><span className="text-sm font-medium">2d 6h</span></div>
                </div>
              )}
            </Card>
          </div>

          {/* Busiest Hours */}
          <div className="relative">
            {!isPro && <ProLockOverlay onNavigateToBilling={onNavigateToBilling} />}
            <Card className={`p-5 bg-white dark:bg-black border-zinc-200 dark:border-white/10 h-full ${!isPro ? 'blur-[3px] pointer-events-none' : ''}`}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-semibold">Busiest Hours</h3>
              </div>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <XAxis
                      dataKey="hour"
                      tickFormatter={formatHour}
                      tick={{ fontSize: 9, fill: '#999' }}
                      interval={2}
                    />
                    <YAxis tick={{ fontSize: 9, fill: '#999' }} width={25} />
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [`${value} emails`, 'Count']}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      labelFormatter={(hour: any) => formatHour(Number(hour))}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {hourlyData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={`rgba(245, 158, 11, ${0.2 + (entry.count / maxHourCount) * 0.8})`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ─── Unsubscribe Suggestions ─── */}
      {(!isPro || (data && data.unsubscribeSuggestions.length > 0)) && (
        <div className="relative">
          {!isPro && <ProLockOverlay onNavigateToBilling={onNavigateToBilling} />}
          <Card className={`p-5 bg-white dark:bg-black border-zinc-200 dark:border-white/10 ${!isPro ? 'blur-[3px] pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2 mb-4">
              <MailMinus className="h-4 w-4 text-red-500 dark:text-red-400" />
              <h3 className="text-sm font-semibold">Unsubscribe Suggestions</h3>
            </div>
            <div className="space-y-2">
              {(isPro && data ? data.unsubscribeSuggestions : [
                { sender: 'Marketing Newsletter', count: 28, canAutoUnsubscribe: true },
                { sender: 'Daily Digest', count: 22, canAutoUnsubscribe: true },
                { sender: 'Promo Alerts', count: 15, canAutoUnsubscribe: false },
              ]).map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{typeof item.sender === 'string' ? item.sender.split('<')[0].trim() : item.sender}</p>
                    <p className="text-xs text-zinc-400">{item.count} emails this month</p>
                  </div>
                  {item.canAutoUnsubscribe && (
                    <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full shrink-0">
                      Can unsubscribe
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
