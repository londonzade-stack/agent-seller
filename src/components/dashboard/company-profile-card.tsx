'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Building2,
  Pencil,
  Check,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react'

interface CompanyProfile {
  company_name: string | null
  description: string | null
  user_role: string | null
  target_customer: string | null
  industry: string | null
  notes: string | null
}

interface CompanyProfileCardProps {
  /** 'inline' = compact card on outreach welcome; 'full' = full-width standalone page */
  variant?: 'inline' | 'full'
}

export function CompanyProfileCard({ variant = 'inline' }: CompanyProfileCardProps) {
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Form state
  const [companyName, setCompanyName] = useState('')
  const [description, setDescription] = useState('')
  const [userRole, setUserRole] = useState('')
  const [targetCustomer, setTargetCustomer] = useState('')
  const [industry, setIndustry] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/company-profile')
      if (res.ok) {
        const data = await res.json()
        if (data.profile) {
          setProfile(data.profile)
          populateForm(data.profile)
        }
      }
    } catch (err) {
      console.error('Failed to fetch company profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const populateForm = (p: CompanyProfile) => {
    setCompanyName(p.company_name || '')
    setDescription(p.description || '')
    setUserRole(p.user_role || '')
    setTargetCustomer(p.target_customer || '')
    setIndustry(p.industry || '')
    setNotes(p.notes || '')
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMessage(null)
    try {
      const res = await fetch('/api/company-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          description,
          userRole,
          targetCustomer,
          industry,
          notes,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
        setEditing(false)
        setSaveMessage('Saved')
        setTimeout(() => setSaveMessage(null), 2000)
      }
    } catch (err) {
      console.error('Failed to save profile:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) populateForm(profile)
    setEditing(false)
  }

  const hasProfile = profile && profile.company_name

  // ─── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <Card className={`border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 ${variant === 'full' ? 'p-6' : 'p-4'}`}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
          <span className="text-sm text-stone-400 dark:text-zinc-500">Loading company profile...</span>
        </div>
      </Card>
    )
  }

  // ─── Form (editing mode or empty state setup) ─────────────────
  if (editing || !hasProfile) {
    return (
      <Card className={`border-blue-200 dark:border-blue-900/40 bg-white dark:bg-zinc-900 overflow-hidden ${variant === 'full' ? '' : ''}`}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-800 dark:text-zinc-200">
                {hasProfile ? 'Edit Company Profile' : 'Tell BLITZ about your company'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-zinc-500">
                {hasProfile ? 'Update your info so BLITZ stays in sync' : 'BLITZ will use this to personalize every outreach, search, and draft'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cp-name" className="text-xs font-medium text-stone-600 dark:text-zinc-400">Company Name</Label>
              <Input
                id="cp-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Acme Corp"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-industry" className="text-xs font-medium text-stone-600 dark:text-zinc-400">Industry</Label>
              <Input
                id="cp-industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., Healthcare, Fintech, SaaS"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cp-desc" className="text-xs font-medium text-stone-600 dark:text-zinc-400">What does your company do?</Label>
            <textarea
              id="cp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., We build patient monitoring software that integrates with existing EHR systems, reducing nurse alert fatigue by 60%."
              rows={2}
              className="placeholder:text-muted-foreground dark:bg-input/30 border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cp-role" className="text-xs font-medium text-stone-600 dark:text-zinc-400">Your Role</Label>
              <Input
                id="cp-role"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                placeholder="e.g., VP of Sales, Founder, BDR"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-target" className="text-xs font-medium text-stone-600 dark:text-zinc-400">Target Customer</Label>
              <Input
                id="cp-target"
                value={targetCustomer}
                onChange={(e) => setTargetCustomer(e.target.value)}
                placeholder="e.g., Mid-market SaaS companies, CTOs"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cp-notes" className="text-xs font-medium text-stone-600 dark:text-zinc-400">Anything else BLITZ should know</Label>
            <textarea
              id="cp-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., We're launching a new product in Q2. Focus outreach on the Southeast US region."
              rows={2}
              className="placeholder:text-muted-foreground dark:bg-input/30 border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4"
            >
              {saving ? (
                <><Loader2 className="h-3 w-3 animate-spin mr-1.5" />Saving...</>
              ) : (
                <><Check className="h-3 w-3 mr-1.5" />Save Profile</>
              )}
            </Button>
            {hasProfile && (
              <Button variant="ghost" size="sm" onClick={handleCancel} className="text-xs px-3">
                <X className="h-3 w-3 mr-1" />Cancel
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  // ─── Filled state (compact summary) ───────────────────────────
  return (
    <Card className={`border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 ${variant === 'full' ? 'p-5' : 'p-3 sm:p-4'}`}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center shrink-0">
          <Building2 className="h-4 w-4 text-blue-500 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-stone-800 dark:text-zinc-200 truncate">{profile.company_name}</span>
            {profile.industry && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400 shrink-0">
                {profile.industry}
              </span>
            )}
          </div>
          {profile.description && (
            <p className="text-xs text-stone-500 dark:text-zinc-500 mt-0.5 line-clamp-1">{profile.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {profile.user_role && (
              <span className="text-[11px] text-stone-400 dark:text-zinc-600">{profile.user_role}</span>
            )}
            {profile.target_customer && (
              <span className="text-[11px] text-stone-400 dark:text-zinc-600">Target: {profile.target_customer}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {saveMessage && (
            <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-0.5">
              <Sparkles className="h-3 w-3" />{saveMessage}
            </span>
          )}
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  )
}
