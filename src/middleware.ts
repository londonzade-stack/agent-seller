import { updateSession } from '@/lib/supabase/proxy'
import { NextResponse, type NextRequest } from 'next/server'

// Paths that receive external POST requests (webhooks, cron) and must be exempt from CSRF
const CSRF_EXEMPT_PATHS = [
  '/api/webhooks/stripe',
  '/api/cron/',
]

export async function middleware(request: NextRequest) {
  // CSRF protection for state-changing requests (POST, PATCH, DELETE, PUT)
  if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(request.method)) {
    const isExempt = CSRF_EXEMPT_PATHS.some(path => request.nextUrl.pathname.startsWith(path))

    if (!isExempt) {
      const origin = request.headers.get('origin')
      const host = request.headers.get('host')

      // Allow requests with no origin (same-origin fetch from browser, server-side calls)
      // But block requests where origin is present and doesn't match the host
      if (origin) {
        const originHost = new URL(origin).host
        if (originHost !== host) {
          return new NextResponse(
            JSON.stringify({ error: 'Forbidden' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
