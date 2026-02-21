import { graphRequest, refreshOutlookAccessToken } from './client'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin, SupabaseClient } from '@supabase/supabase-js'
import { decryptToken, encrypt } from '@/lib/encryption'

interface EmailConnection {
  id: string
  user_id: string
  email: string
  access_token: string
  refresh_token: string
  token_expiry: string
}

// Microsoft Graph API response types
interface GraphMessage {
  id: string
  conversationId: string
  subject: string
  bodyPreview: string
  body: { contentType: string; content: string }
  from: { emailAddress: { name: string; address: string } }
  toRecipients: Array<{ emailAddress: { name: string; address: string } }>
  ccRecipients: Array<{ emailAddress: { name: string; address: string } }>
  bccRecipients: Array<{ emailAddress: { name: string; address: string } }>
  receivedDateTime: string
  sentDateTime: string
  isRead: boolean
  isDraft: boolean
  importance: string
  flag: { flagStatus: string }
  hasAttachments: boolean
  parentFolderId: string
  internetMessageId: string
  internetMessageHeaders?: Array<{ name: string; value: string }>
}

interface GraphMessageList {
  value: GraphMessage[]
  '@odata.nextLink'?: string
  '@odata.count'?: number
}

interface GraphFolder {
  id: string
  displayName: string
  parentFolderId: string
  childFolderCount: number
  unreadItemCount: number
  totalItemCount: number
}

interface GraphAttachment {
  id: string
  name: string
  contentType: string
  size: number
  isInline: boolean
  contentBytes?: string
}

function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables for admin client')
  }
  return createSupabaseAdmin(url, serviceKey)
}

