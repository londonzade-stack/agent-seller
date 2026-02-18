'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Globe,
  Search,
  Loader2,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Building2,
  Users,
  Mail,
  Zap,
  BarChart3,
  Clock,
  Lock,
  CheckCircle2,
} from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  url: string
  description: string
  publishedDate?: string
}

interface OutreachViewProps {
  userPlan?: string
  onNavigateToAgent?: (prompt?: string) => void
  onNavigateToBilling?: () => void
}

export function OutreachView({ userPlan, onNavigateToAgent, onNavigateToBilling }: OutreachViewProps) {
  const isPro = userPlan === 'pro'
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim() || !isPro) return
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const res = await fetch('/api/outreach/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          filters: { numResults: 10 },
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Search failed')
      }
      const data = await res.json()
      setResults(data.results || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResearchAndDraft = (result: SearchResult) => {
    const prompt = `Research the company "${result.title}" (${result.url}) and then draft a personalized cold outreach email to them. Use the research to make the email specific and compelling.`
    onNavigateToAgent?.(prompt)
  }

  const handleResearch = (result: SearchResult) => {
    const prompt = `Research the company "${result.title}" (${result.url}). Give me a full briefing on what they do, recent news, leadership team, and any relevant info for outreach.`
    onNavigateToAgent?.(prompt)
  }

  // Pro-gated upgrade CTA
  if (!isPro) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <header className="relative z-10 border-b border-white/30 dark:border-white/[0.06] px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-[#faf8f5] dark:bg-[#111113] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <Badge variant="secondary" className="bg-stone-100/80 dark:bg-zinc-800/80 text-stone-700 dark:text-zinc-300 border border-stone-200/60 dark:border-zinc-700/60 px-3 py-1 text-xs font-medium tracking-wide rounded-full">
            <Globe className="h-3 w-3 mr-1.5 text-stone-400 dark:text-zinc-500" />
            Outreach
            <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400">PRO</span>
          </Badge>
        </header>

        <div className="flex-1 overflow-auto p-3 sm:p-6">
          <div className="max-w-2xl mx-auto">
            {/* Upgrade Hero */}
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center mx-auto mb-6">
                <Lock className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Unlock Sales Outreach</h2>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-8">
                Upgrade to Pro to access web search, company research, and AI-powered sales outreach tools.
              </p>
              <Button
                onClick={onNavigateToBilling}
                className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 px-8"
                size="lg"
              >
                Upgrade to Pro — $40/mo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Feature Preview */}
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              {[
                { icon: Search, title: 'Web Search', desc: 'Search the web for companies, news, and market intel directly from your dashboard.' },
                { icon: Building2, title: 'Company Research', desc: 'Deep dive into any company — website, recent news, leadership, and competitive info.' },
                { icon: Mail, title: 'AI Outreach Drafts', desc: 'Draft personalized cold emails backed by real research. No more generic templates.' },
                { icon: Users, title: 'Contact Discovery', desc: 'Find decision makers and key contacts at target companies.' },
                { icon: Zap, title: 'Smart Automations', desc: 'Set up recurring tasks that run on a schedule to keep your inbox organized automatically.' },
                { icon: BarChart3, title: 'Campaign Tracking', desc: 'Track outreach campaigns from research to draft to sent.' },
              ].map((feat, i) => (
                <Card key={i} className="p-4 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center shrink-0">
                      <feat.icon className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{feat.title}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{feat.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Pro user — full outreach dashboard
  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="relative z-10 border-b border-white/30 dark:border-white/[0.06] px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-[#faf8f5] dark:bg-[#111113] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <Badge variant="secondary" className="bg-stone-100/80 dark:bg-zinc-800/80 text-stone-700 dark:text-zinc-300 border border-stone-200/60 dark:border-zinc-700/60 px-3 py-1 text-xs font-medium tracking-wide rounded-full">
          <Globe className="h-3 w-3 mr-1.5 text-stone-400 dark:text-zinc-500" />
          Sales Outreach
          <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400">PRO</span>
        </Badge>
      </header>

      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Search Panel */}
          <Card className="p-4 sm:p-6 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-5 w-5 text-zinc-400" />
              <h3 className="font-medium">Find Companies & Prospects</h3>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder='e.g. "AI startups in Austin" or "sustainable fashion brands in NYC"'
                  className="flex-1 px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900 text-base outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  disabled={loading}
                />
                <Button
                  onClick={handleSearch}
                  disabled={loading || !query.trim()}
                  className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 px-6"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

            </div>
          </Card>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Results */}
          {searched && !loading && results.length === 0 && !error && (
            <div className="text-center py-12">
              <Search className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500 dark:text-zinc-400">No results found. Try a different search query.</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </p>
              </div>

              {results.map((result) => (
                <Card key={result.id} className="p-4 border-zinc-200 dark:border-white/10 bg-white dark:bg-black hover:border-zinc-300 dark:hover:border-white/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{result.title}</h4>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 shrink-0"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                      <p className="text-xs text-blue-500 dark:text-blue-400 truncate mb-2">{result.url}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{result.description}</p>
                      {result.publishedDate && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                          <Clock className="h-3 w-3" />
                          {new Date(result.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-white/5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-zinc-200 dark:border-zinc-700"
                      onClick={() => handleResearch(result)}
                    >
                      <Search className="h-3 w-3 mr-1" />
                      Research
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200"
                      onClick={() => handleResearchAndDraft(result)}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Draft Outreach
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Quick Start Cards — shown when no search has been performed */}
          {!searched && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Try These</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  {
                    title: 'Find companies to sell to',
                    desc: 'Search for target companies in your industry',
                    prompt: 'Find medical companies we can sell our medical devices to. Research the top results and give me a breakdown of each company, what they do, and who the decision makers are.',
                    icon: Building2,
                  },
                  {
                    title: 'Cold outreach campaign',
                    desc: 'Research prospects and draft personalized emails',
                    prompt: 'Find people looking at homes in my area and draft personalized cold outreach emails to each of them introducing my real estate services. Let me review each email before sending.',
                    icon: Mail,
                  },
                  {
                    title: 'Draft emails for my industry',
                    desc: 'Find prospects and batch-draft outreach',
                    prompt: 'Reach out to consumers in our industry — find relevant companies, research them, and draft personalized cold emails for all of them. Present them in a table so I can review before sending.',
                    icon: Users,
                  },
                  {
                    title: 'Analyze my inbox',
                    desc: 'Get a breakdown of who needs a response',
                    prompt: 'Analyze my inbox and see what clients I need to respond to. Give me a breakdown preview table of all the emails organized by sender, with a summary of each conversation and what action is needed.',
                    icon: BarChart3,
                  },
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => onNavigateToAgent?.(suggestion.prompt)}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-black hover:border-zinc-300 dark:hover:border-white/20 transition-colors text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <suggestion.icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-medium group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{suggestion.title}</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{suggestion.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Tips */}
              <Card className="p-4 border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/30">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Pro Tip</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Click any card above to have BLITZ handle it end-to-end — research, draft, and present everything for your review before any emails go out.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
