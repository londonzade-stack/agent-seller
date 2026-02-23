'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollReveal } from "@/components/scroll-reveal"
import {
  ArrowRight,
  CheckCircle2,
  Users,
  Zap,
  Sparkles,
  Building2,
} from "lucide-react"
import Link from "next/link"

const basicFeatures = [
  "Unlimited AI-generated email drafts",
  "Smart lead detection from inbox",
  "Custom persona templates",
  "Review before send workflow",
  "Activity tracking & analytics",
  "Email integration (Gmail, Outlook)",
  "30+ email management tools",
]

const proFeatures = [
  { text: "Everything in Basic" },
  { text: "Scheduled email sends", isNew: true },
  { text: "Recurring automations", isNew: true },
  { text: "Web search & research via Exa.ai", isNew: true },
  { text: "Sales outreach dashboard" },
  { text: "Company research & intel" },
  { text: "Contact discovery tools" },
  { text: "AI-powered cold outreach drafts" },
  { text: "Priority support" },
]

const teamsFeatures = [
  { text: "Everything in Pro" },
  { text: "Team seat management" },
  { text: "Volume discounts (up to 50% off)" },
  { text: "Centralized billing" },
  { text: "Dedicated onboarding" },
  { text: "Priority support & SLA" },
]

const teamsTiers = [
  { seats: 5, price: 150, perSeat: 30, discount: "25%" },
  { seats: 10, price: 250, perSeat: 25, discount: "37.5%" },
  { seats: 20, price: 400, perSeat: 20, discount: "50%" },
]