// Get user's Outlook connection from Supabase
export async function getUserOutlookConnection(userId: string, adminClient?: SupabaseClient): Promise<EmailConnection | null> {
  let supabase: SupabaseClient
  if (adminClient) {
    supabase = adminClient
  } else {
    supabase = await createClient()
  }

  const { data, error } = await supabase
    .from('user_email_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'outlook')
    .single()

  if (error || !data) return null
  return data as EmailConnection
}

// Get authenticated access token for Outlook, refreshing if needed
async function getOutlookAccessToken(userId: string, adminClient?: SupabaseClient): Promise<string> {
  const connection = await getUserOutlookConnection(userId, adminClient)
  if (!connection) throw new Error('No Outlook connection found for user')

  const accessToken = decryptToken(connection.access_token)
  const refreshToken = connection.refresh_token ? decryptToken(connection.refresh_token) : undefined

  const tokenExpiry = new Date(connection.token_expiry)
  const now = new Date()

  if (tokenExpiry <= now && refreshToken) {
    const newTokens = await refreshOutlookAccessToken(refreshToken)
    const encryptedAccessToken = encrypt(newTokens.accessToken)
    const encryptedRefreshToken = newTokens.refreshToken ? encrypt(newTokens.refreshToken) : undefined

    const supabase = adminClient || getAdminClient()
    await supabase
      .from('user_email_connections')
      .update({
        access_token: encryptedAccessToken,
        ...(encryptedRefreshToken && { refresh_token: encryptedRefreshToken }),
        token_expiry: new Date(Date.now() + newTokens.expiresIn * 1000).toISOString(),
      })
      .eq('id', connection.id)

    return newTokens.accessToken
  }

  return accessToken
}

// Format sender string like Gmail does: "Name <email>"
function formatSender(from: { emailAddress: { name: string; address: string } }): string {
  if (from.emailAddress.name) {
    return `${from.emailAddress.name} <${from.emailAddress.address}>`
  }
  return from.emailAddress.address
}

function formatRecipients(recipients: Array<{ emailAddress: { name: string; address: string } }>): string {
  return recipients.map(r => {
    if (r.emailAddress.name) return `${r.emailAddress.name} <${r.emailAddress.address}>`
    return r.emailAddress.address
  }).join(', ')
}

// Strip HTML to plain text
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

// Convert Graph message to our standard email format (matching Gmail service output)
function normalizeMessage(msg: GraphMessage) {
  const body = msg.body?.contentType === 'html'
    ? stripHtml(msg.body.content)
    : (msg.body?.content || '')
  const preview = (msg.bodyPreview || body.slice(0, 200)) + (body.length > 200 ? '...' : '')

  return {
    id: msg.id,
    threadId: msg.conversationId,
    from: msg.from ? formatSender(msg.from) : '',
    to: msg.toRecipients ? formatRecipients(msg.toRecipients) : '',
    cc: msg.ccRecipients ? formatRecipients(msg.ccRecipients) : '',
    subject: msg.subject || '(No subject)',
    date: msg.receivedDateTime || msg.sentDateTime || '',
    preview,
    snippet: msg.bodyPreview || '',
    labelIds: buildLabelIds(msg),
    hasAttachments: msg.hasAttachments || false,
    attachmentCount: msg.hasAttachments ? 1 : 0, // Exact count requires additional API call
  }
}

// Map Outlook properties to Gmail-like label IDs for consistency
function buildLabelIds(msg: GraphMessage): string[] {
  const labels: string[] = []
  if (!msg.isRead) labels.push('UNREAD')
  if (msg.isDraft) labels.push('DRAFT')
  if (msg.importance === 'high') labels.push('IMPORTANT')
  if (msg.flag?.flagStatus === 'flagged') labels.push('STARRED')
  return labels
}

// Build OData $filter from Gmail-like search query (best effort translation)
function translateSearchQuery(query: string): { search?: string; filter?: string } {
  // Simple cases: pass through as $search for Microsoft Graph
  // Graph $search supports: from:, subject:, body:, etc.
  if (!query) return {}

  // Handle newer_than: syntax (Gmail-specific)
  const newerThanMatch = query.match(/newer_than:(\d+)([dmy])/i)
  if (newerThanMatch) {
    const num = parseInt(newerThanMatch[1])
    const unit = newerThanMatch[2].toLowerCase()
    const now = new Date()
    if (unit === 'd') now.setDate(now.getDate() - num)
    else if (unit === 'm') now.setMonth(now.getMonth() - num)
    else if (unit === 'y') now.setFullYear(now.getFullYear() - num)

    const remainingQuery = query.replace(/newer_than:\d+[dmy]/i, '').trim()
    const filter = `receivedDateTime ge ${now.toISOString()}`

    if (remainingQuery) {
      return { search: `"${remainingQuery}"`, filter }
    }
    return { filter }
  }

  // Handle is:unread
  if (query.includes('is:unread')) {
    const remaining = query.replace(/is:unread/g, '').trim()
    const filter = 'isRead eq false'
    if (remaining) return { search: `"${remaining}"`, filter }
    return { filter }
  }

  // Handle is:read
  if (query.includes('is:read')) {
    const remaining = query.replace(/is:read/g, '').trim()
    const filter = 'isRead eq true'
    if (remaining) return { search: `"${remaining}"`, filter }
    return { filter }
  }

  // Handle has:attachment
  if (query.includes('has:attachment')) {
    const remaining = query.replace(/has:attachment/g, '').trim()
    const filter = 'hasAttachments eq true'
    if (remaining) return { search: `"${remaining}"`, filter }
    return { filter }
  }

  // Default: use $search
  return { search: `"${query}"` }
}

// ===================== EMAIL OPERATIONS =====================

// Scan inbox for emails (mirrors Gmail scanInboxForEmails)
export async function scanOutlookInbox(
  userId: string,
  options: {
    maxResults?: number
    query?: string
    after?: Date
    adminClient?: SupabaseClient
  } = {}
) {
  const token = await getOutlookAccessToken(userId, options.adminClient)
  const { maxResults = 20, query = '', after } = options

  const params = new URLSearchParams()
  params.set('$top', String(Math.min(maxResults, 999)))
  params.set('$orderby', 'receivedDateTime desc')
  params.set('$select', 'id,conversationId,subject,bodyPreview,from,toRecipients,ccRecipients,receivedDateTime,isRead,isDraft,importance,flag,hasAttachments,parentFolderId')

  const { search, filter: queryFilter } = translateSearchQuery(query)
  const filters: string[] = []

  if (queryFilter) filters.push(queryFilter)
  if (after) filters.push(`receivedDateTime ge ${after.toISOString()}`)
  if (search) params.set('$search', search)
  if (filters.length > 0) params.set('$filter', filters.join(' and '))

  let allMessages: GraphMessage[] = []
  let url = `/me/messages?${params.toString()}`

  while (allMessages.length < maxResults) {
    const response = await graphRequest<GraphMessageList>(token, url)
    if (!response.value || response.value.length === 0) break

    allMessages = allMessages.concat(response.value)

    if (!response['@odata.nextLink'] || allMessages.length >= maxResults) break
    // Extract the path from the full URL
    url = response['@odata.nextLink'].replace('https://graph.microsoft.com/v1.0', '')
  }

  return allMessages.slice(0, maxResults).map(normalizeMessage)
}

// Get single email by ID
export async function getOutlookEmailById(userId: string, emailId: string) {
  const token = await getOutlookAccessToken(userId)
  const msg = await graphRequest<GraphMessage>(token, `/me/messages/${emailId}`)

  const body = msg.body?.contentType === 'html'
    ? stripHtml(msg.body.content)
    : (msg.body?.content || '')

  return {
    id: msg.id,
    threadId: msg.conversationId,
    from: msg.from ? formatSender(msg.from) : '',
    to: msg.toRecipients ? formatRecipients(msg.toRecipients) : '',
    cc: msg.ccRecipients ? formatRecipients(msg.ccRecipients) : '',
    subject: msg.subject || '(No subject)',
    date: msg.receivedDateTime || '',
    body,
    snippet: msg.bodyPreview || '',
    labelIds: buildLabelIds(msg),
    messageId: msg.internetMessageId || '',
    hasAttachments: msg.hasAttachments || false,
    attachments: [] as Array<{ filename: string; mimeType: string; size: number; attachmentId: string }>,
  }
}

// Get email thread (conversation) by conversation ID
export async function getOutlookThread(userId: string, conversationId: string) {
  const token = await getOutlookAccessToken(userId)
  const response = await graphRequest<GraphMessageList>(
    token,
    `/me/messages?$filter=conversationId eq '${conversationId}'&$orderby=receivedDateTime asc&$top=50`
  )

  if (!response.value || response.value.length === 0) return null

  const messages = response.value.map(msg => {
    const body = msg.body?.contentType === 'html'
      ? stripHtml(msg.body.content)
      : (msg.body?.content || '')

    return {
      id: msg.id,
      from: msg.from ? formatSender(msg.from) : '',
      to: msg.toRecipients ? formatRecipients(msg.toRecipients) : '',
      cc: msg.ccRecipients ? formatRecipients(msg.ccRecipients) : '',
      subject: msg.subject || '(No subject)',
      date: msg.receivedDateTime || '',
      body,
      snippet: msg.bodyPreview || '',
      labelIds: buildLabelIds(msg),
      hasAttachments: msg.hasAttachments || false,
      attachments: [],
    }
  })

  return {
    threadId: conversationId,
    messageCount: messages.length,
    messages,
  }
}

// Send email
export async function sendOutlookEmail(
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
  const token = await getOutlookAccessToken(userId)

  const toRecipients = options.to.split(',').map(e => ({
    emailAddress: { address: e.trim() },
  }))

  const message: Record<string, unknown> = {
    subject: options.subject,
    body: { contentType: 'Text', content: options.body },
    toRecipients,
  }

  if (options.cc) {
    message.ccRecipients = options.cc.split(',').map(e => ({
      emailAddress: { address: e.trim() },
    }))
  }

  if (options.bcc) {
    message.bccRecipients = options.bcc.split(',').map(e => ({
      emailAddress: { address: e.trim() },
    }))
  }

  // If replying, use the reply endpoint
  if (options.replyToMessageId) {
    await graphRequest(token, `/me/messages/${options.replyToMessageId}/reply`, {
      method: 'POST',
      body: { message, comment: options.body },
    })
    return { id: options.replyToMessageId, threadId: options.threadId, labelIds: ['SENT'] }
  }

  const result = await graphRequest<GraphMessage>(token, '/me/sendMail', {
    method: 'POST',
    body: { message, saveToSentItems: true },
  })

  return {
    id: result?.id || 'sent',
    threadId: result?.conversationId || null,
    labelIds: ['SENT'],
  }
}

// Create draft
export async function createOutlookDraft(
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
  const token = await getOutlookAccessToken(userId)

  const message: Record<string, unknown> = {
    subject: options.subject,
    body: { contentType: 'Text', content: options.body },
    toRecipients: options.to.split(',').map(e => ({
      emailAddress: { address: e.trim() },
    })),
  }

  if (options.cc) {
    message.ccRecipients = options.cc.split(',').map(e => ({
      emailAddress: { address: e.trim() },
    }))
  }

  if (options.bcc) {
    message.bccRecipients = options.bcc.split(',').map(e => ({
      emailAddress: { address: e.trim() },
    }))
  }

  const draft = await graphRequest<GraphMessage>(token, '/me/messages', {
    method: 'POST',
    body: message,
  })

  return { id: draft.id, messageId: draft.id }
}

// Get drafts
export async function getOutlookDrafts(userId: string, maxResults: number = 20) {
  const token = await getOutlookAccessToken(userId)
  const response = await graphRequest<GraphMessageList>(
    token,
    `/me/mailFolders/Drafts/messages?$top=${maxResults}&$orderby=lastModifiedDateTime desc`
  )

  return (response.value || []).map(msg => ({
    draftId: msg.id,
    messageId: msg.id,
    to: msg.toRecipients ? formatRecipients(msg.toRecipients) : '',
    subject: msg.subject || '(No subject)',
    body: msg.body?.contentType === 'html' ? stripHtml(msg.body.content) : (msg.body?.content || ''),
    snippet: msg.bodyPreview || '',
  }))
}

// Update draft
export async function updateOutlookDraft(
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
  const token = await getOutlookAccessToken(userId)

  const message: Record<string, unknown> = {
    subject: options.subject,
    body: { contentType: 'Text', content: options.body },
    toRecipients: options.to.split(',').map(e => ({
      emailAddress: { address: e.trim() },
    })),
  }

  if (options.cc) {
    message.ccRecipients = options.cc.split(',').map(e => ({
      emailAddress: { address: e.trim() },
    }))
  }

  const result = await graphRequest<GraphMessage>(token, `/me/messages/${draftId}`, {
    method: 'PATCH',
    body: message,
  })

  return { draftId: result.id, messageId: result.id }
}

// Delete draft
export async function deleteOutlookDraft(userId: string, draftId: string) {
  const token = await getOutlookAccessToken(userId)
  await graphRequest(token, `/me/messages/${draftId}`, { method: 'DELETE' })
  return { success: true }
}

// Send draft
export async function sendOutlookDraft(userId: string, draftId: string) {
  const token = await getOutlookAccessToken(userId)
  await graphRequest(token, `/me/messages/${draftId}/send`, { method: 'POST' })
  return { id: draftId, threadId: null, labelIds: ['SENT'] }
}

// Get folders (equivalent to Gmail labels)
export async function getOutlookFolders(userId: string) {
  const token = await getOutlookAccessToken(userId)
  const response = await graphRequest<{ value: GraphFolder[] }>(token, '/me/mailFolders?$top=100')

  return (response.value || []).map(folder => ({
    id: folder.id,
    name: folder.displayName,
    type: 'user',
    messageListVisibility: 'show',
    labelListVisibility: 'labelShow',
  }))
}

// Create folder (equivalent to Gmail create label)
export async function createOutlookFolder(userId: string, name: string) {
  const token = await getOutlookAccessToken(userId)
  const folder = await graphRequest<GraphFolder>(token, '/me/mailFolders', {
    method: 'POST',
    body: { displayName: name },
  })
  return { id: folder.id, name: folder.displayName }
}

// Move emails to folder (equivalent to Gmail apply labels)
export async function moveToFolder(userId: string, emailIds: string[], folderId: string, adminClient?: SupabaseClient) {
  const token = await getOutlookAccessToken(userId, adminClient)
  await Promise.all(
    emailIds.map(id =>
      graphRequest(token, `/me/messages/${id}/move`, {
        method: 'POST',
        body: { destinationId: folderId },
      })
    )
  )
  return { success: true, modifiedCount: emailIds.length }
}

// Archive emails (move to Archive folder)
export async function archiveOutlookEmails(userId: string, emailIds: string[], adminClient?: SupabaseClient) {
  const token = await getOutlookAccessToken(userId, adminClient)
  await Promise.all(
    emailIds.map(id =>
      graphRequest(token, `/me/messages/${id}/move`, {
        method: 'POST',
        body: { destinationId: 'archive' },
      })
    )
  )
  return { success: true, archivedCount: emailIds.length }
}

// Trash emails (move to Deleted Items)
export async function trashOutlookEmails(userId: string, emailIds: string[]) {
  const token = await getOutlookAccessToken(userId)
  await Promise.all(
    emailIds.map(id =>
      graphRequest(token, `/me/messages/${id}/move`, {
        method: 'POST',
        body: { destinationId: 'deleteditems' },
      })
    )
  )
  return { success: true, trashedCount: emailIds.length, failedCount: 0 }
}

// Bulk trash by search query
export async function bulkTrashOutlookByQuery(userId: string, query: string, maxToTrash: number = 50000, adminClient?: SupabaseClient) {
  const emails = await scanOutlookInbox(userId, { maxResults: maxToTrash, query, adminClient })
  if (emails.length === 0) return { success: true, trashedCount: 0 }

  const token = await getOutlookAccessToken(userId, adminClient)
  const BATCH_SIZE = 20 // Graph API batch limit
  let totalTrashed = 0

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(email =>
        graphRequest(token, `/me/messages/${email.id}/move`, {
          method: 'POST',
          body: { destinationId: 'deleteditems' },
        })
      )
    )
    totalTrashed += batch.length
  }

  return { success: true, trashedCount: totalTrashed }
}

