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
  const fields = ['From', 'To', 'Subject', 'Date', 'Cc', 'Bcc', 'Reply-To', 'Message-ID', 'In-Reply-To', 'References', 'List-Unsubscribe', 'List-Unsubscribe-Post']

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

// Extract attachments info from message
function extractAttachments(payload: gmail_v1.Schema$MessagePart, messageId: string): Array<{
  filename: string
  mimeType: string
  size: number
  attachmentId: string
}> {
  const attachments: Array<{
    filename: string
    mimeType: string
    size: number
    attachmentId: string
  }> = []

  function processPartForAttachments(part: gmail_v1.Schema$MessagePart) {
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType || 'application/octet-stream',
        size: part.body.size || 0,
        attachmentId: part.body.attachmentId,
      })
    }
    if (part.parts) {
      part.parts.forEach(processPartForAttachments)
    }
  }

  processPartForAttachments(payload)
  return attachments
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
      const attachments = extractAttachments(message.data.payload!, message.data.id!)

      return {
        id: message.data.id,
        threadId: message.data.threadId,
        from: headers.from,
        to: headers.to,
        cc: headers.cc,
        subject: headers.subject,
        date: headers.date,
        preview,
        snippet: message.data.snippet,
        labelIds: message.data.labelIds,
        hasAttachments: attachments.length > 0,
        attachmentCount: attachments.length,
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
    cc?: string
    bcc?: string
    replyToMessageId?: string
    threadId?: string
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
  ]

  if (options.cc) emailLines.push(`Cc: ${options.cc}`)
  if (options.bcc) emailLines.push(`Bcc: ${options.bcc}`)
  if (options.replyToMessageId) {
    emailLines.push(`In-Reply-To: ${options.replyToMessageId}`)
    emailLines.push(`References: ${options.replyToMessageId}`)
  }

  emailLines.push(
    `Subject: ${options.subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    options.body
  )

  const email = emailLines.join('\r\n')
  const encodedEmail = Buffer.from(email).toString('base64url')

  const draft = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: {
      message: {
        raw: encodedEmail,
        threadId: options.threadId,
      },
    },
  })

  return {
    id: draft.data.id,
    messageId: draft.data.message?.id,
  }
}

// SEND EMAIL DIRECTLY
export async function sendEmail(
  userId: string,
  options: {
    to: string
    subject: string
    body: string
    cc?: string
    bcc?: string
    replyToMessageId?: string
    threadId?: string
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
  ]

  if (options.cc) emailLines.push(`Cc: ${options.cc}`)
  if (options.bcc) emailLines.push(`Bcc: ${options.bcc}`)
  if (options.replyToMessageId) {
    emailLines.push(`In-Reply-To: ${options.replyToMessageId}`)
    emailLines.push(`References: ${options.replyToMessageId}`)
  }

  emailLines.push(
    `Subject: ${options.subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    options.body
  )

  const email = emailLines.join('\r\n')
  const encodedEmail = Buffer.from(email).toString('base64url')

  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail,
      threadId: options.threadId,
    },
  })

  return {
    id: result.data.id,
    threadId: result.data.threadId,
    labelIds: result.data.labelIds,
  }
}

// Get full email thread by thread ID
export async function getEmailThread(userId: string, threadId: string) {
  const gmail = await getAuthenticatedGmailClient(userId)

  const thread = await gmail.users.threads.get({
    userId: 'me',
    id: threadId,
    format: 'full',
  })

  if (!thread.data.messages) {
    return null
  }

  const messages = thread.data.messages.map((message) => {
    const headers = parseEmailHeaders(message.payload?.headers || [])
    const body = extractEmailBody(message.payload!)
    const attachments = extractAttachments(message.payload!, message.id!)

    return {
      id: message.id,
      from: headers.from,
      to: headers.to,
      cc: headers.cc,
      subject: headers.subject,
      date: headers.date,
      body: body,
      snippet: message.snippet,
      labelIds: message.labelIds,
      hasAttachments: attachments.length > 0,
      attachments,
    }
  })

  return {
    threadId: thread.data.id,
    messageCount: messages.length,
    messages,
  }
}

