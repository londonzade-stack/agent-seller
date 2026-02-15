import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Brain, AlertCircle } from 'lucide-react'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

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
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Authentication Error</h1>
          <p className="text-muted-foreground mb-8">
            Something went wrong during authentication.
          </p>

          <Card className="p-6 bg-card border-border text-left">
            <p className="text-sm text-muted-foreground">
              {params?.error ? (
                <>Error code: <code className="bg-muted px-1 py-0.5 rounded text-foreground">{params.error}</code></>
              ) : (
                'An unspecified error occurred. Please try again.'
              )}
            </p>
          </Card>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Button asChild variant="outline" className="border-border">
              <Link href="/auth/login">
                Try again
              </Link>
            </Button>
            <Button asChild>
              <Link href="/">
                Go home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