// Restore from trash (move back to Inbox)
export async function untrashOutlookEmails(userId: string, emailIds: string[]) {
  const token = await getOutlookAccessToken(userId)
  await Promise.all(
    emailIds.map(id =>
      graphRequest(token, `/me/messages/${id}/move`, {
        method: 'POST',
        body: { destinationId: 'inbox' },
      })
    )
  )
  return { success: true, restoredCount: emailIds.length }
}

// Permanently delete
export async function permanentlyDeleteOutlookEmails(userId: string, emailIds: string[], confirmed: boolean = false) {
  if (!confirmed) throw new Error('permanentlyDeleteEmails requires explicit confirmation (confirmed: true)')
  const token = await getOutlookAccessToken(userId)
  await Promise.all(
    emailIds.map(id => graphRequest(token, `/me/messages/${id}`, { method: 'DELETE' }))
  )
  return { success: true, deletedCount: emailIds.length }
}

// Mark as read
export async function markOutlookAsRead(userId: string, emailIds: string[]) {
  const token = await getOutlookAccessToken(userId)
  await Promise.all(
    emailIds.map(id =>
      graphRequest(token, `/me/messages/${id}`, {
        method: 'PATCH',
        body: { isRead: true },
      })
    )
  )
  return { success: true, count: emailIds.length }
}

