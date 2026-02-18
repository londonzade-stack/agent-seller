'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AgentChat } from './agent-chat'
import {
  Globe,
  Search,
  ArrowRight,
  Sparkles,
  Building2,
  Users,
  Mail,
  Zap,
  BarChart3,
  Lock,
} from 'lucide-react'

interface OutreachViewProps {
  user: User
  isEmailConnected: boolean
  userPlan?: string
  onNavigateToBilling?: () => void
  onOpenCommandPalette?: () => void
}

export function OutreachView({ user, isEmailConnected, userPlan, onNavigateToBilling, onOpenCommandPalette }: OutreachViewProps) {
  const isPro = userPlan === 'pro'
  const [chatKey, setChatKey] = useState(0)
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>()

  const handleQuickStart = (prompt: string) => {
    setPendingPrompt(prompt)
    setChatKey(k => k + 1)
  }

  // Pro-gated upgrade CTA
  if (!isPro) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <header className="relative z-10 border-b border-white/30 dark:border-white/[0.06] px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-[#faf8f5] dark:bg-[#111113] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <Badge variant="secondary" className="bg-stone-100/80 dark:bg-zinc-800/80 text-stone-700 dark:text-zinc-300 border border-stone-200/60 dark:border-zinc-700/60 px-3 py-1 text-xs font-medium tracking-wide rounded-full">
            <Globe className="h-3 w-3 mr-1.5 text-stone-400 dark:text-zinc-500" />
            Outreach
            <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400">PRO</span>
          </Badge>
        </header>

        <div className="flex-1 overflow-auto p-3 sm:p-6">
          <div className="max-w-2xl mx-auto">
            {/* Upgrade Hero */}
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center mx-auto mb-6">
                <Lock className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Unlock Sales Outreach</h2>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-8">
                Upgrade to Pro to access web search, company research, and AI-powered sales outreach tools.
              </p>
              <Button
                onClick={onNavigateToBilling}
                className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 px-8"
                size="lg"
              >
                Upgrade to Pro — $40/mo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Feature Preview */}
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              {[
                { icon: Search, title: 'Web Search', desc: 'Search the web for companies, news, and market intel directly from your dashboard.' },
                { icon: Building2, title: 'Company Research', desc: 'Deep dive into any company — website, recent news, leadership, and competitive info.' },
                { icon: Mail, title: 'AI Outreach Drafts', desc: 'Draft personalized cold emails backed by real research. No more generic templates.' },
                { icon: Users, title: 'Contact Discovery', desc: 'Find decision makers and key contacts at target companies.' },
                { icon: Zap, title: 'Smart Automations', desc: 'Set up recurring tasks that run on a schedule to keep your inbox organized automatically.' },
                { icon: BarChart3, title: 'Campaign Tracking', desc: 'Track outreach campaigns from research to draft to sent.' },
              ].map((feat, i) => (
                <Card key={i} className="p-4 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center shrink-0">
                      <feat.icon className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{feat.title}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{feat.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Pro user — full BLITZ chat with outreach-focused suggestions
  return (
    <AgentChat
      key={`outreach-chat-${chatKey}`}
      user={user}
      isEmailConnected={isEmailConnected}
      initialPrompt={pendingPrompt}
      onOpenCommandPalette={onOpenCommandPalette}
      customWelcome={{
        title: 'Sales Outreach',
        subtitle: 'Search the web, research companies, and draft personalized outreach — all powered by BLITZ.',
        headerBadge: (
          <Badge variant="secondary" className="bg-stone-100/80 dark:bg-zinc-800/80 text-stone-700 dark:text-zinc-300 border border-stone-200/60 dark:border-zinc-700/60 px-3 py-1 text-xs font-medium tracking-wide rounded-full">
            <Globe className="h-3 w-3 mr-1.5 text-stone-400 dark:text-zinc-500" />
            Sales Outreach
            <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400">PRO</span>
          </Badge>
        ),
        suggestions: [
          {
            label: 'Find companies to sell to',
            prompt: 'Find medical companies we can sell our medical devices to. Research the top results and give me a breakdown of each company, what they do, and who the decision makers are.',
            icon: <Building2 className="h-4 w-4 text-amber-400" />,
          },
          {
            label: 'Cold outreach campaign',
            prompt: 'Find people looking at homes in my area and draft personalized cold outreach emails to each of them introducing my real estate services. Let me review each email before sending.',
            icon: <Mail className="h-4 w-4 text-amber-400" />,
          },
          {
            label: 'Draft emails for my industry',
            prompt: 'Reach out to consumers in our industry — find relevant companies, research them, and draft personalized cold emails for all of them. Present them in a table so I can review before sending.',
            icon: <Users className="h-4 w-4 text-amber-400" />,
          },
          {
            label: 'Analyze my inbox',
            prompt: 'Analyze my inbox and see what clients I need to respond to. Give me a breakdown preview table of all the emails organized by sender, with a summary of each conversation and what action is needed.',
            icon: <BarChart3 className="h-4 w-4 text-amber-400" />,
          },
        ],
      }}
    />
  )
}
