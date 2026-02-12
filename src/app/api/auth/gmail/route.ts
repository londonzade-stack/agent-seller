import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGmailAuthUrl } from '@/lib/gmail/client'
import { sanitizeError } from '@/lib/logger'
import { randomBytes } from 'crypto'

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
    const stateData = {
      userId: user.id,
      nonce: randomBytes(16).toString('hex'),
      timestamp: Date.now(),
    }
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64url')

    // Store state in a temporary table or cookie for verification
    // For simplicity, we'll encode user ID in state and verify on callback

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
