import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Target,
  ArrowRight,
  CheckCircle2,
  Users,
  Mail,
  Brain,
  Shield,
  Zap,
  Clock,
  FileText,
  Building,
  Headphones,
  Settings,
  UserCog,
  BadgePercent,
} from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const individualFeatures = [
    "Unlimited AI-generated email drafts",
    "Smart lead detection from inbox",
    "Custom persona templates",
    "Review before send workflow",
    "Activity tracking & analytics",
    "Email integration (Gmail, Outlook)",
    "Quick actions & automations",
    "Priority support",
  ];

  const businessFeatures = [
    { icon: BadgePercent, text: "Volume discounts on per-user pricing" },
    { icon: Headphones, text: "Dedicated account manager" },
    { icon: Settings, text: "Custom integrations & API access" },
    { icon: UserCog, text: "Team management & admin controls" },
    { icon: Shield, text: "SSO & advanced security" },
    { icon: Brain, text: "Custom AI model training" },
    { icon: FileText, text: "Onboarding & training sessions" },
    { icon: Zap, text: "SLA-backed uptime guarantee" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white transition-colors">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/10">
              <Target className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">AgentSeller</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/#features" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Features</Link>
            <Link href="/#how-it-works" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">How it works</Link>
            <Link href="/pricing" className="text-sm text-zinc-900 dark:text-white font-medium">Pricing</Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">Log in</Button>
            <Button className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Pricing Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-zinc-500 text-sm uppercase tracking-wide mb-4">Pricing</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Simple, transparent pricing
            </h1>
            <p className="text-zinc-500 max-w-2xl mx-auto text-lg">
              Start with a simple per-user plan, or talk to us about custom pricing for your team.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Individual Plan */}
            <Card className="bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-white/10 p-8">
              <div className="text-center mb-8">
                <Badge variant="secondary" className="mb-4 bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10">
                  <Users className="mr-2 h-3 w-3" />
                  Per User
                </Badge>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-5xl md:text-6xl font-bold">$10</span>
                  <span className="text-zinc-500">/month</span>
                </div>
                <p className="text-zinc-500 text-sm">per user account</p>
              </div>

              <div className="space-y-4 mb-8">
                {individualFeatures.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Link href="/auth/sign-up">
                <Button className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200" size="lg">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <p className="text-zinc-400 dark:text-zinc-600 text-xs text-center mt-4">
                14-day free trial. No credit card required.
              </p>
              <p className="text-zinc-400 dark:text-zinc-600 text-xs text-center mt-2">
                Already have an account?{" "}
                <Link href="/dashboard" className="underline hover:text-zinc-600 dark:hover:text-zinc-400">
                  Go to Billing in your dashboard
                </Link>
              </p>
            </Card>

            {/* Business Plan */}
            <Card className="bg-zinc-50 dark:bg-zinc-900/30 border-2 border-zinc-300 dark:border-white/20 p-8 relative">
              <div className="text-center mb-8">
                <Badge variant="secondary" className="mb-4 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-900 dark:hover:bg-white">
                  <Building className="mr-2 h-3 w-3" />
                  Business
                </Badge>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-5xl md:text-6xl font-bold">Custom</span>
                </div>
                <p className="text-zinc-500 text-sm">tailored to your team</p>
              </div>

              <p className="text-zinc-500 text-sm text-center mb-6">
                Get a discounted per-user rate with volume pricing, plus dedicated support and custom integrations for your team.
              </p>

              <div className="space-y-4 mb-8">
                {businessFeatures.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <feature.icon className="h-5 w-5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                    <span className="text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>

              <a href="mailto:sales@agentseller.com">
                <Button variant="outline" className="w-full border-zinc-300 dark:border-white/20 hover:bg-zinc-100 dark:hover:bg-white/10" size="lg">
                  Contact Sales <Mail className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <p className="text-zinc-400 dark:text-zinc-600 text-xs text-center mt-4">
                We&apos;ll get back to you within one business day.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 border-t border-zinc-200 dark:border-white/10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything included</h2>
            <p className="text-zinc-500">No feature gates. Every user gets full access.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Mail,
                title: "Smart Lead Detection",
                description: "Automatically scan your inbox for potential leads and opportunities."
              },
              {
                icon: Brain,
                title: "AI-Powered Drafts",
                description: "Generate personalized email drafts based on context and persona."
              },
              {
                icon: Shield,
                title: "Review Before Send",
                description: "Every AI-generated email goes through you first for approval."
              },
              {
                icon: FileText,
                title: "Custom Personas",
                description: "Create different persona templates for different contexts."
              },
              {
                icon: Zap,
                title: "Quick Actions",
                description: "One-click actions for common tasks and automations."
              },
              {
                icon: Clock,
                title: "Activity Tracking",
                description: "Track all your email activity and get AI-powered insights."
              },
            ].map((feature, i) => (
              <Card key={i} className="bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-white/10 p-6">
                <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-zinc-500 text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 border-t border-zinc-200 dark:border-white/10">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently asked questions</h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "How does the free trial work?",
                a: "You get 14 days of full access to AgentSeller with no credit card required. After the trial, you can choose to subscribe or your account will be paused."
              },
              {
                q: "Can I add more users later?",
                a: "Yes, you can add or remove users at any time. Each user is billed at $10/month and gets full access to all features."
              },
              {
                q: "What email providers do you support?",
                a: "We currently support Gmail and Microsoft Outlook. More integrations are coming soon."
              },
              {
                q: "Is my data secure?",
                a: "Absolutely. We use enterprise-grade encryption and never store your email content permanently. Your data is processed securely and you maintain full control."
              },
              {
                q: "How does Business pricing work?",
                a: "Business plans offer discounted per-user rates based on team size, along with dedicated support, custom integrations, and advanced admin controls. Contact our sales team and we'll put together a plan tailored to your organization."
              },
            ].map((faq, i) => (
              <Card key={i} className="bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-white/10 p-6">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-zinc-500 text-sm">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-zinc-200 dark:border-white/10">
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
            <Button size="lg" variant="outline" className="border-zinc-300 dark:border-white/20 hover:bg-zinc-100 dark:hover:bg-white/10">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-200 dark:border-white/10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/10">
                <Target className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold">AgentSeller</span>
            </Link>
            <div className="flex items-center gap-8 text-sm text-zinc-500">
              <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms</Link>
              <a href="mailto:support@agentseller.com" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Contact</a>
            </div>
            <div className="text-sm text-zinc-400 dark:text-zinc-600">
              &copy; 2026 AgentSeller. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
