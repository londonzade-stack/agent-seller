import { ConfidentialClientApplication } from '@azure/msal-node'

// Microsoft Graph API scopes for Outlook email access
export const OUTLOOK_SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'Mail.Read',
  'Mail.ReadWrite',
  'Mail.Send',
  'User.Read',
]

// Microsoft OAuth configuration
function getMsalConfig() {
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET must be set')
  }

  return {
    auth: {
      clientId,
      clientSecret,
      // "common" supports both work/school and personal Microsoft accounts
      authority: 'https://login.microsoftonline.com/common',
    },
  }
}

// Generate OAuth authorization URL for Outlook
export function getOutlookAuthUrl(state: string): string {
  const clientId = process.env.MICROSOFT_CLIENT_ID
  if (!clientId) throw new Error('MICROSOFT_CLIENT_ID is not set')

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/outlook/callback`
  const scope = OUTLOOK_SCOPES.join(' ')

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope,
    state,
    prompt: 'consent',
  })

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
}

// Exchange authorization code for tokens
export async function exchangeOutlookCodeForTokens(code: string) {
  const cca = new ConfidentialClientApplication(getMsalConfig())
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/outlook/callback`

  const result = await cca.acquireTokenByCode({
    code,
    scopes: OUTLOOK_SCOPES,
    redirectUri,
  })

  return {
    accessToken: result.accessToken,
    // MSAL caches tokens internally; extract expiry from the result
    expiresOn: result.expiresOn ? result.expiresOn.toISOString() : new Date(Date.now() + 3600 * 1000).toISOString(),
    account: result.account,
  }
}

// Refresh Outlook access token using refresh token
export async function refreshOutlookAccessToken(refreshToken: string) {
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Microsoft OAuth env vars not set')

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/outlook/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    redirect_uri: redirectUri,
    scope: OUTLOOK_SCOPES.join(' '),
  })

  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Failed to refresh Outlook token: ${error}`)
  }

  const data = await res.json()

  return {
    accessToken: data.access_token as string,
    refreshToken: (data.refresh_token as string) || refreshToken,
    expiresIn: data.expires_in as number,
  }
}

// Make an authenticated request to Microsoft Graph API
export async function graphRequest<T = unknown>(
  accessToken: string,
  path: string,
  options: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
  } = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options

  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Graph API error (${res.status}): ${errorText}`)
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T

  return res.json()
}

// Exchange code for tokens using raw HTTP (MSAL acquireTokenByCode doesn't return refresh tokens directly)
export async function exchangeOutlookCodeForTokensRaw(code: string) {
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Microsoft OAuth env vars not set')

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/outlook/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    scope: OUTLOOK_SCOPES.join(' '),
  })

  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Failed to exchange Outlook code: ${error}`)
  }

  const data = await res.json()

  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string | undefined,
    expiresIn: data.expires_in as number,
    idToken: data.id_token as string | undefined,
  }
}
