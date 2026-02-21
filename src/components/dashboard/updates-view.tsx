'use client'

import { useState } from 'react'
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
  ArrowRight,
} from 'lucide-react'

type UpdateTab = 'basic' | 'pro' | 'coming_soon'

interface UpdateItem {
  icon: typeof Zap
  title: string
  description: string
  date?: string
  tag?: string
}

const BASIC_UPDATES: UpdateItem[] = [
  {
    icon: Brain,
    title: 'BLITZ AI Email Agent',
    description: 'Your intelligent email assistant that can search, read, compose, and manage your entire inbox through natural conversation.',
    date: 'Launch',
    tag: 'Core',
  },
  {
    icon: Mail,
    title: 'Full Email Management',
    description: 'Send, draft, archive, trash, label, star, and organize emails. Bulk operations like mass trash and mass archive.',
    tag: 'Core',
  },
  {
    icon: Search,
    title: 'Smart Email Search',
    description: 'Search your inbox with natural language — by sender, subject, date, read/unread status, and more.',
    tag: 'Core',
  },
  {
    icon: Users,
    title: 'Contact Intelligence',
    description: 'Automatic contact history, sender lookups, and conversation context for every email thread.',
    tag: 'Core',
  },
  {
    icon: BarChart3,
    title: 'Inbox Analytics',
    description: 'Detailed inbox stats — total emails, unread count, top senders, and activity breakdowns by timeframe.',
    tag: 'Core',
  },
  {
    icon: Shield,
    title: 'Unsubscribe & Spam Tools',
    description: 'Find unsubscribable emails and bulk unsubscribe. Report spam and rescue emails from spam folder.',
    tag: 'Core',
  },
  {
    icon: Repeat2,
    title: 'Email Automations',
    description: 'Set up recurring tasks that run daily, weekly, or monthly — auto-archive, auto-label, auto-trash, inbox stats, and more.',
    tag: 'Automation',
  },
  {
    icon: FileText,
    title: 'Draft Management',
    description: 'Create, update, send, and delete email drafts. BLITZ can prepare drafts for your review before sending.',
    tag: 'Core',
  },
  {
    icon: Star,
    title: 'Smart Organization',
    description: 'Star, mark as important, create and apply labels, mark read/unread — all through simple conversation.',
    tag: 'Core',
  },
]

const PRO_UPDATES: UpdateItem[] = [
  {
    icon: Globe,
    title: 'Web Search Integration',
    description: 'BLITZ can search the web to find real-time information, research topics, and enrich your email context with live data.',
    date: 'Launch',
    tag: 'Pro',
  },
  {
    icon: Users,
    title: 'Company Discovery',
    description: 'Find companies by industry, location, and size. Get detailed company profiles for targeted outreach.',
    tag: 'Pro',
  },
  {
    icon: Search,
    title: 'Deep Company Research',
    description: 'Research any company — get funding info, tech stack, recent news, key people, and competitive landscape.',
    tag: 'Pro',
  },
  {
    icon: Mail,
    title: 'Sales Outreach Suite',
    description: 'Dedicated outreach chat with company context injection. Write personalized cold emails backed by real research.',
    tag: 'Pro',
  },
  {
    icon: Repeat2,
    title: 'Hourly Automations',
    description: 'Pro users get hourly automation frequency in addition to daily, weekly, and monthly schedules.',
    tag: 'Pro',
  },
  {
    icon: FileText,
    title: 'Company Profiles',
    description: 'Save your company context — name, description, target customer, industry — and BLITZ injects it into every outreach.',
    tag: 'Pro',
  },
]

const COMING_SOON_UPDATES: UpdateItem[] = [
  {
    icon: Shield,
    title: 'Google & Outlook Verified',
    description: 'Official publisher verification from Google and Microsoft for enhanced trust and security.',
    tag: 'Security',
  },
  {
    icon: Users,
    title: 'Team & Business Plans',
    description: 'Multi-seat plans with shared contacts, templates, and team analytics for organizations.',
    tag: 'Teams',
  },
  {
    icon: Brain,
    title: 'Advanced AI Models',
    description: 'Choose between different AI models for speed vs depth. Faster responses for simple tasks, deeper analysis when you need it.',
    tag: 'AI',
  },
  {
    icon: Mail,
    title: 'Email Templates',
    description: 'Save and reuse email templates. BLITZ can customize templates with contact-specific details automatically.',
    tag: 'Productivity',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics Dashboard',
    description: 'Response time tracking, email sentiment analysis, engagement metrics, and actionable inbox insights.',
    tag: 'Analytics',
  },
  {
    icon: Globe,
    title: 'CRM Integrations',
    description: 'Connect with Salesforce, HubSpot, and other CRMs to sync contacts, deals, and email activity.',
    tag: 'Integrations',
  },
]

