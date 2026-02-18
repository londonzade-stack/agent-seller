'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  LogOut,
  Ticket,
  Building2,
  ArrowRight,
} from 'lucide-react'

interface BillingStatus {
  status: string
  plan: string | null
  trialEnd: string | null
  currentPeriodEnd: string | null
  hasStripeCustomer: boolean
}

interface BillingViewProps {
  onStatusChange?: (status: string) => void
  onPlanChange?: (plan: string) => void
}

export function BillingView({ onStatusChange, onPlanChange }: BillingViewProps) {
  const router = useRouter()
  const [billing, setBilling] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessCode, setAccessCode] = useState('')
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemMessage, setRedeemMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const fetchBillingStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/status')
      if (!res.ok) throw new Error('Failed to fetch billing status')
      const data = await res.json()
      setBilling(data)
      onStatusChange?.(data.status)
      if (data.plan) onPlanChange?.(data.plan)
    } catch {
      setError('Failed to load billing information. Try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBillingStatus()
  }, [])

  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>('basic')

  const handleCheckout = async (plan?: 'basic' | 'pro') => {
    const checkoutPlan = plan || selectedPlan
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: checkoutPlan }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to start checkout. Please try again.')
        return
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Failed to start checkout. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePortal = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to create portal session')
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Failed to open billing portal. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const getTrialDaysLeft = (): number | null => {
    if (!billing?.trialEnd) return null
    const now = new Date()
    const end = new Date(billing.trialEnd)
    const diff = end.getTime() - now.getTime()
    if (diff <= 0) return 0
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'trialing':
        return 'Free Trial'
      case 'active':
        return 'Active'
      case 'canceled':
        return 'Canceled'
      case 'past_due':
        return 'Past Due'
      case 'paused':
        return 'Paused'
      case 'none':
        return 'No Subscription'
      default:
        return 'Unknown'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-emerald-500'
      case 'trialing':
        return 'text-blue-500'
      case 'canceled':
      case 'none':
        return 'text-zinc-500'
      case 'past_due':
        return 'text-amber-500'
      case 'paused':
        return 'text-zinc-500'
      default:
        return 'text-zinc-500'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10'
      case 'trialing':
        return 'bg-blue-500/10'
      case 'canceled':
      case 'none':
        return 'bg-zinc-500/10'
      case 'past_due':
        return 'bg-amber-500/10'
      case 'paused':
        return 'bg-zinc-500/10'
      default:
        return 'bg-zinc-500/10'
    }
  }

  const handleRedeem = async () => {
    if (!accessCode.trim()) return
    setRedeemLoading(true)
    setRedeemMessage(null)
    try {
      const res = await fetch('/api/billing/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRedeemMessage({ type: 'error', text: data.error || 'Failed to redeem code' })
        return
      }
      setRedeemMessage({ type: 'success', text: 'Access code redeemed! You now have full access.' })
      setAccessCode('')
      fetchBillingStatus()
    } catch {
      setRedeemMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setRedeemLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="relative z-10 border-b border-white/30 dark:border-white/[0.06] px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-[#faf8f5] dark:bg-[#111113] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="min-w-0">
          <Badge variant="secondary" className="bg-stone-100/80 dark:bg-zinc-800/80 text-stone-700 dark:text-zinc-300 border border-stone-200/60 dark:border-zinc-700/60 px-3 py-1 text-xs font-medium tracking-wide rounded-full">
            <CreditCard className="h-3 w-3 mr-1.5 text-stone-400 dark:text-zinc-500" />
            Billing
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchBillingStatus}
          disabled={loading}
          className="border-stone-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/60 shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </header>

      <div className="flex-1 overflow-auto p-3 sm:p-6">
        {loading && !billing ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : error && !billing ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={fetchBillingStatus}
              className="border-zinc-200 dark:border-white/10"
            >
              Try Again
            </Button>
          </div>
        ) : billing ? (
          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
            {/* Error banner (non-fatal, shown above cards) */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Status Card */}
            <Card className="p-4 sm:p-6 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${getStatusBg(billing.status)} flex items-center justify-center`}>
                    {billing.status === 'active' ? (
                      <CheckCircle2 className={`h-5 w-5 ${getStatusColor(billing.status)}`} />
                    ) : billing.status === 'trialing' ? (
                      <Clock className={`h-5 w-5 ${getStatusColor(billing.status)}`} />
                    ) : (
                      <CreditCard className={`h-5 w-5 ${getStatusColor(billing.status)}`} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Current Plan</p>
                    <p className="text-lg font-semibold">
                      Emailligence {billing.plan === 'pro' ? 'Pro' : 'Basic'}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${getStatusBg(billing.status)} ${getStatusColor(billing.status)}`}>
                  {getStatusLabel(billing.status)}
                </span>
              </div>

              <div className="border-t border-zinc-200 dark:border-white/10 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Price</span>
                  <span className="font-medium">{billing.plan === 'pro' ? '$40' : '$10'} / month</span>
                </div>

                {billing.status === 'trialing' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Trial ends</span>
                    <span className="font-medium">
                      {billing.trialEnd
                        ? new Date(billing.trialEnd).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </span>
                  </div>
                )}

                {billing.status === 'active' && billing.currentPeriodEnd && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Next billing date</span>
                    <span className="font-medium">
                      {new Date(billing.currentPeriodEnd).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Trial Banner */}
            {billing.status === 'trialing' && (
              <Card className="p-4 sm:p-6 border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      {(() => {
                        const days = getTrialDaysLeft()
                        if (days === null) return 'Trial period active'
                        if (days === 0) return 'Your trial has expired'
                        return `${days} day${days === 1 ? '' : 's'} left in your trial`
                      })()}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {getTrialDaysLeft() === 0
                        ? 'Subscribe now to continue using Emailligence.'
                        : 'Subscribe before your trial ends to keep uninterrupted access.'}
                    </p>
                    <Button
                      onClick={() => handleCheckout()}
                      disabled={actionLoading}
                      className="mt-3 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200"
                      size="sm"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                      )}
                      Subscribe Now
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* No Subscription Banner */}
            {billing.status === 'none' && (
              <Card className="p-4 sm:p-6 border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-500/10">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-zinc-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      Get started with Emailligence Pro
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      Subscribe to unlock full access to your AI-powered sales assistant.
                    </p>
                    <Button
                      onClick={() => handleCheckout()}
                      disabled={actionLoading}
                      className="mt-3 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200"
                      size="sm"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                      )}
                      Subscribe Now
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Past Due / Canceled Banner */}
            {(billing.status === 'past_due' || billing.status === 'canceled' || billing.status === 'paused') && (
              <Card className="p-4 sm:p-6 border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      {billing.status === 'past_due'
                        ? 'Payment failed'
                        : billing.status === 'canceled'
                          ? 'Subscription canceled'
                          : 'Account paused'}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      {billing.status === 'past_due'
                        ? 'Please update your payment method to continue using Emailligence.'
                        : 'Subscribe again to regain access to all features.'}
                    </p>
                    <Button
                      onClick={() => handleCheckout()}
                      disabled={actionLoading}
                      className="mt-3 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200"
                      size="sm"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                      )}
                      Subscribe Now
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Plan Selection / Actions */}
            <Card className="p-4 sm:p-6 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
              <h3 className="font-medium mb-4">
                {(billing.status === 'active' || billing.status === 'past_due') ? 'Manage Subscription' : 'Choose a Plan'}
              </h3>
              <div className="space-y-3">
                {(billing.status === 'trialing' || billing.status === 'canceled' || billing.status === 'paused' || billing.status === 'none') && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSelectedPlan('basic')}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          selectedPlan === 'basic'
                            ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800/50'
                            : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
                        }`}
                      >
                        <p className="font-semibold text-sm">Basic</p>
                        <p className="text-lg font-bold mt-1">$10<span className="text-xs font-normal text-zinc-500">/mo</span></p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Email management & automations</p>
                      </button>
                      <button
                        onClick={() => setSelectedPlan('pro')}
                        className={`p-3 rounded-xl border-2 text-left transition-all relative ${
                          selectedPlan === 'pro'
                            ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-500/10'
                            : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
                        }`}
                      >
                        <span className="absolute -top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500 text-white">PRO</span>
                        <p className="font-semibold text-sm">Pro</p>
                        <p className="text-lg font-bold mt-1">$40<span className="text-xs font-normal text-zinc-500">/mo</span></p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">+ Web search, outreach, hourly cron</p>
                      </button>
                    </div>
                    <Button
                      onClick={() => handleCheckout()}
                      disabled={actionLoading}
                      className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                      )}
                      Subscribe — {selectedPlan === 'pro' ? '$40' : '$10'}/month
                    </Button>
                  </>
                )}

                {billing.plan === 'basic' && (billing.status === 'active') && (
                  <Button
                    onClick={() => handleCheckout('pro')}
                    disabled={actionLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    Upgrade to Pro — $40/month
                  </Button>
                )}

                {(billing.status === 'active' || billing.status === 'past_due') && billing.hasStripeCustomer && (
                  <Button
                    onClick={handlePortal}
                    disabled={actionLoading}
                    variant="outline"
                    className="w-full border-zinc-200 dark:border-white/10"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    Manage Billing
                  </Button>
                )}
              </div>
            </Card>

            {/* Access Code */}
            {(billing.status === 'none' || billing.status === 'trialing' || billing.status === 'canceled' || billing.status === 'paused') && (
              <Card className="p-4 sm:p-6 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                    <Ticket className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="font-medium">Have an access code?</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Enter your code to unlock free access</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={accessCode}
                    onChange={e => setAccessCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleRedeem()}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900 text-base outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 dark:focus:border-violet-400 transition-all font-mono tracking-wider uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
                    disabled={redeemLoading}
                  />
                  <Button
                    onClick={handleRedeem}
                    disabled={redeemLoading || !accessCode.trim()}
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-700 text-white dark:bg-violet-500 dark:hover:bg-violet-600 px-4"
                  >
                    {redeemLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Redeem'
                    )}
                  </Button>
                </div>
                {redeemMessage && (
                  <p className={`text-xs mt-2 ${redeemMessage.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {redeemMessage.text}
                  </p>
                )}
              </Card>
            )}

            {/* Business Plan CTA */}
            <Card className="p-4 sm:p-6 border-zinc-200 dark:border-white/10 bg-gradient-to-br from-zinc-50 to-stone-50 dark:from-zinc-900/50 dark:to-zinc-800/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-stone-600 dark:text-zinc-300" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-stone-900 dark:text-zinc-100">
                    Looking for a business plan?
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Get custom pricing, team seats, and dedicated support for your organization.
                  </p>
                  <a
                    href="mailto:hello@emailligence.com?subject=Business Plan Inquiry"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-700 dark:text-zinc-200 hover:text-stone-900 dark:hover:text-white mt-3 transition-colors"
                  >
                    Reach out for a free demo
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </Card>

            {/* Sign out link — always visible, helpful when billing-gated on mobile */}
            <div className="text-center pt-2">
              <button
                onClick={handleSignOut}
                className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors inline-flex items-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
