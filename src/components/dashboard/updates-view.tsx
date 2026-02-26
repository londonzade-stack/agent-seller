'use client'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Newspaper,
  Zap,
  Sparkles,
  Clock,
  CheckCircle2,
  Mail,
  Search,
  Users,
  BarChart3,
  Globe,
  Repeat2,
  Shield,
  Star,
  FileText,
  Brain,
  Send,
  CalendarDays,
} from 'lucide-react'

type UpdateTier = 'blitz' | 'pro' | 'coming_soon'

interface UpdateItem {
  icon: typeof Zap
  title: string
  description: string
  tier: UpdateTier
  /** Show multiple tier badges (e.g., both AGENT and PRO) */
  extraTiers?: UpdateTier[]
}

const UPDATES: UpdateItem[] = [
  // ─── Coming Soon ─────────────────────────────────────────────────
  {
    icon: CalendarDays,
    title: 'Google Calendar Integration',
    description: 'View your schedule, create events, check availability, and let Agent coordinate meetings — all from chat.',
    tier: 'coming_soon',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics Dashboard',
    description: 'Response time tracking, email sentiment analysis, engagement metrics, and actionable inbox insights.',
    tier: 'coming_soon',
  },

  // ─── PRO Features ────────────────────────────────────────────────
  {
    icon: Globe,
    title: 'Web Search Integration',
    description: 'Agent can search the web to find real-time information, research topics, and enrich your email context with live data.',
    tier: 'pro',
  },
  {
    icon: Users,
    title: 'Company Discovery',
    description: 'Find companies by industry, location, and size. Get detailed company profiles for targeted outreach.',
    tier: 'pro',
  },
  {
    icon: Search,
    title: 'Deep Company Research',
    description: 'Research any company — get funding info, tech stack, recent news, key people, and competitive landscape.',
    tier: 'pro',
  },
  {
    icon: Mail,
    title: 'Sales Outreach Suite',
    description: 'Dedicated outreach chat with company context injection. Write personalized cold emails backed by real research.',
    tier: 'pro',
  },
  {
    icon: Repeat2,
    title: 'Automations',
    description: 'Set up recurring tasks that run daily, weekly, or monthly — auto-archive, auto-label, auto-trash, inbox stats, and more.',
    tier: 'pro',
  },
  {
    icon: FileText,
    title: 'Company Profiles',
    description: 'Save your company context — name, description, target customer, industry — and Agent injects it into every outreach.',
    tier: 'pro',
  },

  // ─── AGENT Features ──────────────────────────────────────────────
  {
    icon: Brain,
    title: 'AI Email Agent',
    description: 'Your intelligent email assistant that can search, read, compose, and manage your entire inbox through natural conversation.',
    tier: 'blitz',
  },
  {
    icon: Mail,
    title: 'Full Email Management',
    description: 'Send, draft, archive, trash, label, star, and organize emails. Bulk operations like mass trash and mass archive.',
    tier: 'blitz',
  },
  {
    icon: Search,
    title: 'Smart Email Search',
    description: 'Search your inbox with natural language — by sender, subject, date, read/unread status, and more.',
    tier: 'blitz',
  },
  {
    icon: Users,
    title: 'Contact Intelligence',
    description: 'Automatic contact history, sender lookups, and conversation context for every email thread.',
    tier: 'blitz',
  },
  {
    icon: BarChart3,
    title: 'Inbox Analytics',
    description: 'Detailed inbox stats — total emails, unread count, top senders, and activity breakdowns by timeframe.',
    tier: 'blitz',
  },
  {
    icon: Shield,
    title: 'Unsubscribe & Spam Tools',
    description: 'Find unsubscribable emails and bulk unsubscribe. Report spam and rescue emails from spam folder.',
    tier: 'blitz',
  },
  {
    icon: FileText,
    title: 'Draft Management',
    description: 'Create, update, send, and delete email drafts. Agent can prepare drafts for your review before sending.',
    tier: 'blitz',
  },
  {
    icon: Star,
    title: 'Smart Organization',
    description: 'Star, mark as important, create and apply labels, mark read/unread — all through simple conversation.',
    tier: 'blitz',
  },
  {
    icon: Send,
    title: 'Send to Agent',
    description: 'Send contacts and analytics data directly to Agent chat for collaboration — get AI-powered insights, draft emails, and take action on your data.',
    tier: 'blitz',
    extraTiers: ['pro'],
  },
]