// Mark as unread
export async function markOutlookAsUnread(userId: string, emailIds: string[]) {
  const token = await getOutlookAccessToken(userId)
  await Promise.all(
    emailIds.map(id =>
      graphRequest(token, `/me/messages/${id}`, {
        method: 'PATCH',
        body: { isRead: false },
      })
    )
  )
  return { success: true, count: emailIds.length }
}

// Flag/unflag (Outlook equivalent of star)
export async function flagOutlookEmails(userId: string, emailIds: string[]) {
  const token = await getOutlookAccessToken(userId)
  await Promise.all(
    emailIds.map(id =>
      graphRequest(token, `/me/messages/${id}`, {
        method: 'PATCH',
        body: { flag: { flagStatus: 'flagged' } },
      })
    )
  )
  return { success: true, count: emailIds.length }
}

export async function unflagOutlookEmails(userId: string, emailIds: string[]) {
  const token = await getOutlookAccessToken(userId)
  await Promise.all(
    emailIds.map(id =>
      graphRequest(token, `/me/messages/${id}`, {
        method: 'PATCH',
        body: { flag: { flagStatus: 'notFlagged' } },
      })
    )
  )
  return { success: true, count: emailIds.length }
}

// Mark as important (high importance)
export async function markOutlookAsImportant(userId: string, emailIds: string[]) {
  const token = await getOutlookAccessToken(userId)
  await Promise.all(
    emailIds.map(id =>
      graphRequest(token, `/me/messages/${id}`, {
        method: 'PATCH',
        body: { importance: 'high' },
      })
    )
  )
  return { success: true, count: emailIds.length }
}