// Get single email by ID with full body
export async function getEmailById(userId: string, emailId: string) {
  const gmail = await getAuthenticatedGmailClient(userId)

  const message = await gmail.users.messages.get({
    userId: 'me',
    id: emailId,
    format: 'full',
  })

  const headers = parseEmailHeaders(message.data.payload?.headers || [])
  const body = extractEmailBody(message.data.payload!)
  const attachments = extractAttachments(message.data.payload!, emailId)

  return {
    id: message.data.id,
    threadId: message.data.threadId,
    from: headers.from,
    to: headers.to,
    cc: headers.cc,
    subject: headers.subject,
    date: headers.date,
    body: body,
    snippet: message.data.snippet,
    labelIds: message.data.labelIds,
    messageId: headers['message-id'],
    hasAttachments: attachments.length > 0,
    attachments,
  }
}

// LABEL MANAGEMENT
export async function getLabels(userId: string) {
  const gmail = await getAuthenticatedGmailClient(userId)

  const response = await gmail.users.labels.list({ userId: 'me' })

  return response.data.labels?.map(label => ({
    id: label.id,
    name: label.name,
    type: label.type,
    messageListVisibility: label.messageListVisibility,
    labelListVisibility: label.labelListVisibility,
  })) || []
}

export async function createLabel(userId: string, name: string, options?: {
  backgroundColor?: string
  textColor?: string
}) {
  const gmail = await getAuthenticatedGmailClient(userId)

  const response = await gmail.users.labels.create({
    userId: 'me',
    requestBody: {
      name,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show',
      color: options?.backgroundColor ? {
        backgroundColor: options.backgroundColor,
        textColor: options.textColor || '#000000',
      } : undefined,
    },
  })

  return {
    id: response.data.id,
    name: response.data.name,
  }
}

export async function applyLabels(userId: string, emailIds: string[], labelIds: string[]) {
  const gmail = await getAuthenticatedGmailClient(userId)

  // Use batch modify for efficiency
  await gmail.users.messages.batchModify({
    userId: 'me',
    requestBody: {
      ids: emailIds,
      addLabelIds: labelIds,
    },
  })

  return { success: true, modifiedCount: emailIds.length }
}

export async function removeLabels(userId: string, emailIds: string[], labelIds: string[]) {
  const gmail = await getAuthenticatedGmailClient(userId)

  await gmail.users.messages.batchModify({
    userId: 'me',
    requestBody: {
      ids: emailIds,
      removeLabelIds: labelIds,
    },
  })

  return { success: true, modifiedCount: emailIds.length }
}

// ARCHIVE, TRASH, DELETE
export async function archiveEmails(userId: string, emailIds: string[]) {
  const gmail = await getAuthenticatedGmailClient(userId)

  await gmail.users.messages.batchModify({
    userId: 'me',
    requestBody: {
      ids: emailIds,
      removeLabelIds: ['INBOX'],
    },
  })

  return { success: true, archivedCount: emailIds.length }
}

export async function trashEmails(userId: string, emailIds: string[]) {
  const gmail = await getAuthenticatedGmailClient(userId)

  // Use individual trash calls with allSettled so one failure doesn't kill the batch
  const results = await Promise.allSettled(
    emailIds.map(id => gmail.users.messages.trash({ userId: 'me', id }))
  )

  const succeeded = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return { success: succeeded > 0, trashedCount: succeeded, failedCount: failed }
}

export async function untrashEmails(userId: string, emailIds: string[]) {
  const gmail = await getAuthenticatedGmailClient(userId)

  await Promise.all(
    emailIds.map(id => gmail.users.messages.untrash({ userId: 'me', id }))
  )

  return { success: true, restoredCount: emailIds.length }
}

export async function permanentlyDeleteEmails(userId: string, emailIds: string[]) {
  const gmail = await getAuthenticatedGmailClient(userId)

  await Promise.all(
    emailIds.map(id => gmail.users.messages.delete({ userId: 'me', id }))
  )

  return { success: true, deletedCount: emailIds.length }
}

// MARK READ/UNREAD, STAR/UNSTAR
export async function markAsRead(userId: string, emailIds: string[]) {
  const gmail = await getAuthenticatedGmailClient(userId)

  await gmail.users.messages.batchModify({
    userId: 'me',
    requestBody: {
      ids: emailIds,
      removeLabelIds: ['UNREAD'],
    },
  })

  return { success: true, count: emailIds.length }
}

export async function markAsUnread(userId: string, emailIds: string[]) {
  const gmail = await getAuthenticatedGmailClient(userId)

  await gmail.users.messages.batchModify({
    userId: 'me',
    requestBody: {
      ids: emailIds,
      addLabelIds: ['UNREAD'],
    },
  })

  return { success: true, count: emailIds.length }
}

