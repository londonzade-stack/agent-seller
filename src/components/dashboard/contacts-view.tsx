'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Users,
  Mail,
  Loader2,
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
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Contact Pipeline</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Connect your email to automatically build a contact pipeline from your inbox.
        </p>
        <Button onClick={onConnectEmail}>
          <Mail className="h-4 w-4 mr-2" />
          Connect Email
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between bg-card">
        <div>
          <h1 className="text-xl font-semibold">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            {contacts.length > 0 ? `${contacts.length} contacts from your inbox` : 'People you email with'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortBy(sortBy === 'recent' ? 'frequency' : 'recent')}
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {sortBy === 'recent' ? 'Most Recent' : 'Most Frequent'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchContacts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      <div className="px-6 py-3 border-b border-border bg-card">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading && contacts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle className="h-8 w-8 text-destructive mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={fetchContacts}>Try Again</Button>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No contacts yet</h3>
            <p className="text-muted-foreground text-sm text-center max-w-md">
              Contacts will appear here automatically as the AI agent analyzes your inbox. Use the AI agent to scan your emails first.
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-3">
              {filteredContacts.map((contact) => (
                <Card key={contact.email} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                    {(contact.name || contact.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{contact.name || contact.email}</p>
                    <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                    <div className="flex items-center gap-1" title="Total emails">
                      <MessageSquare className="h-3 w-3" />
                      {contact.totalEmails}
                    </div>
                    <div className="flex items-center gap-1" title="Last contact">
                      <Clock className="h-3 w-3" />
                      {new Date(contact.lastContactDate).toLocaleDateString()}
                    </div>
                  </div>
                  {contact.labels?.length > 0 && (
                    <div className="flex gap-1 shrink-0">
                      {contact.labels.slice(0, 2).map((label) => (
                        <Badge key={label} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
