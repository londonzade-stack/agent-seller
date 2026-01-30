'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { DashboardSidebar } from './dashboard-sidebar'
import { AgentChat } from './agent-chat'
import { EmailConnect } from './email-connect'

interface DashboardClientProps {
  user: User
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [activeView, setActiveView] = useState<'agent' | 'email'>('agent')
  const [isEmailConnected, setIsEmailConnected] = useState(false)

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
            onConnect={() => setIsEmailConnected(true)}
            onDisconnect={() => setIsEmailConnected(false)}
          />
        )}
      </main>
    </div>
  )
}
