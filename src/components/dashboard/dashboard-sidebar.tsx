'use client'

import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'
import {
  Target,
  Brain,
  Mail,
  LogOut,
  CheckCircle2,
  Circle,
  FileText,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react'

export type DashboardView = 'agent' | 'email' | 'drafts' | 'contacts' | 'analytics'

interface DashboardSidebarProps {
  user: User
  activeView: DashboardView
  onViewChange: (view: DashboardView) => void
  isEmailConnected: boolean
}

export function DashboardSidebar({
  user,
  activeView,
  onViewChange,
  isEmailConnected,
}: DashboardSidebarProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  const navItems: { id: DashboardView; label: string; icon: typeof Brain; badge?: string }[] = [
    { id: 'agent', label: 'AI Agent', icon: Brain },
    { id: 'drafts', label: 'Drafts', icon: FileText },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'email', label: 'Email Connection', icon: Mail },
  ]

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Target className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">AgentSeller</span>
        </Link>
        <ThemeToggle />
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === item.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
            {item.id === 'email' && (
              isEmailConnected ? (
                <CheckCircle2 className="h-3 w-3 ml-auto text-emerald-500" />
              ) : (
                <Circle className="h-3 w-3 ml-auto" />
              )
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-border space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
