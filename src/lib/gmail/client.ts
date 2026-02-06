import { google } from 'googleapis'

// Gmail OAuth2 configuration
export function getGmailOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`
  )
}

// Scopes required for Gmail access - FULL ACCESS for all operations
export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',  // Read, send, delete, modify labels, archive, trash
  'https://www.googleapis.com/auth/gmail.compose', // Create drafts
  'https://www.googleapis.com/auth/gmail.send',    // Send emails
  'https://www.googleapis.com/auth/gmail.labels',  // Create/manage labels
  'https://www.googleapis.com/auth/userinfo.email', // Get user email
]

// Generate OAuth URL for Gmail authorization
export function getGmailAuthUrl(state: string) {
  const oauth2Client = getGmailOAuth2Client()

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    state,
    prompt: 'consent', // Force consent to always get refresh token
  })
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getGmailOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

// Create authenticated Gmail client
export function getGmailClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = getGmailOAuth2Client()
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  return google.gmail({ version: 'v1', auth: oauth2Client })
}

// Refresh access token if needed
export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getGmailOAuth2Client()
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials
}