export async function markOutlookAsNotImportant(userId: string, emailIds: string[]) {
  const token = await getOutlookAccessToken(userId)
  await Promise.all(
    emailIds.map(id =>
      graphRequest(token, `/me/messages/${id}`, {
        method: 'PATCH',
        body: { importance: 'normal' },
      })
    )
  )
  return { success: true, count: emailIds.length }
}

// Move to Junk (spam equivalent)
export async function reportOutlookSpam(userId: string, emailIds: string[]) {
  const token = await getOutlookAccessToken(userId)
  await Promise.all(
    emailIds.map(id =>
      graphRequest(token, `/me/messages/${id}/move`, {
        method: 'POST',
        body: { destinationId: 'junkemail' },
      })
    )
  )
  return { success: true, count: emailIds.length }
}

export async function markOutlookNotSpam(userId: string, emailIds: string[]) {
  const token = await getOutlookAccessToken(userId)
  await Promise.all(
    emailIds.map(id =>
      graphRequest(token, `/me/messages/${id}/move`, {
        method: 'POST',
        body: { destinationId: 'inbox' },
      })
    )
  )
  return { success: true, count: emailIds.length }
}

// Get attachment
export async function getOutlookAttachment(userId: string, messageId: string, attachmentId: string) {
  const token = await getOutlookAccessToken(userId)
  const attachment = await graphRequest<GraphAttachment>(
    token,
    `/me/messages/${messageId}/attachments/${attachmentId}`
  )
  return {
    data: attachment.contentBytes || null,
    size: attachment.size,
  }
}

