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
import { CommandPalette } from './command-palette'
import { Brain, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface DashboardClientProps {
  user: User
}

// Read ?chat= param from URL on initial load
function getInitialChatId(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const params = new URLSearchParams(window.location.search)
  return params.get('chat') || undefined
}

// Update the URL ?chat= param without a full navigation
function updateChatUrl(sessionId: string | undefined) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (sessionId) {
    url.searchParams.set('chat', sessionId)
  } else {
    url.searchParams.delete('chat')
  }
  window.history.replaceState({}, '', url.toString())
}

export function DashboardClient({ user }: DashboardClientProps) {
  const initialChatId = getInitialChatId()
  const [activeView, setActiveView] = useState<DashboardView>(initialChatId ? 'agent' : 'agent')
  const [isEmailConnected, setIsEmailConnected] = useState(false)
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [chatSessionId, setChatSessionId] = useState<string | undefined>(initialChatId)
  const [chatKey, setChatKey] = useState(0)
  const [billingStatus, setBillingStatus] = useState<string | null>(null)
  const [billingLoaded, setBillingLoaded] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Whether the user has a valid subscription (active or trialing)
  const hasValidBilling = billingStatus === 'active' || billingStatus === 'trialing'

  const handleConnectionChange = useCallback((connected: boolean, email?: string) => {
    setIsEmailConnected(connected)
    setConnectedEmail(email || null)
  }, [])

  // Sync URL whenever chatSessionId changes
  useEffect(() => {
    updateChatUrl(chatSessionId)
  }, [chatSessionId])

  // Handle view changes — block non-billing views if billing isn't set up
  const handleViewChange = useCallback((view: DashboardView) => {
    if (!hasValidBilling && billingLoaded && view !== 'billing') {
      return
    }
    // Clear session ID when navigating to agent via sidebar (starts new chat)
    if (view === 'agent') {
      setChatSessionId(undefined)
      setChatKey(k => k + 1)
    }
    setActiveView(view)
  }, [hasValidBilling, billingLoaded])

  const searchParams = useSearchParams()

  // Check billing status on mount (and after returning from Stripe checkout)
  useEffect(() => {
    const checkBilling = async () => {
      try {
        const res = await fetch('/api/billing/status')
        if (res.ok) {
          const data = await res.json()
          setBillingStatus(data.status)
          const isValid = data.status === 'active' || data.status === 'trialing'
          // If returning from successful checkout, go to agent view
          if (isValid && searchParams.get('billing') === 'success') {
            setActiveView('agent')
          } else if (!isValid) {
            // If no valid billing, force to billing view
            setActiveView('billing')
          }
        }
      } catch (err) {
        console.error('Failed to check billing status:', err)
      } finally {
        setBillingLoaded(true)
      }
    }
    checkBilling()
  }, [searchParams])

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
          {activeView === 'billing' && (
            <BillingView onStatusChange={(status) => setBillingStatus(status)} />
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
