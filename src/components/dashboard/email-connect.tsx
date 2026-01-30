'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Mail,
  CheckCircle2,
  Shield,
  Zap,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react'

interface EmailConnectProps {
  isConnected: boolean
  connectedEmail?: string | null
  onConnectionChange: (connected: boolean, email?: string) => void
}

export function EmailConnect({ isConnected, connectedEmail, onConnectionChange }: EmailConnectProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  // Check Gmail connection status on mount and after OAuth redirect
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch('/api/auth/gmail/status')
        const data = await res.json()

        if (data.connected) {
          onConnectionChange(true, data.email)
        } else {
          onConnectionChange(false)
        }
      } catch (err) {
        console.error('Failed to check Gmail status:', err)
      } finally {
        setCheckingStatus(false)
      }
    }

    checkConnection()

    // Check URL for OAuth callback result
    const params = new URLSearchParams(window.location.search)
    if (params.get('gmail_connected') === 'true') {
      // Clear the URL param
      window.history.replaceState({}, '', '/dashboard')
      checkConnection()
    }

    const errorParam = params.get('error')
    if (errorParam?.startsWith('gmail_')) {
      setError(getErrorMessage(errorParam))
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [onConnectionChange])

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'gmail_auth_denied':
        return 'Gmail authorization was denied. Please try again.'
      case 'gmail_auth_invalid':
        return 'Invalid authorization response. Please try again.'
      case 'gmail_auth_expired':
        return 'Authorization expired. Please try again.'
      case 'gmail_auth_mismatch':
        return 'Session mismatch. Please log in and try again.'
      case 'gmail_auth_failed':
        return 'Failed to connect Gmail. Please try again.'
      default:
        return 'An error occurred. Please try again.'
    }
  }

  const handleConnect = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get OAuth URL from our API
      const res = await fetch('/api/auth/gmail')
      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate Gmail connection')
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/gmail/status', {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to disconnect Gmail')
      }

      onConnectionChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect Gmail')
    } finally {
      setIsLoading(false)
    }
  }

  if (checkingStatus) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2">Email Connection</h1>
          <p className="text-muted-foreground">
            Connect your Gmail to enable AI-powered lead detection and email drafting.
          </p>
        </div>

        {error && (
          <Card className="p-4 mb-6 border-destructive/50 bg-destructive/10">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </Card>
        )}

        {isConnected ? (
          <Card className="p-6 border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Gmail Connected</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Your Gmail is connected. The AI agent can now scan for leads and help draft responses.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Mail className="h-4 w-4" />
                  {connectedEmail || 'Connected'}
                </div>
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    'Disconnect Gmail'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <>
            <Card className="p-6 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Connect Your Gmail</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                  Securely connect your Gmail account using Google OAuth. We&apos;ll be able to read your emails to identify leads and help draft responses.
                </p>
                <Button
                  onClick={handleConnect}
                  disabled={isLoading}
                  size="lg"
                  className="px-8"
                >
                  {isLoading ? (
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
              </div>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">Secure Connection</h3>
                <p className="text-sm text-muted-foreground">
                  We use Google OAuth 2.0 for secure access. Your password is never stored.
                </p>
              </Card>

              <Card className="p-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">AI-Powered</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI scans emails to identify leads and suggests personalized responses.
                </p>
              </Card>

              <Card className="p-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3">
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">Full Control</h3>
                <p className="text-sm text-muted-foreground">
                  Review and approve every email before sending. You stay in control.
                </p>
              </Card>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-6">
              By connecting, you agree to our privacy policy. You can disconnect at any time.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
