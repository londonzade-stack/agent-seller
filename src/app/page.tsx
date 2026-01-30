import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import {
  Mail,
  Users,
  Send,
  Brain,
  Zap,
  Shield,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  MessageSquare,
  FileText,
  Target,
  Clock
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white transition-colors">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/10">
              <Target className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">AgentSeller</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">How it works</a>
            <Link href="/pricing" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">Log in</Button>
            <Button className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center">
            <Badge variant="secondary" className="mb-6 bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10">
              <Sparkles className="mr-2 h-3 w-3" />
              AI-Powered Sales Intelligence
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              The AI platform for
              <br />
              <span className="text-zinc-400 dark:text-zinc-500">medical sales</span>
            </h1>

            <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 mb-4">
              Not just a chatbot, but an <span className="text-zinc-900 dark:text-white font-medium">agent</span>.
            </p>
            <p className="max-w-2xl text-zinc-500 mb-10">
              Track leads in your emails, auto-generate personalized responses with custom personas,
              and review everything before sending. Your AI sales assistant that actually works.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Button size="lg" className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 px-8">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-zinc-300 dark:border-white/20 hover:bg-zinc-100 dark:hover:bg-white/10">
                Schedule a Demo
              </Button>
            </div>

            {/* Agent Interface Preview */}
            <Card className="w-full max-w-3xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-4 w-4 text-zinc-500" />
                <span className="text-sm text-zinc-500">Sales Intelligence</span>
              </div>

              <div className="flex flex-col items-center py-8">
                <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-zinc-500 dark:text-zinc-400" />
                </div>
                <h3 className="text-xl font-medium mb-2">How can I assist you today?</h3>
                <p className="text-zinc-500 text-sm mb-6">Ask anything about your leads and emails</p>

                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  <Card className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-white/10 px-4 py-3 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                    <span className="text-sm">Find new leads from my inbox</span>
                  </Card>
                  <Card className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-white/10 px-4 py-3 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                    <span className="text-sm">Draft follow-up for Dr. Smith</span>
                  </Card>
                  <Card className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-white/10 px-4 py-3 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                    <span className="text-sm">Summarize this week&apos;s activity</span>
                  </Card>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-3">
                <span className="text-zinc-500">+</span>
                <Input
                  placeholder="Ask anything about your sales pipeline..."
                  className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
                <Button size="icon" className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 border-y border-zinc-200 dark:border-white/10">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">10hrs</div>
              <div className="text-zinc-500 text-sm">saved weekly on emails</div>
              <div className="text-zinc-400 dark:text-zinc-600 text-xs mt-1 uppercase tracking-wide">Sales Reps</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">3x</div>
              <div className="text-zinc-500 text-sm">faster response times</div>
              <div className="text-zinc-400 dark:text-zinc-600 text-xs mt-1 uppercase tracking-wide">AI-Powered</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">47%</div>
              <div className="text-zinc-500 text-sm">increase in reply rates</div>
              <div className="text-zinc-400 dark:text-zinc-600 text-xs mt-1 uppercase tracking-wide">Personalized</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">Zero</div>
              <div className="text-zinc-500 text-sm">emails sent without review</div>
              <div className="text-zinc-400 dark:text-zinc-600 text-xs mt-1 uppercase tracking-wide">Human Control</div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <p className="text-zinc-500 text-sm uppercase tracking-wide mb-4">The Difference</p>
            <h2 className="text-4xl md:text-5xl font-bold">AgentSeller vs Traditional CRMs</h2>
            <p className="text-zinc-500 mt-4 max-w-2xl mx-auto">
              See why medical sales teams are switching from legacy tools to AI-powered sales intelligence.
            </p>
          </div>

          <Card className="bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-white/10 overflow-hidden">
            <div className="grid grid-cols-3 border-b border-zinc-200 dark:border-white/10">
              <div className="p-6 text-zinc-500 dark:text-zinc-400">Feature</div>
              <div className="p-6 bg-zinc-100 dark:bg-zinc-900/50 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-zinc-200 dark:bg-white/10 flex items-center justify-center">
                  <Target className="h-4 w-4" />
                </div>
                AgentSeller
              </div>
              <div className="p-6 text-zinc-500 dark:text-zinc-400">Traditional CRMs</div>
            </div>

            {[
              { feature: "AI Agent", us: "Real agent that reads, drafts, tracks", them: "Basic chatbot suggestions" },
              { feature: "Email Response", us: "Auto-drafts with persona matching", them: "Manual templates only" },
              { feature: "Lead Tracking", us: "Auto-detects from inbox", them: "Manual entry required" },
              { feature: "Human Review", us: "Review before every send", them: "Auto-send or nothing" },
              { feature: "Setup Time", us: "5 minutes", them: "Weeks of configuration" },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-3 border-b border-zinc-200 dark:border-white/10 last:border-0">
                <div className="p-6 text-zinc-500 dark:text-zinc-400">{row.feature}</div>
                <div className="p-6 bg-zinc-100 dark:bg-zinc-900/50 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="text-sm">{row.us}</span>
                </div>
                <div className="p-6 flex items-center gap-2 text-zinc-500">
                  <XCircle className="h-5 w-5 text-red-400 dark:text-red-500/50 shrink-0" />
                  <span className="text-sm">{row.them}</span>
                </div>
              </div>
            ))}
          </Card>

          <div className="text-center mt-10">
            <p className="text-zinc-500 mb-4">Ready to leave legacy tools behind?</p>
            <Button className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 border-t border-zinc-200 dark:border-white/10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-zinc-500 text-sm uppercase tracking-wide mb-4">Platform Features</p>
            <h2 className="text-4xl md:text-5xl font-bold">Everything you need to close more deals</h2>
            <p className="text-zinc-500 mt-4 max-w-2xl mx-auto">
              AI-powered tools built specifically for medical sales professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Mail,
                title: "Smart Lead Detection",
                description: "Automatically scan your inbox for potential leads and opportunities. Our AI identifies key contacts and extracts relevant details."
              },
              {
                icon: Users,
                title: "Custom Personas",
                description: "Create different persona templates for different contexts - formal for hospital admins, friendly for longtime contacts, technical for clinicians."
              },
              {
                icon: FileText,
                title: "Auto-Draft Responses",
                description: "Generate personalized email drafts based on conversation history, lead context, and your chosen persona. Edit before sending."
              },
              {
                icon: Shield,
                title: "Review Before Send",
                description: "Every AI-generated email goes through you first. Review, edit, and approve. You maintain full control over your communications."
              },
              {
                icon: Zap,
                title: "Quick Actions",
                description: "One-click actions for common tasks: follow-up reminders, meeting requests, product info sharing, and quote generation."
              },
              {
                icon: Clock,
                title: "Activity Tracking",
                description: "Track all your email activity, response rates, and lead engagement. Get AI-powered insights on your sales performance."
              },
            ].map((feature, i) => (
              <Card key={i} className="bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-white/10 p-6 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-zinc-500 dark:text-zinc-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-zinc-500 text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 border-t border-zinc-200 dark:border-white/10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-zinc-500 text-sm uppercase tracking-wide mb-4">How It Works</p>
            <h2 className="text-4xl md:text-5xl font-bold">From inbox to closed deal</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex items-center justify-center mx-auto mb-6">
                <Mail className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div className="text-zinc-400 dark:text-zinc-600 text-sm mb-2">Step 1</div>
              <h3 className="text-xl font-semibold mb-2">Connect Your Email</h3>
              <p className="text-zinc-500 text-sm">Link your work email. AgentSeller scans for leads and tracks conversations automatically.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex items-center justify-center mx-auto mb-6">
                <Brain className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div className="text-zinc-400 dark:text-zinc-600 text-sm mb-2">Step 2</div>
              <h3 className="text-xl font-semibold mb-2">AI Does The Work</h3>
              <p className="text-zinc-500 text-sm">Our agent identifies leads, drafts personalized responses, and suggests optimal follow-up timing.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex items-center justify-center mx-auto mb-6">
                <Send className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div className="text-zinc-400 dark:text-zinc-600 text-sm mb-2">Step 3</div>
              <h3 className="text-xl font-semibold mb-2">Review & Send</h3>
              <p className="text-zinc-500 text-sm">Every email is presented for your review. Edit if needed, then send with confidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Email Preview Demo */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <Card className="bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-white/10 overflow-hidden">
            <div className="border-b border-zinc-200 dark:border-white/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-zinc-500" />
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Draft Email - Ready for Review</span>
              </div>
              <Badge className="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20">Pending Review</Badge>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="text-xs text-zinc-400 dark:text-zinc-600 mb-1">To:</div>
                <div className="text-sm">Dr. Sarah Johnson &lt;s.johnson@mercy-hospital.org&gt;</div>
              </div>
              <div className="mb-4">
                <div className="text-xs text-zinc-400 dark:text-zinc-600 mb-1">Subject:</div>
                <div className="text-sm">Follow-up: New surgical equipment demo - Mercy Hospital</div>
              </div>
              <div className="mb-6 pt-4 border-t border-zinc-200 dark:border-white/10">
                <div className="text-xs text-zinc-400 dark:text-zinc-600 mb-2 flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  AI-Generated Draft (Persona: Professional Healthcare)
                </div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-3">
                  <p>Dear Dr. Johnson,</p>
                  <p>Thank you for taking the time to discuss your department&apos;s equipment needs during our call last Tuesday. I wanted to follow up on the surgical suite demonstration we discussed.</p>
                  <p>Based on your team&apos;s workflow requirements, I believe our SurgicalPro X3 would be an excellent fit. I&apos;ve attached the technical specifications you requested, along with case studies from similar cardiology departments.</p>
                  <p>Would Thursday at 2pm work for a hands-on demo with your surgical team? I can also arrange for our clinical specialist to join.</p>
                  <p>Best regards,<br />[Your name]</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-200 dark:border-white/10">
                <Button className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve & Send
                </Button>
                <Button variant="outline" className="border-zinc-300 dark:border-white/20 hover:bg-zinc-100 dark:hover:bg-white/10">
                  Edit Draft
                </Button>
                <Button variant="ghost" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white ml-auto">
                  Discard
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-zinc-200 dark:border-white/10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to transform your sales workflow?
          </h2>
          <p className="text-zinc-500 mb-10 text-lg">
            Join medical sales professionals who are closing more deals with less busywork.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 px-8">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-zinc-300 dark:border-white/20 hover:bg-zinc-100 dark:hover:bg-white/10">
              Schedule a Demo
            </Button>
          </div>
          <p className="text-zinc-400 dark:text-zinc-600 text-sm mt-6">No credit card required. 14-day free trial.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-200 dark:border-white/10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/10">
                <Target className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold">AgentSeller</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-zinc-500">
              <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Contact</a>
            </div>
            <div className="text-sm text-zinc-400 dark:text-zinc-600">
              &copy; 2025 AgentSeller. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
