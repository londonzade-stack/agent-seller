import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens, getGmailClient } from '@/lib/gmail/client'
import { sanitizeError } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    sanitizeError('Gmail OAuth error', error)
    return NextResponse.redirect(
      new URL(`/dashboard?error=gmail_auth_denied`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`/dashboard?error=gmail_auth_invalid`, request.url)
    )
  }

  try {
    // Decode and verify state
    const stateData = JSON.parse(
      Buffer.from(state, 'base64url').toString('utf-8')
    )

    // Verify state is not too old (5 minute expiry)
    if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=gmail_auth_expired`, request.url)
      )
    }

    const supabase = await createClient()

    // Verify user is logged in and matches state
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user || user.id !== stateData.userId) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=gmail_auth_mismatch`, request.url)
      )
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    if (!tokens.access_token) {
      throw new Error('No access token received')
    }

    // Get user's Gmail email address
    const gmail = getGmailClient(tokens.access_token, tokens.refresh_token || undefined)
    const profile = await gmail.users.getProfile({ userId: 'me' })
    const gmailEmail = profile.data.emailAddress

    // Calculate token expiry
    const tokenExpiry = tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString()

    // Check if user already has a Gmail connection
    const { data: existing } = await supabase
      .from('user_email_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', 'gmail')
      .single()

    if (existing) {
      // Update existing connection
      const { error: updateError } = await supabase
        .from('user_email_connections')
        .update({
          email: gmailEmail,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expiry: tokenExpiry,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (updateError) {
        throw updateError
      }
    } else {
      // Create new connection
      const { error: insertError } = await supabase
        .from('user_email_connections')
        .insert({
          user_id: user.id,
          provider: 'gmail',
          email: gmailEmail,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expiry: tokenExpiry,
        })

      if (insertError) {
        throw insertError
      }
    }

    // Redirect back to dashboard with success
    return NextResponse.redirect(
      new URL(`/dashboard?gmail_connected=true`, request.url)
    )
  } catch (error) {
    sanitizeError('Gmail callback error', error)
    return NextResponse.redirect(
      new URL(`/dashboard?error=gmail_auth_failed`, request.url)
    )
  }
}