export async function starEmails(userId: string, emailIds: string[]) {
  const gmail = await getAuthenticatedGmailClient(userId)

  await gmail.users.messages.batchModify({
    userId: 'me',
    requestBody: {
      ids: emailIds,
      addLabelIds: ['STARRED'],
    },
  })

  return { success: true, count: emailIds.length }
}

export async function unstarEmails(userId: string, emailIds: string[]) {
  const gmail = await getAuthenticatedGmailClient(userId)

  await gmail.users.messages.batchModify({
    userId: 'me',
    requestBody: {
      ids: emailIds,
      removeLabelIds: ['STARRED'],
    },
  })

  return { success: true, count: emailIds.length }
}

// MARK AS IMPORTANT / NOT IMPORTANT
export async function markAsImportant(userId: string, emailIds: string[]) {
  const gmail = await getAuthenticatedGmailClient(userId)

  await gmail.users.messages.batchModify({
    userId: 'me',
    requestBody: {
      ids: emailIds,
      addLabelIds: ['IMPORTANT'],
    },
  })

  return { success: true, count: emailIds.length }
}

export async function markAsNotImportant(userId: string, emailIds: string[]) {
  const gmail = await getAuthenticatedGmailClient(userId)

  await gmail.users.messages.batchModify({
    userId: 'me',
    requestBody: {
      ids: emailIds,
      removeLabelIds: ['IMPORTANT'],
    },
  })

  return { success: true, count: emailIds.length }
}

// SPAM MANAGEMENT
export async function reportSpam(userId: string, emailIds: string[]) {
  const gmail = await getAuthenticatedGmailClient(userId)

  await gmail.users.messages.batchModify({
    userId: 'me',
    requestBody: {
      ids: emailIds,
      addLabelIds: ['SPAM'],
      removeLabelIds: ['INBOX'],
    },
  })

  return { success: true, count: emailIds.length }
}

export async function markNotSpam(userId: string, emailIds: string[]) {
  const gmail = await getAuthenticatedGmailClient(userId)

  await gmail.users.messages.batchModify({
    userId: 'me',
    requestBody: {
      ids: emailIds,
      removeLabelIds: ['SPAM'],
      addLabelIds: ['INBOX'],
    },
  })

  return { success: true, count: emailIds.length }
}

// GET ATTACHMENT
export async function getAttachment(userId: string, messageId: string, attachmentId: string) {
  const gmail = await getAuthenticatedGmailClient(userId)

  const attachment = await gmail.users.messages.attachments.get({
    userId: 'me',
    messageId,
    id: attachmentId,
  })

  return {
    data: attachment.data.data, // base64 encoded
    size: attachment.data.size,
  }
}

// SENDER ANALYSIS - Get full history with a contact
export async function getSenderHistory(userId: string, email: string) {
  const gmail = await getAuthenticatedGmailClient(userId)

  // Get emails FROM this person
  const fromResponse = await gmail.users.messages.list({
    userId: 'me',
    q: `from:${email}`,
    maxResults: 50,
  })

  // Get emails TO this person
  const toResponse = await gmail.users.messages.list({
    userId: 'me',
    q: `to:${email}`,
    maxResults: 50,
  })

  const receivedCount = fromResponse.data.resultSizeEstimate || 0
  const sentCount = toResponse.data.resultSizeEstimate || 0

  // Get recent emails for analysis
  const recentEmails = await Promise.all(
    (fromResponse.data.messages || []).slice(0, 10).map(async (msg) => {
      const message = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'metadata',
        metadataHeaders: ['Subject', 'Date'],
      })
      const headers = parseEmailHeaders(message.data.payload?.headers || [])
      return {
        subject: headers.subject,
        date: headers.date,
      }
    })
  )

  return {
    email,
    receivedFromThem: receivedCount,
    sentToThem: sentCount,
    totalInteractions: receivedCount + sentCount,
    recentEmails,
  }
}

// GET DRAFTS
export async function getDrafts(userId: string, maxResults: number = 20) {
  const gmail = await getAuthenticatedGmailClient(userId)

  const response = await gmail.users.drafts.list({
    userId: 'me',
    maxResults,
  })

  if (!response.data.drafts) {
    return []
  }

  const drafts = await Promise.all(
    response.data.drafts.map(async (draft) => {
      const fullDraft = await gmail.users.drafts.get({
        userId: 'me',
        id: draft.id!,
        format: 'full',
      })

      const headers = parseEmailHeaders(fullDraft.data.message?.payload?.headers || [])
      const body = extractEmailBody(fullDraft.data.message?.payload!)

      return {
        draftId: draft.id,
        messageId: fullDraft.data.message?.id,
        to: headers.to,
        subject: headers.subject,
        body: body.slice(0, 500),
        snippet: fullDraft.data.message?.snippet,
      }
    })
  )

  return drafts
}

