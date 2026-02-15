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
  CreditCard,
  X,
  Lock,
} from 'lucide-react'

export type DashboardView = 'agent' | 'email' | 'drafts' | 'contacts' | 'analytics' | 'billing'

interface DashboardSidebarProps {
  user: User
  activeView: DashboardView
  onViewChange: (view: DashboardView) => void
  isEmailConnected: boolean
  mobileOpen?: boolean
  onMobileClose?: () => void
  billingGated?: boolean
}

export function DashboardSidebar({
  user,
  activeView,
  onViewChange,
  isEmailConnected,
  mobileOpen,
  onMobileClose,
  billingGated,
}: DashboardSidebarProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleNavClick = (view: DashboardView) => {
    onViewChange(view)
    onMobileClose?.()
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  const navItems: { id: DashboardView; label: string; icon: typeof Brain; badge?: string }[] = [
    { id: 'agent', label: 'AI Agent', icon: Brain },
    { id: 'drafts', label: 'Drafts', icon: FileText },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'email', label: 'Email Connection', icon: Mail },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ]

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 dark:bg-zinc-800">
            <Target className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">AgentSeller</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {/* Close button visible only on mobile overlay */}
          {onMobileClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileClose}
              className="lg:hidden h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isLocked = billingGated && item.id !== 'billing'
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              disabled={isLocked}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === item.id
                  ? 'bg-stone-800 dark:bg-zinc-200 text-white dark:text-black'
                  : isLocked
                    ? 'text-stone-300 dark:text-zinc-600 cursor-not-allowed'
                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {isLocked && (
                <Lock className="h-3 w-3 ml-auto" />
              )}
              {!isLocked && item.id === 'email' && (
                isEmailConnected ? (
                  <CheckCircle2 className="h-3 w-3 ml-auto text-emerald-500" />
                ) : (
                  <Circle className="h-3 w-3 ml-auto" />
                )
              )}
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-stone-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-medium">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-stone-500 dark:text-zinc-400 truncate">{user.email}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar - always visible on lg+ */}
      <aside className="hidden lg:flex w-64 border-r border-stone-200 dark:border-zinc-800 bg-[#faf8f5] dark:bg-[#111113] flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <aside className="fixed inset-y-0 left-0 z-50 w-[85vw] max-w-64 bg-[#faf8f5] dark:bg-[#111113] border-r border-stone-200 dark:border-zinc-800 flex flex-col lg:hidden shadow-2xl">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
