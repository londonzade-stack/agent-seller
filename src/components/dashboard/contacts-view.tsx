'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { getCached, setCache } from '@/lib/cache'
import {
  Users,
  Mail,
  Search,
  RefreshCw,
  AlertCircle,
  ArrowUpDown,
  Clock,
  MessageSquare,
  ChevronDown,
  Zap,
  Lock,
} from 'lucide-react'

interface Contact {
  email: string
  name: string
  totalEmails: number
  lastContactDate: string
  labels: string[]
}

interface ContactEmail {
  id: string
  subject: string
  from: string
  date: string
  snippet: string
}

interface ContactsViewProps {
  isEmailConnected: boolean
  onConnectEmail: () => void
  onSendToBlitz?: (context: string) => void
  onSendToProChat?: (context: string) => void
  userPlan?: string
}

export function ContactsView({ isEmailConnected, onConnectEmail, onSendToBlitz, onSendToProChat, userPlan }: ContactsViewProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'frequency'>('recent')
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [contactEmails, setContactEmails] = useState<ContactEmail[]>([])
  const [emailsLoading, setEmailsLoading] = useState(false)
  const [emailsError, setEmailsError] = useState<string | null>(null)
  const expandRef = useRef<HTMLDivElement>(null)

  const contactsCacheKey = 'contacts'

  const fetchContacts = useCallback(async (bypassCache = false) => {
    if (!isEmailConnected) return
    if (!bypassCache) {
      const cached = getCached<Contact[]>(contactsCacheKey)
      if (cached) {
        setContacts(cached)
        return
      }
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/contacts')
      if (!res.ok) throw new Error('Failed to fetch contacts')
      const data = await res.json()
      const result = data.contacts || []
      setContacts(result)
      setCache(contactsCacheKey, result)
    } catch {
      setError('Failed to load contacts. Try again.')
    } finally {
      setLoading(false)
    }
  }, [isEmailConnected])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const fetchContactEmails = useCallback(async (email: string) => {
    setEmailsLoading(true)
    setEmailsError(null)
    setContactEmails([])
    try {
      const res = await fetch(`/api/contacts/emails?sender=${encodeURIComponent(email)}`)
      if (!res.ok) throw new Error('Failed to fetch emails')
      const data = await res.json()
      setContactEmails(data.emails || [])
    } catch {
      setEmailsError('Failed to load emails for this contact.')
    } finally {
      setEmailsLoading(false)
    }
  }, [])

  const handleContactClick = useCallback((email: string) => {
    if (selectedContact === email) {
      setSelectedContact(null)
      setContactEmails([])
      setEmailsError(null)
    } else {
      setSelectedContact(email)
      fetchContactEmails(email)
      // Scroll the expanded section into view after animation starts
      setTimeout(() => {
        expandRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 350)
    }
  }, [selectedContact, fetchContactEmails])

  const filteredContacts = contacts
    .filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'frequency') return b.totalEmails - a.totalEmails
      return new Date(b.lastContactDate).getTime() - new Date(a.lastContactDate).getTime()
    })

  if (!isEmailConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
          <Users className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Contact Pipeline</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-center max-w-md">
          Connect your email to automatically build a contact pipeline from your inbox.
        </p>
        <Button onClick={onConnectEmail} className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
          <Mail className="h-4 w-4 mr-2" />
          Connect Email
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="relative z-10 border-b border-white/30 dark:border-white/[0.06] px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-[#faf8f5] dark:bg-[#111113] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="min-w-0">
          <Badge variant="secondary" className="bg-stone-100/80 dark:bg-zinc-800/80 text-stone-700 dark:text-zinc-300 border border-stone-200/60 dark:border-zinc-700/60 px-3 py-1 text-xs font-medium tracking-wide rounded-full">
            <Users className="h-3 w-3 mr-1.5 text-stone-400 dark:text-zinc-500" />
            Contacts
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortBy(sortBy === 'recent' ? 'frequency' : 'recent')}
            className="border-stone-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/60 shadow-sm text-xs sm:text-sm"
          >
            <ArrowUpDown className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{sortBy === 'recent' ? 'Most Recent' : 'Most Frequent'}</span>
            <span className="sm:hidden">{sortBy === 'recent' ? 'Recent' : 'Frequent'}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchContacts(true)} disabled={loading} className="border-stone-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/60 shadow-sm">
            <RefreshCw className={`h-4 w-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </header>

      <div className="px-3 sm:px-6 py-3 border-b border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 sm:p-6">
        {loading && contacts.length === 0 ? (
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-2 sm:gap-3">
              {[
                { nameW: 'w-32', emailW: 'w-44', delay: 0 },
                { nameW: 'w-28', emailW: 'w-52', delay: 80 },
                { nameW: 'w-36', emailW: 'w-48', delay: 160 },
                { nameW: 'w-24', emailW: 'w-40', delay: 240 },
                { nameW: 'w-40', emailW: 'w-36', delay: 320 },
                { nameW: 'w-20', emailW: 'w-44', delay: 400 },
                { nameW: 'w-32', emailW: 'w-52', delay: 480 },
                { nameW: 'w-28', emailW: 'w-48', delay: 560 },
              ].map((row, i) => (
                <div key={i} className="animate-skeleton-drop" style={{ animationDelay: `${row.delay}ms`, animationFillMode: 'both' }}>
                  <Card className="p-3 sm:p-4 border-stone-200 dark:border-zinc-800 bg-white dark:bg-black">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-stone-200 dark:bg-zinc-800 shrink-0 animate-pulse" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className={`h-4 ${row.nameW} rounded bg-stone-200 dark:bg-zinc-800 animate-pulse`} />
                        <div className={`h-3 ${row.emailW} rounded bg-stone-100 dark:bg-zinc-800/60 animate-pulse`} />
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                        <div className="h-3 w-6 rounded bg-stone-100 dark:bg-zinc-800/60 animate-pulse" />
                        <div className="hidden sm:block h-3 w-16 rounded bg-stone-100 dark:bg-zinc-800/60 animate-pulse" />
                      </div>
                      <div className="hidden sm:flex gap-1 shrink-0">
                        <div className="h-5 w-12 rounded-full bg-stone-100 dark:bg-zinc-800/60 animate-pulse" />
                        <div className="h-5 w-16 rounded-full bg-stone-100 dark:bg-zinc-800/60 animate-pulse" />
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">{error}</p>
            <Button variant="outline" onClick={() => fetchContacts(true)} className="border-zinc-200 dark:border-white/10">Try Again</Button>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
              <Users className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No contacts yet</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center max-w-md">
              Contacts will appear here automatically as the AI agent analyzes your inbox. Use the AI agent to scan your emails first.
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-2 sm:gap-3">
              {filteredContacts.map((contact) => {
                const isExpanded = selectedContact === contact.email
                return (
                  <div key={contact.email}>
                    <Card
                      className="p-3 sm:p-4 border-zinc-200 dark:border-white/10 bg-white dark:bg-black hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors cursor-pointer select-none"
                      onClick={() => handleContactClick(contact.email)}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-medium shrink-0">
                          {(contact.name || contact.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm sm:text-base">{contact.name || contact.email}</p>
                          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate">{contact.email}</p>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 shrink-0">
                          <div className="flex items-center gap-1" title="Total emails">
                            <MessageSquare className="h-3 w-3" />
                            {contact.totalEmails}
                          </div>
                          <div className="hidden sm:flex items-center gap-1" title="Last contact">
                            <Clock className="h-3 w-3" />
                            {new Date(contact.lastContactDate).toLocaleDateString()}
                          </div>
                        </div>
                        {contact.labels?.length > 0 && (
                          <div className="hidden sm:flex gap-1 shrink-0">
                            {contact.labels.slice(0, 2).map((label) => (
                              <Badge key={label} variant="secondary" className="text-xs bg-zinc-100 dark:bg-zinc-800 border-0">
                                {label}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <ChevronDown
                          className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </Card>

                    {/* Expandable email previews section */}
                    <div
                      ref={isExpanded ? expandRef : undefined}
                      className="overflow-hidden transition-all duration-300 ease-in-out"
                      style={{
                        maxHeight: isExpanded ? '2000px' : '0px',
                        opacity: isExpanded ? 1 : 0,
                      }}
                    >
                      <div className="pt-2 pb-1 pl-4 sm:pl-6 pr-1 sm:pr-2 space-y-2">
                        {emailsLoading ? (
                          <div className="space-y-2">
                            {[0, 1, 2].map((j) => (
                              <Card key={j} className="rounded-xl border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/30 p-3 sm:p-4 animate-email-drop" style={{ animationDelay: `${j * 120}ms` }}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="h-4 w-3/5 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                                  <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                                </div>
                                <div className="space-y-1.5">
                                  <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                                  <div className="h-3 w-4/5 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                                </div>
                              </Card>
                            ))}
                          </div>
                        ) : emailsError ? (
                          <div className="flex items-center justify-center py-6">
                            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">{emailsError}</span>
                          </div>
                        ) : contactEmails.length === 0 ? (
                          <div className="flex items-center justify-center py-6">
                            <Mail className="h-4 w-4 text-zinc-400 mr-2" />
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">No emails found from this contact.</span>
                          </div>
                        ) : (
                          contactEmails.map((email, idx) => (
                            <Card
                              key={email.id}
                              className="rounded-xl border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/30 p-3 sm:p-4 animate-email-drop"
                              style={{ animationDelay: `${idx * 120}ms` }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="font-medium text-sm truncate flex-1">
                                  {email.subject || '(No subject)'}
                                </p>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs text-zinc-500 dark:text-zinc-500 whitespace-nowrap">
                                    {email.date
                                      ? new Date(email.date).toLocaleDateString(undefined, {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                        })
                                      : ''}
                                  </span>
                                  {onSendToBlitz && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onSendToBlitz(`[Contact: ${contact.name || contact.email}] Email: "${email.subject || '(No subject)'}" from ${email.from} on ${email.date ? new Date(email.date).toLocaleDateString() : 'unknown date'} — "${email.snippet || ''}"`)
                                      }}
                                      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 hover:border-amber-400/40 text-amber-600 dark:text-amber-400 transition-colors text-[11px] font-medium"
                                      title="Send to BLITZ"
                                    >
                                      <Zap className="h-3 w-3" />
                                      <span className="hidden sm:inline">BLITZ</span>
                                    </button>
                                  )}
                                  {onSendToProChat && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (userPlan !== 'pro') return
                                        onSendToProChat(`[Contact: ${contact.name || contact.email}] Email: "${email.subject || '(No subject)'}" from ${email.from} on ${email.date ? new Date(email.date).toLocaleDateString() : 'unknown date'} — "${email.snippet || ''}"`)
                                      }}
                                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium transition-colors ${
                                        userPlan === 'pro'
                                          ? 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 hover:border-blue-500/40 text-blue-600 dark:text-blue-400 cursor-pointer'
                                          : 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/40 text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-60'
                                      }`}
                                      title={userPlan === 'pro' ? 'Send to BLITZ Pro (web search & research)' : 'Upgrade to Pro to unlock'}
                                      disabled={userPlan !== 'pro'}
                                    >
                                      {userPlan === 'pro' ? <Zap className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                      <span className="hidden sm:inline">PRO</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-zinc-400 line-clamp-2">
                                {email.snippet || 'No preview available.'}
                              </p>
                            </Card>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
