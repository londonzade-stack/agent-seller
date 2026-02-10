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
  Clock,
  BarChart3,
  Inbox,
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
            <Button variant="ghost" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white" asChild>
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200" asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center">
            <Badge variant="secondary" className="mb-6 bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10">
              <Sparkles className="mr-2 h-3 w-3" />
              AI-Powered Email Intelligence
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Your inbox, managed
              <br />
              <span className="text-zinc-400 dark:text-zinc-500">by an AI agent</span>
            </h1>

            <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 mb-4">
              Not just a chatbot, but an <span className="text-zinc-900 dark:text-white font-medium">agent</span>.
            </p>
            <p className="max-w-2xl text-zinc-500 mb-10">
              Search, draft, organize, and analyze your email with 30+ AI-powered tools.
              A complete dashboard for contacts, drafts, and analytics. Built for teams that live in their inbox.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Button size="lg" className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 px-8" asChild>
                <Link href="/auth/sign-up">Get Started Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-zinc-300 dark:border-white/20 hover:bg-zinc-100 dark:hover:bg-white/10" asChild>
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </div>

            {/* Dashboard Preview */}
            <Card className="w-full max-w-4xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 p-0 overflow-hidden">
              <div className="flex border-b border-zinc-200 dark:border-white/10">
                <div className="w-48 border-r border-zinc-200 dark:border-white/10 p-4 space-y-2">
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg text-xs font-medium">
                    <Brain className="h-3 w-3" /> AI Agent
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-500">
                    <Inbox className="h-3 w-3" /> Inbox
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-500">
                    <FileText className="h-3 w-3" /> Drafts
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-500">
                    <Users className="h-3 w-3" /> Contacts
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-500">
                    <BarChart3 className="h-3 w-3" /> Analytics
                  </div>
                </div>
                <div className="flex-1 p-6">
                  <div className="flex flex-col items-center py-6">
                    <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-3">
                      <Brain className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">How can I help?</h3>
                    <p className="text-zinc-500 text-xs mb-4">Search, draft, organize, analyze</p>
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      <Card className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-white/10 px-3 py-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                        <span className="text-xs">Show unread from today</span>
                      </Card>
                      <Card className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-white/10 px-3 py-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                        <span className="text-xs">Draft a follow-up</span>
                      </Card>
                      <Card className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-white/10 px-3 py-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                        <span className="text-xs">Archive old emails</span>
                      </Card>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-2">
                    <Input
                      placeholder="Ask your AI agent anything..."
                      className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                      readOnly
                    />
                    <Button size="icon" className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg h-8 w-8">
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
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
              <div className="text-4xl md:text-5xl font-bold mb-2">30+</div>
              <div className="text-zinc-500 text-sm">AI-powered tools</div>
              <div className="text-zinc-400 dark:text-zinc-600 text-xs mt-1 uppercase tracking-wide">Built In</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">3x</div>
              <div className="text-zinc-500 text-sm">faster email workflows</div>
              <div className="text-zinc-400 dark:text-zinc-600 text-xs mt-1 uppercase tracking-wide">AI-Powered</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">100%</div>
              <div className="text-zinc-500 text-sm">human review before send</div>
              <div className="text-zinc-400 dark:text-zinc-600 text-xs mt-1 uppercase tracking-wide">You Stay In Control</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">5min</div>
              <div className="text-zinc-500 text-sm">setup time</div>
              <div className="text-zinc-400 dark:text-zinc-600 text-xs mt-1 uppercase tracking-wide">Connect & Go</div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <p className="text-zinc-500 text-sm uppercase tracking-wide mb-4">The Difference</p>
            <h2 className="text-4xl md:text-5xl font-bold">AgentSeller vs the old way</h2>
            <p className="text-zinc-500 mt-4 max-w-2xl mx-auto">
              Stop switching between tabs. Let an AI agent handle your email workflow.
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
              <div className="p-6 text-zinc-500 dark:text-zinc-400">Manual Workflow</div>
            </div>

            {[
              { feature: "Email Management", us: "AI agent with 30+ tools", them: "Manual inbox sorting" },
              { feature: "Draft Responses", us: "AI auto-drafts with context", them: "Write everything yourself" },
              { feature: "Contact Tracking", us: "Auto-detects from inbox", them: "Spreadsheets & CRMs" },
              { feature: "Inbox Analytics", us: "Real-time dashboard", them: "No visibility" },
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
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 border-t border-zinc-200 dark:border-white/10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-zinc-500 text-sm uppercase tracking-wide mb-4">Platform Features</p>
            <h2 className="text-4xl md:text-5xl font-bold">Everything you need to own your inbox</h2>
            <p className="text-zinc-500 mt-4 max-w-2xl mx-auto">
              A full dashboard with AI agent, contact pipeline, draft queue, and analytics.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: "AI Agent with 30+ Tools",
                description: "Search, send, draft, label, archive, trash, star, and analyze emails. All through natural language."
              },
              {
                icon: Users,
                title: "Contact Pipeline",
                description: "Automatically track contacts from your email. See interaction history, frequency, and last contact date."
              },
              {
                icon: FileText,
                title: "Draft Review Queue",
                description: "AI-generated drafts land in a visual queue. Review, edit, approve, or discard before anything gets sent."
              },
              {
                icon: BarChart3,
                title: "Inbox Analytics",
                description: "See your email patterns. Top senders, response times, volume trends, and unread counts at a glance."
              },
              {
                icon: Zap,
                title: "Bulk Operations",
                description: "Archive hundreds of emails, apply labels in batch, clean up your inbox -- all with a single command."
              },
              {
                icon: Shield,
                title: "Human Review Always",
                description: "Every AI-generated email goes through you first. Full control over what gets sent. No surprises."
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
            <h2 className="text-4xl md:text-5xl font-bold">Three steps to inbox zero</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex items-center justify-center mx-auto mb-6">
                <Mail className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div className="text-zinc-400 dark:text-zinc-600 text-sm mb-2">Step 1</div>
              <h3 className="text-xl font-semibold mb-2">Connect Your Email</h3>
              <p className="text-zinc-500 text-sm">Link your Gmail account. AgentSeller securely connects and starts analyzing your inbox.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex items-center justify-center mx-auto mb-6">
                <Brain className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div className="text-zinc-400 dark:text-zinc-600 text-sm mb-2">Step 2</div>
              <h3 className="text-xl font-semibold mb-2">AI Does The Work</h3>
              <p className="text-zinc-500 text-sm">Ask your agent to search, draft, organize, or analyze. It handles the heavy lifting.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex items-center justify-center mx-auto mb-6">
                <Send className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div className="text-zinc-400 dark:text-zinc-600 text-sm mb-2">Step 3</div>
              <h3 className="text-xl font-semibold mb-2">Review & Send</h3>
              <p className="text-zinc-500 text-sm">Every draft is presented for your review. Edit if needed, then send with confidence.</p>
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
                <div className="text-sm">Alex Chen &lt;alex.chen@acme-corp.com&gt;</div>
              </div>
              <div className="mb-4">
                <div className="text-xs text-zinc-400 dark:text-zinc-600 mb-1">Subject:</div>
                <div className="text-sm">Re: Q1 project timeline follow-up</div>
              </div>
              <div className="mb-6 pt-4 border-t border-zinc-200 dark:border-white/10">
                <div className="text-xs text-zinc-400 dark:text-zinc-600 mb-2 flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  AI-Generated Draft
                </div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-3">
                  <p>Hi Alex,</p>
                  <p>Thanks for the update on the Q1 timeline. I&apos;ve reviewed the milestones you shared and have a few thoughts on the delivery schedule.</p>
                  <p>The March 15th deadline works for the first phase. For the second phase, would it make sense to push to April 1st given the dependency on the API integration?</p>
                  <p>Happy to jump on a call this week to align. What does your Thursday look like?</p>
                  <p>Best,<br />[Your name]</p>
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
            Ready to take control of your inbox?
          </h2>
          <p className="text-zinc-500 mb-10 text-lg">
            Join teams that are getting more done with less email busywork.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 px-8" asChild>
              <Link href="/auth/sign-up">Start Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="border-zinc-300 dark:border-white/20 hover:bg-zinc-100 dark:hover:bg-white/10" asChild>
              <Link href="/pricing">View Pricing</Link>
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
