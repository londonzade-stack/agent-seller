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
} from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const features = [
    "Unlimited AI-generated email drafts",
    "Smart lead detection from inbox",
    "Custom persona templates",
    "Review before send workflow",
    "Activity tracking & analytics",
    "Email integration (Gmail, Outlook)",
    "Quick actions & automations",
    "Priority support",
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
              One plan with everything you need. No hidden fees, no complicated tiers.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="flex justify-center">
            <Card className="bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-white/10 p-8 max-w-md w-full">
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
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Button className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200" size="lg">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-zinc-400 dark:text-zinc-600 text-xs text-center mt-4">
                14-day free trial. No credit card required.
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
            <Button size="lg" className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 px-8">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
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
