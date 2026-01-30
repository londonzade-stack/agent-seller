import { gmail_v1 } from 'googleapis'
import { getGmailClient, refreshAccessToken } from './client'
import { createClient } from '@/lib/supabase/server'

interface EmailConnection {
  id: string
  user_id: string
  email: string
  access_token: string
  refresh_token: string
  token_expiry: string
}

// Get user's Gmail connection from Supabase
export async function getUserEmailConnection(userId: string): Promise<EmailConnection | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_email_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'gmail')
    .single()

  if (error || !data) {
    return null
  }

  return data as EmailConnection
}

// Get authenticated Gmail client for a user
export async function getAuthenticatedGmailClient(userId: string) {
  const connection = await getUserEmailConnection(userId)

  if (!connection) {
    throw new Error('No Gmail connection found for user')
  }

  // Check if token is expired and refresh if needed
  const tokenExpiry = new Date(connection.token_expiry)
  const now = new Date()

  if (tokenExpiry <= now && connection.refresh_token) {
    // Refresh the token
    const newCredentials = await refreshAccessToken(connection.refresh_token)

    // Update the token in database
    const supabase = await createClient()
    await supabase
      .from('user_email_connections')
      .update({
        access_token: newCredentials.access_token,
        token_expiry: newCredentials.expiry_date
          ? new Date(newCredentials.expiry_date).toISOString()
          : new Date(Date.now() + 3600 * 1000).toISOString(),
      })
      .eq('id', connection.id)

    return getGmailClient(
      newCredentials.access_token!,
      connection.refresh_token
    )
  }

  return getGmailClient(connection.access_token, connection.refresh_token)
}

// Parse email headers to get common fields
function parseEmailHeaders(headers: gmail_v1.Schema$MessagePartHeader[]) {
  const result: Record<string, string> = {}
  const fields = ['From', 'To', 'Subject', 'Date']

  for (const header of headers) {
    if (header.name && fields.includes(header.name)) {
      result[header.name.toLowerCase()] = header.value || ''
    }
  }

  return result
}

// Extract email body from message parts
function extractEmailBody(payload: gmail_v1.Schema$MessagePart): string {
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8')
  }

  if (payload.parts) {
    // Prefer plain text, fallback to HTML
    const textPart = payload.parts.find((p) => p.mimeType === 'text/plain')
    if (textPart?.body?.data) {
      return Buffer.from(textPart.body.data, 'base64').toString('utf-8')
    }

    const htmlPart = payload.parts.find((p) => p.mimeType === 'text/html')
    if (htmlPart?.body?.data) {
      const html = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8')
      // Strip HTML tags for preview
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    }

    // Recursively check nested parts
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractEmailBody(part)
        if (nested) return nested
      }
    }
  }

  return ''
}

// Scan inbox for recent emails
export async function scanInboxForEmails(
  userId: string,
  options: {
    maxResults?: number
    query?: string
    after?: Date
  } = {}
) {
  const gmail = await getAuthenticatedGmailClient(userId)

  const { maxResults = 20, query = '', after } = options

  // Build search query
  let searchQuery = query
  if (after) {
    const afterTimestamp = Math.floor(after.getTime() / 1000)
    searchQuery += ` after:${afterTimestamp}`
  }

  // Get message list
  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: searchQuery.trim() || undefined,
  })

  if (!response.data.messages) {
    return []
  }

  // Fetch full message details
  const emails = await Promise.all(
    response.data.messages.map(async (msg) => {
      const message = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'full',
      })

      const headers = parseEmailHeaders(message.data.payload?.headers || [])
      const body = extractEmailBody(message.data.payload!)
      const preview = body.slice(0, 200) + (body.length > 200 ? '...' : '')

      return {
        id: message.data.id,
        threadId: message.data.threadId,
        from: headers.from,
        to: headers.to,
        subject: headers.subject,
        date: headers.date,
        preview,
        snippet: message.data.snippet,
        labelIds: message.data.labelIds,
      }
    })
  )

  return emails
}

// Get contact details from email address
export async function getContactFromEmail(userId: string, email: string) {
  const gmail = await getAuthenticatedGmailClient(userId)

  // Search for emails from this contact
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: `from:${email}`,
    maxResults: 10,
  })

  if (!response.data.messages || response.data.messages.length === 0) {
    return null
  }

  // Get the most recent email to extract contact info
  const latestMessage = await gmail.users.messages.get({
    userId: 'me',
    id: response.data.messages[0].id!,
    format: 'full',
  })

  const headers = parseEmailHeaders(latestMessage.data.payload?.headers || [])

  // Parse the "From" header to extract name and email
  const fromMatch = headers.from?.match(/^(?:"?([^"<]+)"?\s*)?<?([^>]+)>?$/)
  const name = fromMatch?.[1]?.trim() || email.split('@')[0]
  const emailAddress = fromMatch?.[2]?.trim() || email

  return {
    name,
    email: emailAddress,
    totalEmails: response.data.resultSizeEstimate || response.data.messages.length,
    lastContact: headers.date,
    recentSubjects: await Promise.all(
      response.data.messages.slice(0, 5).map(async (msg) => {
        const m = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'metadata',
          metadataHeaders: ['Subject'],
        })
        return m.data.payload?.headers?.find((h) => h.name === 'Subject')?.value || ''
      })
    ),
  }
}

// Create a draft email
export async function createDraft(
  userId: string,
  options: {
    to: string
    subject: string
    body: string
  }
) {
  const gmail = await getAuthenticatedGmailClient(userId)

  // Get user's email for the "From" field
  const profile = await gmail.users.getProfile({ userId: 'me' })
  const userEmail = profile.data.emailAddress

  // Create RFC 2822 formatted email
  const emailLines = [
    `From: ${userEmail}`,
    `To: ${options.to}`,
    `Subject: ${options.subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    options.body,
  ]

  const email = emailLines.join('\r\n')
  const encodedEmail = Buffer.from(email).toString('base64url')

  const draft = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: {
      message: {
        raw: encodedEmail,
      },
    },
  })

  return {
    id: draft.data.id,
    messageId: draft.data.message?.id,
  }
}

// Analyze email for lead potential
export function analyzeEmailForLeadPotential(email: {
  from: string
  subject: string
  preview: string
}) {
  const leadIndicators = [
    // Healthcare titles
    /\b(dr\.|doctor|chief|director|administrator|manager|procurement|purchasing)\b/i,
    // Healthcare organizations
    /\b(hospital|clinic|medical|healthcare|health\s+care|health\s+system)\b/i,
    // Purchase intent
    /\b(budget|purchase|buy|acquire|quote|proposal|rfp|rfi|demo|trial)\b/i,
    // Decision making
    /\b(decide|decision|evaluate|consider|interested|looking\s+for)\b/i,
    // Timing signals
    /\b(this\s+quarter|next\s+month|fiscal|year-end|q[1-4])\b/i,
  ]

  const content = `${email.from} ${email.subject} ${email.preview}`.toLowerCase()
  let score = 0
  const matches: string[] = []

  for (const indicator of leadIndicators) {
    if (indicator.test(content)) {
      score += 20
      const match = content.match(indicator)
      if (match) matches.push(match[0])
    }
  }

  // Cap at 100
  score = Math.min(score, 100)

  return {
    isLead: score >= 40,
    leadScore: score,
    indicators: matches,
  }
}