// Contact / sender analysis
export async function getOutlookContactFromEmail(userId: string, email: string) {
  const token = await getOutlookAccessToken(userId)

  const response = await graphRequest<GraphMessageList>(
    token,
    `/me/messages?$filter=from/emailAddress/address eq '${email}'&$top=10&$orderby=receivedDateTime desc&$select=id,from,subject,receivedDateTime`
  )

  if (!response.value || response.value.length === 0) return null

  const latest = response.value[0]
  const name = latest.from?.emailAddress?.name || email.split('@')[0]

  return {
    name,
    email,
    totalEmails: response.value.length,
    lastContact: latest.receivedDateTime,
    recentSubjects: response.value.slice(0, 5).map(m => m.subject || ''),
  }
}

export async function getOutlookSenderHistory(userId: string, email: string) {
  const token = await getOutlookAccessToken(userId)

  const [fromResponse, toResponse] = await Promise.all([
    graphRequest<GraphMessageList>(
      token,
      `/me/messages?$filter=from/emailAddress/address eq '${email}'&$top=50&$select=id,subject,receivedDateTime&$orderby=receivedDateTime desc`
    ),
    graphRequest<GraphMessageList>(
      token,
      `/me/messages?$search="to:${email}"&$top=50&$select=id,subject,sentDateTime&$orderby=sentDateTime desc`
    ),
  ])

  const receivedCount = fromResponse.value?.length || 0
  const sentCount = toResponse.value?.length || 0

  const recentEmails = (fromResponse.value || []).slice(0, 10).map(m => ({
    subject: m.subject || '',
    date: m.receivedDateTime || '',
  }))

  return {
    email,
    receivedFromThem: receivedCount,
    sentToThem: sentCount,
    totalInteractions: receivedCount + sentCount,
    recentEmails,
  }
}

// Inbox stats
export async function getOutlookInboxStats(userId: string) {
  const token = await getOutlookAccessToken(userId)

  const [inbox, sent, junk, deleted] = await Promise.all([
    graphRequest<GraphFolder>(token, '/me/mailFolders/Inbox'),
    graphRequest<GraphFolder>(token, '/me/mailFolders/SentItems'),
    graphRequest<GraphFolder>(token, '/me/mailFolders/JunkEmail'),
    graphRequest<GraphFolder>(token, '/me/mailFolders/DeletedItems'),
  ])

  return {
    inbox: {
      total: inbox.totalItemCount || 0,
      unread: inbox.unreadItemCount || 0,
      threads: 0,
    },
    primary: {
      total: inbox.totalItemCount || 0,
      unread: inbox.unreadItemCount || 0,
    },
    sent: { total: sent.totalItemCount || 0 },
    spam: { total: junk.totalItemCount || 0 },
    trash: { total: deleted.totalItemCount || 0 },
    starred: { total: 0 },
  }
}