// DELETE DRAFT
export async function deleteDraft(userId: string, draftId: string) {
  const gmail = await getAuthenticatedGmailClient(userId)

  await gmail.users.drafts.delete({
    userId: 'me',
    id: draftId,
  })

  return { success: true }
}

// SEND DRAFT
export async function sendDraft(userId: string, draftId: string) {
  const gmail = await getAuthenticatedGmailClient(userId)

  const result = await gmail.users.drafts.send({
    userId: 'me',
    requestBody: {
      id: draftId,
    },
  })

  return {
    id: result.data.id,
    threadId: result.data.threadId,
    labelIds: result.data.labelIds,
  }
}

// UPDATE DRAFT
export async function updateDraft(
  userId: string,
  draftId: string,
  options: {
    to: string
    subject: string
    body: string
    cc?: string
    bcc?: string
  }
) {
  const gmail = await getAuthenticatedGmailClient(userId)

  const profile = await gmail.users.getProfile({ userId: 'me' })
  const userEmail = profile.data.emailAddress

  const emailLines = [
    `From: ${userEmail}`,
    `To: ${options.to}`,
  ]

  if (options.cc) emailLines.push(`Cc: ${options.cc}`)
  if (options.bcc) emailLines.push(`Bcc: ${options.bcc}`)

  emailLines.push(
    `Subject: ${options.subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    options.body
  )

  const email = emailLines.join('\r\n')
  const encodedEmail = Buffer.from(email).toString('base64url')

  const result = await gmail.users.drafts.update({
    userId: 'me',
    id: draftId,
    requestBody: {
      message: {
        raw: encodedEmail,
      },
    },
  })

  return {
    draftId: result.data.id,
    messageId: result.data.message?.id,
  }
}

// Get accurate inbox stats using Gmail labels.get (fast, single API call)
export async function getInboxStats(userId: string) {
  const gmail = await getAuthenticatedGmailClient(userId)

  // labels.get returns exact counts - way faster than scanning messages
  // Note: UNREAD is not a valid label ID - unread count comes from INBOX.messagesUnread
  const [inbox, sent, spam, trash, starred] = await Promise.all([
    gmail.users.labels.get({ userId: 'me', id: 'INBOX' }),
    gmail.users.labels.get({ userId: 'me', id: 'SENT' }),
    gmail.users.labels.get({ userId: 'me', id: 'SPAM' }),
    gmail.users.labels.get({ userId: 'me', id: 'TRASH' }),
    gmail.users.labels.get({ userId: 'me', id: 'STARRED' }),
  ])

  return {
    inbox: {
      total: inbox.data.messagesTotal || 0,
      unread: inbox.data.messagesUnread || 0,
      threads: inbox.data.threadsTotal || 0,
    },
    sent: {
      total: sent.data.messagesTotal || 0,
    },
    spam: {
      total: spam.data.messagesTotal || 0,
    },
    trash: {
      total: trash.data.messagesTotal || 0,
    },
    starred: {
      total: starred.data.messagesTotal || 0,
    },
  }
}

// Parse List-Unsubscribe header into actionable URLs/mailto
function parseUnsubscribeHeader(header: string): { urls: string[]; mailto: string | null } {
  const urls: string[] = []
  let mailto: string | null = null

  // Header format: <https://example.com/unsub>, <mailto:unsub@example.com>
  const matches = header.match(/<([^>]+)>/g)
  if (matches) {
    for (const match of matches) {
      const value = match.slice(1, -1) // Remove < >
      if (value.startsWith('mailto:')) {
        mailto = value
      } else if (value.startsWith('http://') || value.startsWith('https://')) {
        urls.push(value)
      }
    }
  }

  return { urls, mailto }
}

// Scan emails for unsubscribe options
export async function findUnsubscribableEmails(
  userId: string,
  options: { maxResults?: number; query?: string } = {}
) {
  const gmail = await getAuthenticatedGmailClient(userId)
  const { maxResults = 50, query = '' } = options

  // Search for emails with List-Unsubscribe header (common in newsletters/marketing)
  const searchQuery = query || 'category:promotions OR category:updates OR category:social'

  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: searchQuery,
  })

  if (!response.data.messages) return []

  const results = await Promise.allSettled(
    response.data.messages.map(async (msg) => {
      const message = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date', 'List-Unsubscribe', 'List-Unsubscribe-Post'],
      })

      const headers: Record<string, string> = {}
      for (const h of message.data.payload?.headers || []) {
        if (h.name && h.value) headers[h.name.toLowerCase()] = h.value
      }

      const unsubHeader = headers['list-unsubscribe']
      if (!unsubHeader) return null

      const parsed = parseUnsubscribeHeader(unsubHeader)
      const hasOneClick = !!headers['list-unsubscribe-post']

      return {
        id: message.data.id,
        from: headers.from || 'Unknown',
        subject: headers.subject || '(no subject)',
        date: headers.date || '',
        unsubscribeUrl: parsed.urls[0] || null,
        unsubscribeMailto: parsed.mailto,
        hasOneClickUnsubscribe: hasOneClick,
        canAutoUnsubscribe: hasOneClick && parsed.urls.length > 0,
      }
    })
  )

  // Filter to only emails that have unsubscribe headers
  const unsubscribable = results
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => (r as PromiseFulfilledResult<NonNullable<unknown>>).value) as Array<{
      id: string | null | undefined
      from: string
      subject: string
      date: string
      unsubscribeUrl: string | null
      unsubscribeMailto: string | null
      hasOneClickUnsubscribe: boolean
      canAutoUnsubscribe: boolean
    }>

  // Deduplicate by sender domain
  const seen = new Set<string>()
  const deduped = []
  for (const email of unsubscribable) {
    const senderMatch = String(email.from).match(/@([^\s>]+)/)
    const domain = senderMatch ? senderMatch[1].toLowerCase() : String(email.from)
    if (!seen.has(domain)) {
      seen.add(domain)
      deduped.push(email)
    }
  }

  return deduped
}

// Execute one-click unsubscribe (RFC 8058)
export async function unsubscribeFromEmail(
  userId: string,
  emailId: string
): Promise<{ success: boolean; method: string; message: string }> {
  const gmail = await getAuthenticatedGmailClient(userId)

  const message = await gmail.users.messages.get({
    userId: 'me',
    id: emailId,
    format: 'metadata',
    metadataHeaders: ['From', 'Subject', 'List-Unsubscribe', 'List-Unsubscribe-Post'],
  })

  const headers: Record<string, string> = {}
  for (const h of message.data.payload?.headers || []) {
    if (h.name && h.value) headers[h.name.toLowerCase()] = h.value
  }

  const unsubHeader = headers['list-unsubscribe']
  if (!unsubHeader) {
    return { success: false, method: 'none', message: 'This email does not have an unsubscribe option.' }
  }

  const parsed = parseUnsubscribeHeader(unsubHeader)
  const hasOneClick = !!headers['list-unsubscribe-post']
  const from = headers.from || 'Unknown sender'

  // Method 1: RFC 8058 One-Click Unsubscribe (HTTP POST)
  if (hasOneClick && parsed.urls.length > 0) {
    try {
      const res = await fetch(parsed.urls[0], {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'List-Unsubscribe=One-Click',
      })
      if (res.ok || res.status === 200 || res.status === 202) {
        return { success: true, method: 'one-click', message: `Unsubscribed from ${from} via one-click.` }
      }
    } catch {
      // Fall through to next method
    }
  }

  // Method 2: HTTP GET unsubscribe link (less reliable but common)
  if (parsed.urls.length > 0) {
    return {
      success: true,
      method: 'link',
      message: `Unsubscribe link for ${from}: ${parsed.urls[0]}`,
    }
  }

  // Method 3: Mailto unsubscribe
  if (parsed.mailto) {
    return {
      success: true,
      method: 'mailto',
      message: `To unsubscribe from ${from}, send an email to: ${parsed.mailto.replace('mailto:', '')}`,
    }
  }

  return { success: false, method: 'none', message: `Could not find a working unsubscribe method for ${from}.` }
}

// Bulk unsubscribe from multiple emails
export async function bulkUnsubscribe(
  userId: string,
  emailIds: string[]
): Promise<{ succeeded: number; failed: number; results: Array<{ from: string; success: boolean; method: string; message: string }> }> {
  const results = []
  let succeeded = 0
  let failed = 0

  for (const emailId of emailIds) {
    try {
      const result = await unsubscribeFromEmail(userId, emailId)
      results.push({ from: '', ...result })
      if (result.success) succeeded++
      else failed++
    } catch {
      failed++
      results.push({ from: '', success: false, method: 'error', message: 'Failed to process unsubscribe.' })
    }
  }

  return { succeeded, failed, results }
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