export function PricingCards() {
  const [isAnnual, setIsAnnual] = useState(false)

  const basicMonthly = 20
  const proMonthly = 40
  const basicAnnual = 200 // $16.67/mo
  const proAnnual = 400   // $33.33/mo

  const basicPrice = isAnnual ? basicAnnual : basicMonthly
  const proPrice = isAnnual ? proAnnual : proMonthly
  const basicPerMonth = isAnnual ? '$16.67' : '$20'
  const proPerMonth = isAnnual ? '$33.33' : '$40'

  return (
    <>
      {/* Monthly / Annual Toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`}>
          Monthly
        </span>
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          className={`relative w-14 h-7 rounded-full transition-colors ${isAnnual ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`} />
        </button>
        <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`}>
          Annual
        </span>
        {isAnnual && (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800/40 text-xs">
            Save 17%
          </Badge>
        )}
      </div>

      {/* Pricing Cards — 3 columns */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Basic Plan */}
        <ScrollReveal delay={0}>
          <Card className="bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-white/10 p-8 h-full flex flex-col">
            <div className="text-center mb-8">
              <Badge variant="secondary" className="mb-4 bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10">
                <Users className="mr-2 h-3 w-3" />
                Basic
              </Badge>
              <div className="flex items-baseline justify-center gap-2 mb-2">
                {isAnnual ? (
                  <>
                    <span className="text-2xl text-zinc-400 line-through">$20</span>
                    <span className="text-5xl font-bold">{basicPerMonth}</span>
                  </>
                ) : (
                  <span className="text-5xl font-bold">$20</span>
                )}
                <span className="text-zinc-500">/mo</span>
              </div>
              <p className="text-zinc-500 text-sm">
                {isAnnual ? `$${basicAnnual}/year — billed annually` : 'per user'}
              </p>
            </div>

            <div className="space-y-3 mb-8 flex-1">
              {basicFeatures.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <Link href="/auth/sign-up">
              <Button variant="outline" className="w-full border-zinc-300 dark:border-white/20 hover:bg-zinc-100 dark:hover:bg-white/10" size="lg">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="text-zinc-400 dark:text-zinc-600 text-xs text-center mt-4">
              14-day free trial.
            </p>
          </Card>
        </ScrollReveal>

        {/* Pro Plan — highlighted */}
        <ScrollReveal delay={100}>
          <Card className="bg-zinc-50 dark:bg-zinc-900/30 border-2 border-blue-500 dark:border-blue-400 p-8 relative h-full flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-blue-500 text-white hover:bg-blue-500 px-3 py-1 text-xs">
                <Sparkles className="mr-1 h-3 w-3" />
                Most Popular
              </Badge>
            </div>

            <div className="text-center mb-8">
              <Badge variant="secondary" className="mb-4 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-400/10">
                <Zap className="mr-2 h-3 w-3" />
                Pro
              </Badge>
              <div className="flex items-baseline justify-center gap-2 mb-2">
                {isAnnual ? (
                  <>
                    <span className="text-2xl text-zinc-400 line-through">$40</span>
                    <span className="text-5xl font-bold">{proPerMonth}</span>
                  </>
                ) : (
                  <span className="text-5xl font-bold">$40</span>
                )}
                <span className="text-zinc-500">/mo</span>
              </div>
              <p className="text-zinc-500 text-sm">
                {isAnnual ? `$${proAnnual}/year — billed annually` : 'per user'}
              </p>
            </div>

            <div className="space-y-3 mb-4 flex-1">
              {proFeatures.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className={`h-4 w-4 shrink-0 ${i === 0 ? 'text-emerald-500' : 'text-blue-500'}`} />
                  <span className={`text-sm ${i === 0 ? 'text-zinc-500' : 'font-medium'}`}>{feature.text}</span>
                  {feature.isNew && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500 text-white shrink-0">NEW</span>
                  )}
                </div>
              ))}
            </div>

            {/* Pro ROI messaging */}
            <div className="mb-6 p-3 rounded-lg bg-blue-500/5 dark:bg-blue-400/5 border border-blue-200/50 dark:border-blue-800/30">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1.5">What Pro unlocks:</p>
              <div className="space-y-1">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Research 100 companies in minutes</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Draft personalized cold emails at scale</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Automate your inbox cleanup weekly</p>
              </div>
            </div>

            <Link href="/auth/sign-up">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600" size="lg">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="text-zinc-400 dark:text-zinc-600 text-xs text-center mt-4">
              14-day free trial.
            </p>
          </Card>
        </ScrollReveal>

        {/* Teams Plan */}
        <ScrollReveal delay={200}>
          <Card className="bg-zinc-50 dark:bg-zinc-900/30 border-2 border-violet-500/50 dark:border-violet-400/30 p-8 relative h-full flex flex-col">
            <div className="text-center mb-6">
              <Badge variant="secondary" className="mb-4 bg-violet-500/10 dark:bg-violet-400/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 dark:hover:bg-violet-400/10">
                <Building2 className="mr-2 h-3 w-3" />
                Teams
              </Badge>
              <p className="text-zinc-500 text-sm">Volume discounts up to 50% off Pro</p>
            </div>

            {/* Tier pricing cards */}
            <div className="space-y-2.5 mb-6">
              {teamsTiers.map((tier, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    i === 2
                      ? 'border-violet-300 dark:border-violet-500/30 bg-violet-50/70 dark:bg-violet-500/10'
                      : 'border-zinc-200/80 dark:border-white/10 bg-white/50 dark:bg-white/[0.02]'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm">{tier.seats} seats</p>
                    <p className="text-xs text-zinc-500">${tier.perSeat}/seat/mo</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">${tier.price}</span>
                    <span className="text-xs text-zinc-500">/mo</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-500 text-white shrink-0">
                      {tier.discount} off
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 mb-8 flex-1">
              {teamsFeatures.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className={`h-4 w-4 shrink-0 ${i === 0 ? 'text-blue-500' : 'text-violet-500'}`} />
                  <span className={`text-sm ${i === 0 ? 'text-zinc-500' : 'font-medium'}`}>{feature.text}</span>
                </div>
              ))}
            </div>

            <a href="mailto:londo@emailligence.ai?subject=Teams Plan Inquiry">
              <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white dark:bg-violet-500 dark:hover:bg-violet-600" size="lg">
                Contact Sales <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <p className="text-zinc-400 dark:text-zinc-600 text-xs text-center mt-4">
              Custom plans available for 20+ seats
            </p>
          </Card>
        </ScrollReveal>
      </div>
    </>
  )
}