// Unsubscribe support (check for List-Unsubscribe headers)
export async function findOutlookUnsubscribableEmails(
  userId: string,
  options: { maxResults?: number; query?: string; adminClient?: SupabaseClient } = {}
) {
  const token = await getOutlookAccessToken(userId, options.adminClient)
  const { maxResults = 50 } = options

  // Fetch recent emails with internet message headers
  const response = await graphRequest<GraphMessageList>(
    token,
    `/me/messages?$top=${maxResults}&$orderby=receivedDateTime desc&$select=id,from,subject,receivedDateTime,internetMessageHeaders&$filter=isRead eq true`
  )

  if (!response.value) return []

  const results = response.value
    .filter(msg => {
      const headers = msg.internetMessageHeaders || []
      return headers.some(h => h.name.toLowerCase() === 'list-unsubscribe')
    })
    .map(msg => {
      const headers = msg.internetMessageHeaders || []
      const unsubHeader = headers.find(h => h.name.toLowerCase() === 'list-unsubscribe')?.value || ''
      const hasOneClick = headers.some(h => h.name.toLowerCase() === 'list-unsubscribe-post')

      const urls: string[] = []
      let mailto: string | null = null
      const matches = unsubHeader.match(/<([^>]+)>/g)
      if (matches) {
        for (const match of matches) {
          const value = match.slice(1, -1)
          if (value.startsWith('mailto:')) mailto = value
          else if (value.startsWith('http://') || value.startsWith('https://')) urls.push(value)
        }
      }

      return {
        id: msg.id,
        from: msg.from ? formatSender(msg.from) : 'Unknown',
        subject: msg.subject || '(no subject)',
        date: msg.receivedDateTime || '',
        unsubscribeUrl: urls[0] || null,
        unsubscribeMailto: mailto,
        hasOneClickUnsubscribe: hasOneClick,
        canAutoUnsubscribe: hasOneClick && urls.length > 0,
      }
    })

  // Deduplicate by sender domain
  const seen = new Set<string>()
  const deduped = []
  for (const email of results) {
    const senderMatch = String(email.from).match(/@([^\s>]+)/)
    const domain = senderMatch ? senderMatch[1].toLowerCase() : String(email.from)
    if (!seen.has(domain)) {
      seen.add(domain)
      deduped.push(email)
    }
  }

  return deduped
}

export async function unsubscribeOutlookEmail(
  userId: string,
  emailId: string,
  adminClient?: SupabaseClient
): Promise<{ success: boolean; method: string; message: string }> {
  const token = await getOutlookAccessToken(userId, adminClient)

  const msg = await graphRequest<GraphMessage>(
    token,
    `/me/messages/${emailId}?$select=from,internetMessageHeaders`
  )

  const headers = msg.internetMessageHeaders || []
  const unsubHeader = headers.find(h => h.name.toLowerCase() === 'list-unsubscribe')?.value || ''
  const hasOneClick = headers.some(h => h.name.toLowerCase() === 'list-unsubscribe-post')
  const from = msg.from ? formatSender(msg.from) : 'Unknown sender'

  if (!unsubHeader) {
    return { success: false, method: 'none', message: 'This email does not have an unsubscribe option.' }
  }

  const urls: string[] = []
  let mailto: string | null = null
  const matches = unsubHeader.match(/<([^>]+)>/g)
  if (matches) {
    for (const match of matches) {
      const value = match.slice(1, -1)
      if (value.startsWith('mailto:')) mailto = value
      else if (value.startsWith('http://') || value.startsWith('https://')) urls.push(value)
    }
  }

  if (hasOneClick && urls.length > 0) {
    try {
      const res = await fetch(urls[0], {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'List-Unsubscribe=One-Click',
      })
      if (res.ok || res.status === 200 || res.status === 202) {
        return { success: true, method: 'one-click', message: `Unsubscribed from ${from} via one-click.` }
      }
    } catch {
      // Fall through
    }
  }

  if (urls.length > 0) {
    return { success: true, method: 'link', message: `Unsubscribe link for ${from}: ${urls[0]}` }
  }

  if (mailto) {
    return { success: true, method: 'mailto', message: `To unsubscribe from ${from}, send an email to: ${mailto.replace('mailto:', '')}` }
  }

  return { success: false, method: 'none', message: `Could not find a working unsubscribe method for ${from}.` }
}

export async function bulkUnsubscribeOutlook(
  userId: string,
  emailIds: string[],
  adminClient?: SupabaseClient
) {
  const results = []
  let succeeded = 0
  let failed = 0

  for (const emailId of emailIds) {
    try {
      const result = await unsubscribeOutlookEmail(userId, emailId, adminClient)
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
