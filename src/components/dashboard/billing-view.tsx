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
  Building2,
  ArrowRight,
} from 'lucide-react'

interface BillingStatus {
  status: string
  plan: string | null
  billingInterval: 'month' | 'year'
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

  // Sync isAnnual with existing billing interval when status loads
  useEffect(() => {
    if (billing?.billingInterval === 'year') {
      setIsAnnual(true)
    }
  }, [billing?.billingInterval])

  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>('basic')
  const [isAnnual, setIsAnnual] = useState(false)

  const handleCheckout = async (plan?: 'basic' | 'pro') => {
    const checkoutPlan = plan || selectedPlan
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: checkoutPlan, interval: isAnnual ? 'year' : 'month' }),
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

  // User has an active subscription (trialing with Stripe customer, or active)
  const isSubscribed = billing && (billing.status === 'active' || billing.status === 'trialing')
  // User needs to subscribe (no subscription, canceled, paused, or past_due)
  const needsSubscription = billing && !isSubscribed

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

            {/* ─── SUBSCRIBED VIEW (active or trialing with Stripe) ──── */}
            {isSubscribed && (
              <>
                {/* Status Card */}
                <Card className="p-4 sm:p-6 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                  <div className="flex items-start justify-between mb-4 gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-lg ${getStatusBg(billing.status)} flex items-center justify-center shrink-0`}>
                        {billing.status === 'active' ? (
                          <CheckCircle2 className={`h-5 w-5 ${getStatusColor(billing.status)}`} />
                        ) : (
                          <Clock className={`h-5 w-5 ${getStatusColor(billing.status)}`} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Current Plan</p>
                        <p className="text-base sm:text-lg font-semibold truncate">
                          Emailligence {billing.plan === 'pro' ? 'Pro' : 'Basic'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs sm:text-sm font-medium px-2 sm:px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap ${getStatusBg(billing.status)} ${getStatusColor(billing.status)}`}>
                      {getStatusLabel(billing.status)}
                    </span>
                  </div>

                  <div className="border-t border-zinc-200 dark:border-white/10 pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400">Price</span>
                      <span className="font-medium">
                        {billing.billingInterval === 'year'
                          ? `${billing.plan === 'pro' ? '$400' : '$200'} / year ($${billing.plan === 'pro' ? '33.33' : '16.67'}/mo)`
                          : `${billing.plan === 'pro' ? '$40' : '$20'} / month`}
                      </span>
                    </div>

                    {billing.status === 'trialing' && billing.trialEnd && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500 dark:text-zinc-400">Free trial ends</span>
                          <span className="font-medium">
                            {new Date(billing.trialEnd).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500 dark:text-zinc-400">First charge</span>
                          <span className="font-medium">
                            {new Date(billing.trialEnd).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </>
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

                {/* Trial info banner */}
                {billing.status === 'trialing' && (
                  <Card className="p-4 sm:p-6 border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-900 dark:text-blue-100">
                          {(() => {
                            const days = getTrialDaysLeft()
                            if (days === null) return 'Trial period active'
                            if (days === 0) return 'Your trial ends today'
                            return `${days} day${days === 1 ? '' : 's'} left in your free trial`
                          })()}
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          Your card on file will be charged automatically when the trial ends. You can cancel anytime from Manage Billing.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Manage Billing + Upgrade */}
                <Card className="p-4 sm:p-6 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                  <h3 className="font-medium mb-4">Manage Subscription</h3>
                  <div className="space-y-3">
                    {billing.plan === 'basic' && (
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
                        Upgrade to Pro — {isAnnual ? '$400/year' : '$40/month'}
                      </Button>
                    )}

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
                    <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center">
                      Update payment method, view invoices, or cancel subscription
                    </p>
                  </div>
                </Card>
              </>
            )}

            {/* ─── NEEDS SUBSCRIPTION VIEW (none, canceled, paused, past_due) ──── */}
            {needsSubscription && (
              <>
                {/* Past Due Banner */}
                {billing.status === 'past_due' && (
                  <Card className="p-4 sm:p-6 border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-amber-900 dark:text-amber-100">Payment failed</p>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          Please update your payment method to continue using Emailligence.
                        </p>
                        {billing.hasStripeCustomer && (
                          <Button
                            onClick={handlePortal}
                            disabled={actionLoading}
                            className="mt-3 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200"
                            size="sm"
                          >
                            {actionLoading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <ExternalLink className="h-4 w-4 mr-2" />
                            )}
                            Update Payment Method
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Canceled Banner */}
                {(billing.status === 'canceled' || billing.status === 'paused') && (
                  <Card className="p-4 sm:p-6 border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-500/10">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-zinc-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {billing.status === 'canceled' ? 'Subscription canceled' : 'Account paused'}
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                          Subscribe again to regain access to all features.
                        </p>
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
                          Get started with Emailligence
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                          Start your 14-day free trial. Your card won&apos;t be charged until the trial ends.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Plan Selection */}
                <Card className="p-4 sm:p-6 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                  <h3 className="font-medium mb-4">Choose a Plan</h3>
                  <div className="space-y-3">
                    {/* Monthly / Annual Toggle */}
                    <div className="flex items-center justify-center gap-3 pb-2">
                      <span className={`text-xs font-medium transition-colors ${!isAnnual ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`}>
                        Monthly
                      </span>
                      <button
                        onClick={() => setIsAnnual(!isAnnual)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${isAnnual ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isAnnual ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                      <span className={`text-xs font-medium transition-colors ${isAnnual ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`}>
                        Annual
                      </span>
                      {isAnnual && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                          Save 17%
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <button
                        onClick={() => setSelectedPlan('basic')}
                        className={`p-2.5 sm:p-3 rounded-xl border-2 text-left transition-all ${
                          selectedPlan === 'basic'
                            ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800/50'
                            : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
                        }`}
                      >
                        <p className="font-semibold text-sm">Basic</p>
                        <p className="text-lg font-bold mt-1">
                          {isAnnual ? (
                            <><span className="text-sm text-zinc-400 line-through mr-1">$20</span>$16.67</>
                          ) : (
                            '$20'
                          )}
                          <span className="text-xs font-normal text-zinc-500">/mo</span>
                        </p>
                        {isAnnual && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">$200/year</p>}
                        <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-1">Email management & analytics</p>
                      </button>
                      <button
                        onClick={() => setSelectedPlan('pro')}
                        className={`p-2.5 sm:p-3 rounded-xl border-2 text-left transition-all relative ${
                          selectedPlan === 'pro'
                            ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-500/10'
                            : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
                        }`}
                      >
                        <span className="absolute -top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500 text-white">PRO</span>
                        <p className="font-semibold text-sm">Pro</p>
                        <p className="text-lg font-bold mt-1">
                          {isAnnual ? (
                            <><span className="text-sm text-zinc-400 line-through mr-1">$40</span>$33.33</>
                          ) : (
                            '$40'
                          )}
                          <span className="text-xs font-normal text-zinc-500">/mo</span>
                        </p>
                        {isAnnual && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">$400/year</p>}
                        <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-1">+ Automations, outreach, research</p>
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
                      Start Free Trial — {isAnnual
                        ? `${selectedPlan === 'pro' ? '$400' : '$200'}/year after 14 days`
                        : `${selectedPlan === 'pro' ? '$40' : '$20'}/month after 14 days`}
                    </Button>
                    <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center">
                      14-day free trial. Cancel anytime.
                    </p>
                  </div>
                </Card>

              </>
            )}

            {/* Teams Plan CTA — always visible */}
            <Card className="p-4 sm:p-6 border-violet-200/50 dark:border-violet-500/20 bg-gradient-to-br from-violet-50/50 to-stone-50 dark:from-violet-950/20 dark:to-zinc-900/30">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-stone-900 dark:text-zinc-100">
                    Teams Plan
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Everything in Pro with volume discounts for your team.
                  </p>
                </div>
              </div>
              <div className="space-y-2 mb-4 p-3 rounded-xl bg-white/60 dark:bg-black/20 border border-violet-200/30 dark:border-violet-500/10">
                {[
                  { seats: 5, price: 150, perSeat: 30, discount: '25% off' },
                  { seats: 10, price: 250, perSeat: 25, discount: '37.5% off' },
                  { seats: 20, price: 400, perSeat: 20, discount: '50% off' },
                ].map((tier, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700 dark:text-zinc-300">
                      <span className="font-semibold">{tier.seats} seats</span>
                      <span className="text-zinc-400 dark:text-zinc-500 ml-1.5">(${tier.perSeat}/seat)</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-white">${tier.price}/mo</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-500 text-white shrink-0">
                        {tier.discount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <a
                href="mailto:londo@emailligence.ai?subject=Teams Plan Inquiry"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 dark:text-violet-300 hover:text-violet-900 dark:hover:text-violet-100 transition-colors"
              >
                Contact Sales for a free demo
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-2">
                Custom plans available for 20+ seats
              </p>
            </Card>

            {/* Sign out link */}
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
