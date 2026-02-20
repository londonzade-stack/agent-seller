'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Mail,
  CheckCircle2,
  Shield,
  Zap,
  AlertCircle,
  Loader2,
  ExternalLink,
  Link2,
} from 'lucide-react'

type EmailProvider = 'gmail' | 'outlook'

interface EmailConnectProps {
  isConnected: boolean
  connectedEmail?: string | null
  onConnectionChange: (connected: boolean, email?: string) => void
}

export function EmailConnect({ isConnected, connectedEmail, onConnectionChange }: EmailConnectProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProvider, setLoadingProvider] = useState<EmailProvider | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [connectedProvider, setConnectedProvider] = useState<EmailProvider | null>(null)

  // Check email connection status on mount and after OAuth redirect
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Check Gmail first
        const gmailRes = await fetch('/api/auth/gmail/status')
        const gmailData = await gmailRes.json()

        if (gmailData.connected) {
          setConnectedProvider('gmail')
          onConnectionChange(true, gmailData.email)
          setCheckingStatus(false)
          return
        }

        // Check Outlook
        const outlookRes = await fetch('/api/auth/outlook/status')
        const outlookData = await outlookRes.json()

        if (outlookData.connected) {
          setConnectedProvider('outlook')
          onConnectionChange(true, outlookData.email)
        } else {
          onConnectionChange(false)
        }
      } catch (err) {
        console.error('Failed to check email status:', err)
      } finally {
        setCheckingStatus(false)
      }
    }

    checkConnection()

    // Check URL for OAuth callback result
    const params = new URLSearchParams(window.location.search)
    if (params.get('gmail_connected') === 'true' || params.get('outlook_connected') === 'true') {
      // Clear the URL param
      window.history.replaceState({}, '', '/dashboard')
      checkConnection()
    }

    const errorParam = params.get('error')
    if (errorParam?.startsWith('gmail_') || errorParam?.startsWith('outlook_')) {
      setError(getErrorMessage(errorParam))
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [onConnectionChange])

  const getErrorMessage = (errorCode: string): string => {
    const provider = errorCode.startsWith('outlook_') ? 'Outlook' : 'Gmail'
    const baseCode = errorCode.replace(/^(gmail_|outlook_)/, '')

    switch (baseCode) {
      case 'auth_denied':
        return `${provider} authorization was denied. Please try again.`
      case 'auth_invalid':
        return 'Invalid authorization response. Please try again.'
      case 'auth_expired':
        return 'Authorization expired. Please try again.'
      case 'auth_mismatch':
        return 'Session mismatch. Please log in and try again.'
      case 'auth_failed':
        return `Failed to connect ${provider}. Please try again.`
      default:
        return 'An error occurred. Please try again.'
    }
  }

  const handleConnect = async (provider: EmailProvider) => {
    setIsLoading(true)
    setLoadingProvider(provider)
    setError(null)

    try {
      const res = await fetch(`/api/auth/${provider}`)
      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to initiate ${provider} connection`)
      setIsLoading(false)
      setLoadingProvider(null)
    }
  }

  const handleDisconnect = async () => {
    if (!connectedProvider) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/auth/${connectedProvider}/status`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error(`Failed to disconnect ${connectedProvider === 'outlook' ? 'Outlook' : 'Gmail'}`)
      }

      setConnectedProvider(null)
      onConnectionChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect email')
    } finally {
      setIsLoading(false)
    }
  }

  const providerLabel = connectedProvider === 'outlook' ? 'Outlook' : 'Gmail'

  if (checkingStatus) {
    return (
      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="relative z-10 border-b border-white/30 dark:border-white/[0.06] px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-[#faf8f5] dark:bg-[#111113] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="min-w-0">
          <Badge variant="secondary" className="bg-stone-100/80 dark:bg-zinc-800/80 text-stone-700 dark:text-zinc-300 border border-stone-200/60 dark:border-zinc-700/60 px-3 py-1 text-xs font-medium tracking-wide rounded-full">
            <Link2 className="h-3 w-3 mr-1.5 text-stone-400 dark:text-zinc-500" />
            Email Connection
          </Badge>
        </div>
      </header>
      <div className="flex-1 p-4 sm:p-6 overflow-auto">
      <div className="max-w-2xl mx-auto">

        {error && (
          <Card className="p-4 mb-6 border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-900/10">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          </Card>
        )}

        {isConnected ? (
          <Card className="p-4 sm:p-6 border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-900/10">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base sm:text-lg mb-1">{providerLabel} Connected</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
                  Your {providerLabel} is connected. The AI agent can now scan for leads and help draft responses.
                </p>
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{connectedEmail || 'Connected'}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="border-red-200 dark:border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    `Disconnect ${providerLabel}`
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <>
            <Card className="p-4 sm:p-6 mb-4 sm:mb-6 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
              <div className="text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-7 w-7 sm:h-8 sm:w-8 text-zinc-500 dark:text-zinc-400" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Connect Your Email</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 max-w-md mx-auto">
                  Securely connect your email account. We&apos;ll be able to read your emails to identify leads and help draft responses.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    onClick={() => handleConnect('gmail')}
                    disabled={isLoading}
                    size="lg"
                    className="px-8 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 w-full sm:w-auto"
                  >
                    {isLoading && loadingProvider === 'gmail' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Connect Gmail
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleConnect('outlook')}
                    disabled={isLoading}
                    size="lg"
                    variant="outline"
                    className="px-8 w-full sm:w-auto"
                  >
                    {isLoading && loadingProvider === 'outlook' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Connect Outlook
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Card className="p-3 sm:p-4 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-500 dark:text-zinc-400" />
                </div>
                <h3 className="font-medium text-sm mb-1">Secure Connection</h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                  We use OAuth 2.0 for secure access. Your password is never stored.
                </p>
              </Card>

              <Card className="p-3 sm:p-4 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-500 dark:text-zinc-400" />
                </div>
                <h3 className="font-medium text-sm mb-1">AI-Powered</h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                  Our AI scans emails to identify leads and suggests personalized responses.
                </p>
              </Card>

              <Card className="p-3 sm:p-4 border-zinc-200 dark:border-white/10 bg-white dark:bg-black">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                  <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-500 dark:text-zinc-400" />
                </div>
                <h3 className="font-medium text-sm mb-1">Full Control</h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                  Review and approve every email before sending. You stay in control.
                </p>
              </Card>
            </div>

            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center mt-6">
              By connecting, you agree to our privacy policy. You can disconnect at any time.
            </p>
          </>
        )}
      </div>
      </div>
    </div>
  )
}