const TIER_STYLES: Record<UpdateTier, {
  iconBg: string
  iconColor: string
  badgeBg: string
  badgeText: string
  badgeLabel: string
  badgeIcon: typeof Zap
  checkColor: string
}> = {
  blitz: {
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-500 dark:text-amber-400',
    badgeBg: 'bg-amber-500/10 dark:bg-amber-400/10',
    badgeText: 'text-amber-600 dark:text-amber-400',
    badgeLabel: 'AGENT',
    badgeIcon: Zap,
    checkColor: 'text-amber-400 dark:text-amber-500',
  },
  pro: {
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    iconColor: 'text-blue-500 dark:text-blue-400',
    badgeBg: 'bg-blue-500/10 dark:bg-blue-400/10',
    badgeText: 'text-blue-500 dark:text-blue-400',
    badgeLabel: 'PRO',
    badgeIcon: Sparkles,
    checkColor: 'text-blue-400 dark:text-blue-500',
  },
  coming_soon: {
    iconBg: 'bg-violet-50 dark:bg-violet-500/10',
    iconColor: 'text-violet-500 dark:text-violet-400',
    badgeBg: 'bg-violet-500/10 dark:bg-violet-400/10',
    badgeText: 'text-violet-500 dark:text-violet-400',
    badgeLabel: 'SOON',
    badgeIcon: Clock,
    checkColor: 'text-violet-400 dark:text-violet-500',
  },
}

function TierBadge({ tier }: { tier: UpdateTier }) {
  const style = TIER_STYLES[tier]
  const BadgeIcon = style.badgeIcon
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${style.badgeBg} ${style.badgeText}`}>
      <BadgeIcon className="h-2.5 w-2.5" />
      {style.badgeLabel}
    </span>
  )
}

export function UpdatesView() {
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <header className="relative z-10 border-b border-white/30 dark:border-white/[0.06] px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-[#faf8f5] dark:bg-[#111113] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="min-w-0">
          <Badge variant="secondary" className="bg-stone-100/80 dark:bg-zinc-800/80 text-stone-700 dark:text-zinc-300 border border-stone-200/60 dark:border-zinc-700/60 px-3 py-1 text-xs font-medium tracking-wide rounded-full">
            <Newspaper className="h-3 w-3 mr-1.5 text-stone-400 dark:text-zinc-500" />
            What&apos;s New
          </Badge>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Title Section */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white">What&apos;s New in Emailligence</h1>
            <p className="text-sm text-stone-500 dark:text-zinc-400 mt-1">Features, updates, and what&apos;s coming next.</p>
          </div>

          {/* Updates List */}
          <div className="space-y-3">
            {UPDATES.map((item, i) => {
              const Icon = item.icon
              const style = TIER_STYLES[item.tier]
              const isComingSoon = item.tier === 'coming_soon'
              return (
                <Card
                  key={i}
                  className="p-4 border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm dark:shadow-none hover:border-stone-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${style.iconBg}`}>
                      <Icon className={`h-4 w-4 ${style.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-stone-800 dark:text-zinc-200">{item.title}</h3>
                        <TierBadge tier={item.tier} />
                        {item.extraTiers?.map((t) => (
                          <TierBadge key={t} tier={t} />
                        ))}
                      </div>
                      <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 leading-relaxed">{item.description}</p>
                    </div>
                    {isComingSoon ? (
                      <Clock className="h-3.5 w-3.5 text-violet-400 dark:text-violet-500 shrink-0 mt-1" />
                    ) : (
                      <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 mt-1 ${style.checkColor}`} />
                    )}
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Footer CTA */}
          <div className="mt-8 text-center">
            <p className="text-xs text-stone-400 dark:text-zinc-600">
              Have a feature request?{' '}
              <a
                href="mailto:londo@emailligence.ai?subject=Feature Request"
                className="text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white underline underline-offset-2 transition-colors"
              >
                Let us know
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
