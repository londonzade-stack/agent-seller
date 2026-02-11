'use client'

import { useState, useCallback, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { DashboardSidebar, type DashboardView } from './dashboard-sidebar'
import { AgentChat } from './agent-chat'
import { EmailConnect } from './email-connect'
import { DraftsView } from './drafts-view'
import { ContactsView } from './contacts-view'
import { AnalyticsView } from './analytics-view'

interface DashboardClientProps {
  user: User
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [activeView, setActiveView] = useState<DashboardView>('agent')
  const [isEmailConnected, setIsEmailConnected] = useState(false)
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null)

  const handleConnectionChange = useCallback((connected: boolean, email?: string) => {
    setIsEmailConnected(connected)
    setConnectedEmail(email || null)
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

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar
        user={user}
        activeView={activeView}
        onViewChange={setActiveView}
        isEmailConnected={isEmailConnected}
      />

      <main className="flex-1 flex flex-col">
        {activeView === 'agent' && (
          <AgentChat
            user={user}
            isEmailConnected={isEmailConnected}
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
      </main>
    </div>
  )
}
