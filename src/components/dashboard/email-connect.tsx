'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  onConnect: () => void
  onDisconnect: () => void
}

export function EmailConnect({ isConnected, onConnect, onDisconnect }: EmailConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [workEmail, setWorkEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsConnecting(true)
    setError(null)

    // Simulate OAuth flow - in production this would redirect to Google/Microsoft OAuth
    try {
      // Validate email format
      if (!workEmail.includes('@')) {
        throw new Error('Please enter a valid email address')
      }

      // Simulate connection delay
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      onConnect()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect email')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    setIsConnecting(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setWorkEmail('')
    onDisconnect()
    setIsConnecting(false)
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2">Email Connection</h1>
          <p className="text-muted-foreground">
            Connect your work email to enable AI-powered lead detection and email drafting.
          </p>
        </div>

        {isConnected ? (
          <Card className="p-6 border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Email Connected</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Your work email is connected. The AI agent can now scan for leads and help draft responses.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Mail className="h-4 w-4" />
                  {workEmail || 'work@company.com'}
                </div>
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={isConnecting}
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    'Disconnect Email'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <>
            <Card className="p-6 mb-6">
              <form onSubmit={handleConnect} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workEmail">Work Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="workEmail"
                      type="email"
                      placeholder="you@company.com"
                      value={workEmail}
                      onChange={(e) => setWorkEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We support Gmail, Outlook, and other major email providers.
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isConnecting}>
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Connect Email
                    </>
                  )}
                </Button>
              </form>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">Secure Connection</h3>
                <p className="text-sm text-muted-foreground">
                  We use OAuth 2.0 for secure access. Your password is never stored.
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
          </>
        )}
      </div>
    </div>
  )
}
