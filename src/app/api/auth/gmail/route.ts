import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGmailAuthUrl } from '@/lib/gmail/client'
import { sanitizeError } from '@/lib/logger'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in first' },
        { status: 401 }
      )
    }

    // Generate state token for CSRF protection (includes user ID)
    const nonce = randomBytes(16).toString('hex')
    const stateData = {
      userId: user.id,
      nonce,
      timestamp: Date.now(),
    }
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64url')

    // Store nonce in an HttpOnly cookie for server-side verification on callback
    const cookieStore = await cookies()
    cookieStore.set('gmail_oauth_nonce', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60, // 5 minutes, matches state expiry
      path: '/',
    })

    // Generate OAuth URL
    const authUrl = getGmailAuthUrl(state)

    return NextResponse.json({ authUrl })
  } catch (error) {
    sanitizeError('Gmail auth error', error)
    return NextResponse.json(
      { error: 'Failed to initiate Gmail authorization' },
      { status: 500 }
    )
  }
}
