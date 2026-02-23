import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { ScrollReveal } from "@/components/scroll-reveal";
import {
  ArrowRight,
  CheckCircle2,
  Users,
  Mail,
  Brain,
  Shield,
  Zap,
  Globe,
  Search,
  Sparkles,
  LayoutDashboard,
  Building2,
  Clock,
  CalendarClock,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user
  const basicFeatures = [
    "Unlimited AI-generated email drafts",
    "Smart lead detection from inbox",
    "Custom persona templates",
    "Review before send workflow",
    "Activity tracking & analytics",
    "Email integration (Gmail, Outlook)",
    "30+ email management tools",
  ];

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
  ];

  const teamsFeatures = [
    { text: "Everything in Pro" },
    { text: "Team seat management" },
    { text: "Volume discounts (up to 50% off)" },
    { text: "Centralized billing" },
    { text: "Dedicated onboarding" },
    { text: "Priority support & SLA" },
  ];

  const teamsTiers = [
    { seats: 5, price: 150, perSeat: 30, discount: "25%" },
    { seats: 10, price: 250, perSeat: 25, discount: "37.5%" },
    { seats: 20, price: 400, perSeat: 20, discount: "50%" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white transition-colors">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/10">
              <Brain className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold font-mono tracking-wider">EMAILLIGENCE</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/#features" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Features</Link>
            <Link href="/#how-it-works" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">How it works</Link>
            <Link href="/pricing" className="text-sm text-zinc-900 dark:text-white font-medium">Pricing</Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isLoggedIn ? (
              <Button className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200" asChild>
                <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white" asChild>
                  <Link href="/auth/login">Log in</Link>
                </Button>
                <Button className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200" asChild>
                  <Link href="/auth/sign-up">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Pricing Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-zinc-500 text-sm uppercase tracking-wide mb-4">Pricing</p>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Simple, transparent pricing
              </h1>
              <p className="text-zinc-500 max-w-2xl mx-auto text-lg">
                Start with Basic email management or unlock the full power of AI-driven sales outreach with Pro.
              </p>
            </div>
          </ScrollReveal>

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
                    <span className="text-5xl font-bold">$20</span>
                    <span className="text-zinc-500">/month</span>
                  </div>
                  <p className="text-zinc-500 text-sm">per user</p>
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
                    <span className="text-5xl font-bold">$40</span>
                    <span className="text-zinc-500">/month</span>
                  </div>
                  <p className="text-zinc-500 text-sm">per user</p>
                </div>

                <div className="space-y-3 mb-8 flex-1">
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

          <p className="text-zinc-400 dark:text-zinc-600 text-xs text-center mt-6">
            Already have an account?{" "}
            <Link href="/dashboard" className="underline hover:text-zinc-600 dark:hover:text-zinc-400">
              Go to Billing in your dashboard
            </Link>
          </p>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-20 px-6 border-t border-zinc-200 dark:border-white/10">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Compare plans</h2>
              <p className="text-zinc-500">See what each plan includes.</p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Mail,
                title: "Email Management",
                description: "30+ tools to search, draft, send, archive, label, and organize your inbox with AI."
              },
              {
                icon: Brain,
                title: "AI-Powered Drafts",
                description: "Generate personalized email drafts based on context, thread history, and persona."
              },
              {
                icon: Shield,
                title: "Review Before Send",
                description: "Every AI-generated email goes through you first for approval. Full control, always."
              },
              {
                icon: CalendarClock,
                title: "Scheduled Sends (Pro)",
                description: "Schedule emails to send at the perfect time. BLITZ delivers them automatically."
              },
              {
                icon: Zap,
                title: "Automations (Pro)",
                description: "Set up recurring tasks on daily, weekly, or monthly schedules. BLITZ runs them automatically."
              },
              {
                icon: Globe,
                title: "Web Search (Pro)",
                description: "Search the web for companies, news, and intel. Powered by Exa.ai neural search."
              },
              {
                icon: Search,
                title: "Company Research (Pro)",
                description: "Deep dive into any company — website, recent news, leadership, and competitive info."
              },
              {
                icon: Building2,
                title: "Team Management (Teams)",
                description: "Centralized billing, seat management, and volume discounts for your entire organization."
              },
            ].map((feature, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <Card className="bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-white/10 p-6 h-full">
                  <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-zinc-500 text-sm">{feature.description}</p>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 border-t border-zinc-200 dark:border-white/10">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently asked questions</h2>
            </div>
          </ScrollReveal>

          <div className="space-y-6">
            {[
              {
                q: "How does the free trial work?",
                a: "You get 14 days of full access to Emailligence with no credit card required. After the trial, you can choose to subscribe or your account will be paused."
              },
              {
                q: "What's the difference between Basic and Pro?",
                a: "Basic includes all email management tools, AI drafts, and analytics. Pro adds automations, web search via Exa.ai, company research, sales outreach dashboard, contact discovery, and priority support."
              },
              {
                q: "Can I upgrade from Basic to Pro later?",
                a: "Yes! You can upgrade to Pro at any time from your dashboard's billing page. You'll immediately get access to all Pro features."
              },
              {
                q: "What email providers do you support?",
                a: "We currently support Gmail and Microsoft Outlook. More integrations are coming soon."
              },
              {
                q: "Do you offer team or business plans?",
                a: "Yes! Our Teams plan offers volume discounts starting at $30/seat for 5 seats (25% off Pro), down to $20/seat for 20 seats (50% off). All seats include full Pro features. Contact us for custom plans over 20 seats."
              },
              {
                q: "Is my data secure?",
                a: "Absolutely. We use enterprise-grade encryption and never store your email content permanently. Your data is processed securely and you maintain full control."
              },
            ].map((faq, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <Card className="bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-white/10 p-6">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-zinc-500 text-sm">{faq.a}</p>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-zinc-200 dark:border-white/10">
        <ScrollReveal>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to get started?
            </h2>
            <p className="text-zinc-500 mb-10">
              Join teams that are getting more done with less email busywork.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/sign-up">
                <Button size="lg" className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 px-8">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="mailto:sales@emailligence.ai">
                <Button size="lg" variant="outline" className="border-zinc-300 dark:border-white/20 hover:bg-zinc-100 dark:hover:bg-white/10">
                  Schedule a Demo
                </Button>
              </a>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-200 dark:border-white/10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/10">
                <Brain className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold font-mono tracking-wider">EMAILLIGENCE</span>
            </Link>
            <div className="flex items-center gap-8 text-sm text-zinc-500">
              <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms</Link>
              <a href="mailto:support@emailligence.ai" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Contact</a>
            </div>
            <div className="text-sm text-zinc-400 dark:text-zinc-600">
              &copy; 2026 Emailligence. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
