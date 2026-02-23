import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { ScrollReveal } from "@/components/scroll-reveal";
import { PricingCards } from "@/components/pricing-cards";
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

          <PricingCards />

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
                a: "You get 14 days of full access to Emailligence. After the trial, you can choose to subscribe or your account will be paused."
              },
              {
                q: "Do you offer annual pricing?",
                a: "Yes! Save 17% with annual billing. Basic is $200/year ($16.67/mo) and Pro is $400/year ($33.33/mo). Use the toggle at the top of the pricing cards to see annual rates."
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
