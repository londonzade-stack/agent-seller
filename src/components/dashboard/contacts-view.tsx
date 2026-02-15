'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Users,
  Mail,
  Search,
  RefreshCw,
  AlertCircle,
  ArrowUpDown,
  Clock,
  MessageSquare,
} from 'lucide-react'

interface Contact {
  email: string
  name: string
  totalEmails: number
  lastContactDate: string
  labels: string[]
}

interface ContactsViewProps {
  isEmailConnected: boolean
  onConnectEmail: () => void
}

export function ContactsView({ isEmailConnected, onConnectEmail }: ContactsViewProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'frequency'>('recent')

  const fetchContacts = async () => {
    if (!isEmailConnected) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/contacts')
      if (!res.ok) throw new Error('Failed to fetch contacts')
      const data = await res.json()
      setContacts(data.contacts || [])
    } catch {
      setError('Failed to load contacts. Try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [isEmailConnected])

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
      <header className="border-b border-zinc-200 dark:border-white/10 px-3 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-black">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold">Contacts</h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            {contacts.length > 0 ? `${contacts.length} contacts from your inbox` : 'People you email with'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortBy(sortBy === 'recent' ? 'frequency' : 'recent')}
            className="border-zinc-200 dark:border-white/10 text-xs sm:text-sm"
          >
            <ArrowUpDown className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{sortBy === 'recent' ? 'Most Recent' : 'Most Frequent'}</span>
            <span className="sm:hidden">{sortBy === 'recent' ? 'Recent' : 'Frequent'}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={fetchContacts} disabled={loading} className="border-zinc-200 dark:border-white/10">
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
            <Button variant="outline" onClick={fetchContacts} className="border-zinc-200 dark:border-white/10">Try Again</Button>
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
              {filteredContacts.map((contact) => (
                <Card key={contact.email} className="p-3 sm:p-4 border-zinc-200 dark:border-white/10 bg-white dark:bg-black hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
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
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
