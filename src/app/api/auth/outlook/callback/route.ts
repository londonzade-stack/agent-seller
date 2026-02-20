import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeOutlookCodeForTokensRaw, graphRequest } from '@/lib/outlook/client'
import { sanitizeError } from '@/lib/logger'
import { encrypt } from '@/lib/encryption'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    sanitizeError('Outlook OAuth error', error)
    return NextResponse.redirect(
      new URL(`/dashboard?error=outlook_auth_denied`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`/dashboard?error=outlook_auth_invalid`, request.url)
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
        new URL(`/dashboard?error=outlook_auth_expired`, request.url)
      )
    }

    // Verify nonce matches the server-side cookie (prevents replay attacks)
    const cookieStore = await cookies()
    const storedNonce = cookieStore.get('outlook_oauth_nonce')?.value
    if (!storedNonce || storedNonce !== stateData.nonce) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=outlook_auth_invalid`, request.url)
      )
    }
    // Clear the nonce cookie — single use
    cookieStore.delete('outlook_oauth_nonce')

    const supabase = await createClient()

    // Verify user is logged in and matches state
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user || user.id !== stateData.userId) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=outlook_auth_mismatch`, request.url)
      )
    }

    // Exchange code for tokens (use raw HTTP to get refresh token)
    const tokens = await exchangeOutlookCodeForTokensRaw(code)

    if (!tokens.accessToken) {
      throw new Error('No access token received')
    }

    // Get user's Outlook email address via Microsoft Graph
    const profile = await graphRequest<{ mail?: string; userPrincipalName: string }>(
      tokens.accessToken,
      '/me'
    )
    const outlookEmail = profile.mail || profile.userPrincipalName

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + (tokens.expiresIn || 3600) * 1000).toISOString()

    // Check if user already has an Outlook connection
    const { data: existing } = await supabase
      .from('user_email_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', 'outlook')
      .single()

    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(tokens.accessToken)
    const encryptedRefreshToken = tokens.refreshToken ? encrypt(tokens.refreshToken) : null

    if (existing) {
      // Update existing connection
      const { error: updateError } = await supabase
        .from('user_email_connections')
        .update({
          email: outlookEmail,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
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
          provider: 'outlook',
          email: outlookEmail,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expiry: tokenExpiry,
        })

      if (insertError) {
        throw insertError
      }
    }

    // Redirect back to dashboard with success
    return NextResponse.redirect(
      new URL(`/dashboard?outlook_connected=true`, request.url)
    )
  } catch (error) {
    sanitizeError('Outlook callback error', error)
    return NextResponse.redirect(
      new URL(`/dashboard?error=outlook_auth_failed`, request.url)
    )
  }
}
