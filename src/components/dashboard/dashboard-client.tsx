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
import { UpdatesView } from './updates-view'
import { AdminView } from './admin-view'
import { CommandPalette } from './command-palette'
import { FeedbackButton } from './feedback-button'
import { Brain, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  if (urlView && ['agent', 'drafts', 'contacts', 'analytics', 'automations', 'updates', 'outreach', 'email-connect', 'billing', 'admin'].includes(urlView)) {
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
  const [outreachSessionId, setOutreachSessionId] = useState<string | undefined>()
  const [outreachKey, setOutreachKey] = useState(0)
  const [pendingOutreachPrompt, setPendingOutreachPrompt] = useState<string | undefined>()

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
    // Clear outreach session when navigating to outreach via sidebar (starts new chat)
    if (view === 'outreach') {
      setOutreachSessionId(undefined)
      setPendingOutreachPrompt(undefined)
      setOutreachKey(k => k + 1)
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

  // Check email connection status on dashboard mount (Gmail or Outlook)
  useEffect(() => {
    const checkEmailStatus = async () => {
      try {
        // Check Gmail first
        const gmailRes = await fetch('/api/auth/gmail/status')
        const gmailData = await gmailRes.json()
        if (gmailData.connected) {
          setIsEmailConnected(true)
          setConnectedEmail(gmailData.email || null)
          return
        }
        // If no Gmail, check Outlook
        const outlookRes = await fetch('/api/auth/outlook/status')
        const outlookData = await outlookRes.json()
        if (outlookData.connected) {
          setIsEmailConnected(true)
          setConnectedEmail(outlookData.email || null)
        }
      } catch (err) {
        console.error('Failed to check email status:', err)
      }
    }
    checkEmailStatus()
  }, [])

  // Handler for "Send to Agent" from contacts/analytics
  const handleSendToAgent = useCallback((context: string) => {
    setChatSessionId(undefined)
    setPendingPrompt(context)
    setChatKey(k => k + 1)
    setActiveView('agent')
  }, [])

  // Handler for "Send to Agent Pro" — navigates to outreach view with context
  const handleSendToProChat = useCallback((context: string) => {
    setOutreachSessionId(undefined)
    setPendingOutreachPrompt(context)
    setOutreachKey(k => k + 1)
    setActiveView('outreach')
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
        onOpenOutreachChat={(sid) => { setOutreachSessionId(sid); setOutreachKey(k => k + 1) }}
        isEmailConnected={isEmailConnected}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        billingGated={billingLoaded && !hasValidBilling}
        activeChatId={chatSessionId}
        activeOutreachChatId={outreachSessionId}
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
              onSendToAgent={handleSendToAgent}
              onSendToProChat={handleSendToProChat}
              userPlan={userPlan}
            />
          )}
          {activeView === 'analytics' && (
            <AnalyticsView
              isEmailConnected={isEmailConnected}
              onConnectEmail={() => setActiveView('email')}
              onSendToAgent={handleSendToAgent}
              onSendToProChat={handleSendToProChat}
              userPlan={userPlan}
              onNavigateToBilling={() => setActiveView('billing')}
            />
          )}
          {activeView === 'automations' && (
            <AutomationsView
              isEmailConnected={isEmailConnected}
              onConnectEmail={() => setActiveView('email')}
              onNavigateToAgent={(prompt?: string) => { setChatSessionId(undefined); setPendingPrompt(prompt); setChatKey(k => k + 1); setActiveView('agent') }}
              userPlan={userPlan}
              onNavigateToBilling={() => setActiveView('billing')}
            />
          )}
          {activeView === 'updates' && (
            <UpdatesView />
          )}
          {activeView === 'outreach' && (
            <OutreachView
              key={`outreach-${outreachKey}`}
              user={user}
              isEmailConnected={isEmailConnected}
              userPlan={userPlan}
              initialSessionId={outreachSessionId}
              initialPrompt={pendingOutreachPrompt}
              onNavigateToBilling={() => setActiveView('billing')}
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
              onSessionCreated={(sid) => setOutreachSessionId(sid)}
            />
          )}
          {activeView === 'billing' && (
            <BillingView onStatusChange={(status) => { setBillingStatus(status) }} onPlanChange={(plan) => setUserPlan(plan)} />
          )}
          {activeView === 'admin' && (
            <AdminView />
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
      <FeedbackButton />
    </div>
  )
}
