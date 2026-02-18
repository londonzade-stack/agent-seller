'use client'

import { useState, useCallback, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { DashboardSidebar, type DashboardView } from './dashboard-sidebar'
import { AgentChat } from './agent-chat'
import { EmailConnect } from './email-connect'
import { DraftsView } from './drafts-view'
import { ContactsView } from './contacts-view'
import { AnalyticsView } from './analytics-view'
import { BillingView } from './billing-view'
import { AutomationsView } from './automations-view'
import { OutreachView } from './outreach-view'
import { CompanyProfileCard } from './company-profile-card'
import { CommandPalette } from './command-palette'
import { Brain, Menu, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface DashboardClientProps {
  user: User
}

// Update the URL params without a full navigation
function updateDashboardUrl(view: string, sessionId?: string) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  // Always set the view param (except for agent which is default)
  if (view === 'agent') {
    url.searchParams.delete('view')
  } else {
    url.searchParams.set('view', view)
  }
  // Only set chat param when on agent view with a session
  if (sessionId && view === 'agent') {
    url.searchParams.set('chat', sessionId)
  } else {
    url.searchParams.delete('chat')
  }
  window.history.replaceState({}, '', url.toString())
}

// Read URL params once for initial state (runs during SSR-safe client hydration)
function getInitialViewFromUrl(): DashboardView {
  if (typeof window === 'undefined') return 'agent'
  const params = new URLSearchParams(window.location.search)
  const chatId = params.get('chat')
  if (chatId) return 'agent'
  const urlView = params.get('view') as DashboardView | null
  if (urlView && ['agent', 'drafts', 'contacts', 'analytics', 'automations', 'outreach', 'company-profile', 'email-connect', 'billing'].includes(urlView)) {
    return urlView
  }
  return 'agent'
}

function getInitialChatFromUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const params = new URLSearchParams(window.location.search)
  return params.get('chat') || undefined
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [activeView, setActiveView] = useState<DashboardView>(getInitialViewFromUrl)
  const [isEmailConnected, setIsEmailConnected] = useState(false)
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [chatSessionId, setChatSessionId] = useState<string | undefined>(getInitialChatFromUrl)
  const [chatKey, setChatKey] = useState(() => getInitialChatFromUrl() ? 1 : 0)
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>()
  const [billingStatus, setBillingStatus] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<string>('basic')
  const [billingLoaded, setBillingLoaded] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [urlChatRestored, setUrlChatRestored] = useState(true)

  // Whether the user has a valid subscription (active or trialing)
  const hasValidBilling = billingStatus === 'active' || billingStatus === 'trialing'

  const handleConnectionChange = useCallback((connected: boolean, email?: string) => {
    setIsEmailConnected(connected)
    setConnectedEmail(email || null)
  }, [])

  // Sync URL whenever view or chatSessionId changes (but only after initial restore)
  useEffect(() => {
    if (urlChatRestored) {
      updateDashboardUrl(activeView, chatSessionId)
    }
  }, [activeView, chatSessionId, urlChatRestored])

  // Handle view changes — block non-billing views if billing isn't set up
  const handleViewChange = useCallback((view: DashboardView) => {
    if (!hasValidBilling && billingLoaded && view !== 'billing') {
      return
    }
    // Clear session ID when navigating to agent via sidebar (starts new chat)
    if (view === 'agent') {
      setChatSessionId(undefined)
      setPendingPrompt(undefined)
      setChatKey(k => k + 1)
    }
    setActiveView(view)
  }, [hasValidBilling, billingLoaded])

  const searchParams = useSearchParams()

  // Check billing status on mount (and after returning from Stripe checkout)
  // Only runs once on mount — not on every searchParams change
  useEffect(() => {
    const checkBilling = async () => {
      try {
        const res = await fetch('/api/billing/status')
        if (res.ok) {
          const data = await res.json()
          setBillingStatus(data.status)
          if (data.plan) setUserPlan(data.plan)
          const isValid = data.status === 'active' || data.status === 'trialing'
          // If returning from successful checkout, go to agent view
          if (isValid && searchParams.get('billing') === 'success') {
            setActiveView('agent')
          } else if (!isValid) {
            // If no valid billing, force to billing view
            setActiveView('billing')
          }
          // Otherwise, leave the current view alone (don't redirect away from billing)
        }
      } catch (err) {
        console.error('Failed to check billing status:', err)
      } finally {
        setBillingLoaded(true)
      }
    }
    checkBilling()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Check Gmail connection status on dashboard mount
  useEffect(() => {
    const checkGmailStatus = async () => {
      try {
        const res = await fetch('/api/auth/gmail/status')
        const data = await res.json()
        if (data.connected) {
          setIsEmailConnected(true)
          setConnectedEmail(data.email || null)
        }
      } catch (err) {
        console.error('Failed to check Gmail status:', err)
      }
    }
    checkGmailStatus()
  }, [])

  // Global Cmd+K / Ctrl+K shortcut to toggle command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="h-screen bg-[#faf8f5] dark:bg-[#111113] flex overflow-hidden">
      <DashboardSidebar
        user={user}
        activeView={activeView}
        onViewChange={handleViewChange}
        onOpenChat={(sid) => { setChatSessionId(sid); setChatKey(k => k + 1); setActiveView('agent') }}
        isEmailConnected={isEmailConnected}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        billingGated={billingLoaded && !hasValidBilling}
        activeChatId={chatSessionId}
        userPlan={userPlan}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header bar - visible only on small screens */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-stone-200 dark:border-zinc-800 bg-[#faf8f5]/80 dark:bg-[#111113]/80 backdrop-blur-md lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebarOpen(true)}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 dark:bg-zinc-800">
              <Brain className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold font-mono tracking-wider">EMAILLIGENCE</span>
          </Link>
          {/* Spacer to center the logo */}
          <div className="w-9" />
        </div>

        <main className="flex-1 flex flex-col min-h-0">
          {activeView === 'agent' && (
            <AgentChat
              key={`chat-${chatKey}`}
              user={user}
              isEmailConnected={isEmailConnected}
              initialSessionId={chatSessionId}
              initialPrompt={pendingPrompt}
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
              onSessionCreated={(sid) => setChatSessionId(sid)}
            />
          )}
          {activeView === 'email' && (
            <EmailConnect
              isConnected={isEmailConnected}
              connectedEmail={connectedEmail}
              onConnectionChange={handleConnectionChange}
            />
          )}
          {activeView === 'drafts' && (
            <DraftsView
              isEmailConnected={isEmailConnected}
              onConnectEmail={() => setActiveView('email')}
            />
          )}
          {activeView === 'contacts' && (
            <ContactsView
              isEmailConnected={isEmailConnected}
              onConnectEmail={() => setActiveView('email')}
            />
          )}
          {activeView === 'analytics' && (
            <AnalyticsView
              isEmailConnected={isEmailConnected}
              onConnectEmail={() => setActiveView('email')}
            />
          )}
          {activeView === 'automations' && (
            <AutomationsView
              isEmailConnected={isEmailConnected}
              onConnectEmail={() => setActiveView('email')}
              onNavigateToAgent={(prompt?: string) => { setChatSessionId(undefined); setPendingPrompt(prompt); setChatKey(k => k + 1); setActiveView('agent') }}
            />
          )}
          {activeView === 'outreach' && (
            <OutreachView
              user={user}
              isEmailConnected={isEmailConnected}
              userPlan={userPlan}
              onNavigateToBilling={() => setActiveView('billing')}
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            />
          )}
          {activeView === 'company-profile' && (
            <div className="flex-1 flex flex-col h-full">
              <header className="relative z-10 border-b border-white/30 dark:border-white/[0.06] px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-[#faf8f5] dark:bg-[#111113] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.04)]">
                <Badge variant="secondary" className="bg-stone-100/80 dark:bg-zinc-800/80 text-stone-700 dark:text-zinc-300 border border-stone-200/60 dark:border-zinc-700/60 px-3 py-1 text-xs font-medium tracking-wide rounded-full">
                  <Building2 className="h-3 w-3 mr-1.5 text-stone-400 dark:text-zinc-500" />
                  My Company
                  <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400">PRO</span>
                </Badge>
              </header>
              <div className="flex-1 overflow-auto p-3 sm:p-6 bg-[#faf8f5] dark:bg-[#111113]">
                <div className="max-w-2xl mx-auto">
                  <CompanyProfileCard variant="full" />
                </div>
              </div>
            </div>
          )}
          {activeView === 'billing' && (
            <BillingView onStatusChange={(status) => { setBillingStatus(status) }} onPlanChange={(plan) => setUserPlan(plan)} />
          )}
        </main>
      </div>

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNavigate={handleViewChange}
        onOpenChat={(sid) => { setChatSessionId(sid); setChatKey(k => k + 1); setActiveView('agent') }}
        billingGated={billingLoaded && !hasValidBilling}
      />
    </div>
  )
}