const TAB_CONFIG: Record<UpdateTab, { label: string; items: UpdateItem[]; emptyMessage: string }> = {
  basic: { label: 'Basic', items: BASIC_UPDATES, emptyMessage: 'No basic updates yet.' },
  pro: { label: 'Pro', items: PRO_UPDATES, emptyMessage: 'No pro updates yet.' },
  coming_soon: { label: 'Coming Soon', items: COMING_SOON_UPDATES, emptyMessage: 'Nothing coming soon yet.' },
}

export function UpdatesView() {
  const [activeTab, setActiveTab] = useState<UpdateTab>('basic')
  const config = TAB_CONFIG[activeTab]

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

          {/* Tab Bar */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setActiveTab('basic')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'basic'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/30 dark:border-amber-500/30'
                  : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 border border-stone-200/60 dark:border-zinc-700/60 hover:text-stone-700 dark:hover:text-zinc-300 hover:border-stone-300 dark:hover:border-zinc-600'
              }`}
            >
              <Zap className="h-3 w-3" />
              BLITZ
            </button>
            <button
              onClick={() => setActiveTab('pro')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'pro'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-400/30 dark:border-blue-500/30'
                  : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 border border-stone-200/60 dark:border-zinc-700/60 hover:text-stone-700 dark:hover:text-zinc-300 hover:border-stone-300 dark:hover:border-zinc-600'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              PRO
            </button>
            <button
              onClick={() => setActiveTab('coming_soon')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'coming_soon'
                  ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-400/30 dark:border-violet-500/30'
                  : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 border border-stone-200/60 dark:border-zinc-700/60 hover:text-stone-700 dark:hover:text-zinc-300 hover:border-stone-300 dark:hover:border-zinc-600'
              }`}
            >
              <Clock className="h-3 w-3" />
              Coming Soon
            </button>
          </div>

          {/* Updates List */}
          <div className="space-y-3">
            {config.items.map((item, i) => {
              const Icon = item.icon
              return (
                <Card
                  key={i}
                  className="p-4 border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm dark:shadow-none hover:border-stone-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      activeTab === 'pro'
                        ? 'bg-blue-50 dark:bg-blue-500/10'
                        : activeTab === 'coming_soon'
                          ? 'bg-violet-50 dark:bg-violet-500/10'
                          : 'bg-amber-50 dark:bg-amber-500/10'
                    }`}>
                      <Icon className={`h-4 w-4 ${
                        activeTab === 'pro'
                          ? 'text-blue-500 dark:text-blue-400'
                          : activeTab === 'coming_soon'
                            ? 'text-violet-500 dark:text-violet-400'
                            : 'text-amber-500 dark:text-amber-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-stone-800 dark:text-zinc-200">{item.title}</h3>
                        {item.tag && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            activeTab === 'pro'
                              ? 'bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400'
                              : activeTab === 'coming_soon'
                                ? 'bg-violet-500/10 text-violet-500 dark:bg-violet-400/10 dark:text-violet-400'
                                : 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400'
                          }`}>{item.tag}</span>
                        )}
                        {item.date && (
                          <span className="text-[10px] text-stone-400 dark:text-zinc-600">{item.date}</span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 leading-relaxed">{item.description}</p>
                    </div>
                    {activeTab === 'coming_soon' ? (
                      <Clock className="h-3.5 w-3.5 text-violet-400 dark:text-violet-500 shrink-0 mt-1" />
                    ) : (
                      <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 mt-1 ${
                        activeTab === 'pro' ? 'text-blue-400 dark:text-blue-500' : 'text-amber-400 dark:text-amber-500'
                      }`} />
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
