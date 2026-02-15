import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Brain, Mail, CheckCircle2 } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Brain className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold font-mono tracking-wider">EMAILLIGENCE</span>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Check your email</h1>
          <p className="text-muted-foreground mb-8">
            {"We've sent you a confirmation link. Please check your inbox and click the link to activate your account."}
          </p>

          <Card className="p-6 bg-card border-border text-left">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium mb-1">{"Didn't receive an email?"}</h3>
                <p className="text-sm text-muted-foreground">
                  Check your spam folder or make sure you entered the correct email address. The confirmation link expires in 24 hours.
                </p>
              </div>
            </div>
          </Card>

          <div className="mt-8">
            <Button asChild variant="outline" className="border-border">
              <Link href="/auth/login">
                Return to sign in
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
