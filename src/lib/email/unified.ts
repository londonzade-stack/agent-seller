/**
 * Unified Email Service
 *
 * Auto-detects whether the user has Gmail or Outlook connected and
 * delegates to the appropriate provider service. This allows all consumers
 * (agent, API routes, cron jobs) to call one set of functions.
 */
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin, SupabaseClient } from '@supabase/supabase-js'

// Gmail service imports
import {
  getUserEmailConnection as getGmailConnection,
  scanInboxForEmails as gmailScan,
  getEmailById as gmailGetEmail,
  getEmailThread as gmailGetThread,
  sendEmail as gmailSend,
  createDraft as gmailCreateDraft,
  getDrafts as gmailGetDrafts,
  updateDraft as gmailUpdateDraft,
  deleteDraft as gmailDeleteDraft,
  sendDraft as gmailSendDraft,
  getLabels as gmailGetLabels,
  createLabel as gmailCreateLabel,
  applyLabels as gmailApplyLabels,
  removeLabels as gmailRemoveLabels,
  archiveEmails as gmailArchive,
  trashEmails as gmailTrash,
  untrashEmails as gmailUntrash,
  markAsRead as gmailMarkRead,
  markAsUnread as gmailMarkUnread,
  starEmails as gmailStar,
  unstarEmails as gmailUnstar,
  markAsImportant as gmailMarkImportant,
  markAsNotImportant as gmailMarkNotImportant,
  reportSpam as gmailReportSpam,
  markNotSpam as gmailMarkNotSpam,
  getContactFromEmail as gmailGetContact,
  getSenderHistory as gmailGetSenderHistory,
  getInboxStats as gmailGetInboxStats,
  findUnsubscribableEmails as gmailFindUnsub,
  unsubscribeFromEmail as gmailUnsub,
  bulkUnsubscribe as gmailBulkUnsub,
  bulkTrashByQuery as gmailBulkTrash,
} from '@/lib/gmail/service'

// Outlook service imports
import {
  getUserOutlookConnection,
  scanOutlookInbox,
  getOutlookEmailById,
  getOutlookThread,
  sendOutlookEmail,
  createOutlookDraft,
  getOutlookDrafts,
  updateOutlookDraft,
  deleteOutlookDraft,
  sendOutlookDraft,
  getOutlookFolders,
  createOutlookFolder,
  archiveOutlookEmails,
  trashOutlookEmails,
  bulkTrashOutlookByQuery,
  untrashOutlookEmails,
  markOutlookAsRead,
  markOutlookAsUnread,
  flagOutlookEmails,
  unflagOutlookEmails,
  markOutlookAsImportant,
  markOutlookAsNotImportant,
  reportOutlookSpam,
  markOutlookNotSpam,
  getOutlookContactFromEmail,
  getOutlookSenderHistory,
  getOutlookInboxStats,
  findOutlookUnsubscribableEmails,
  unsubscribeOutlookEmail,
  bulkUnsubscribeOutlook,
} from '@/lib/outlook/service'

export type EmailProvider = 'gmail' | 'outlook'

interface ConnectionInfo {
  provider: EmailProvider
  email: string
}

// ─── Provider Detection ─────────────────────────────────────────────

/**
 * Detect which email provider a user has connected.
 * Returns 'gmail' or 'outlook' (prefers gmail if both exist, for backwards compat).
 * Returns null if no email is connected.
 */
export async function getConnectedProvider(
  userId: string,
  adminClient?: SupabaseClient
): Promise<ConnectionInfo | null> {
  let supabase: SupabaseClient
  if (adminClient) {
    supabase = adminClient
  } else {
    supabase = await createClient()
  }

  // Check for any provider
  const { data, error } = await supabase
    .from('user_email_connections')
    .select('provider, email')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error || !data || data.length === 0) return null

  // Prefer gmail for backwards compat; otherwise take first
  const gmail = data.find(d => d.provider === 'gmail')
  if (gmail) return { provider: 'gmail', email: gmail.email }
  return { provider: data[0].provider as EmailProvider, email: data[0].email }
}

/**
 * Get all connected providers for a user (supports multi-provider scenarios).
 */
export async function getAllConnectedProviders(
  userId: string,
  adminClient?: SupabaseClient
): Promise<ConnectionInfo[]> {
  let supabase: SupabaseClient
  if (adminClient) {
    supabase = adminClient
  } else {
    supabase = await createClient()
  }

  const { data, error } = await supabase
    .from('user_email_connections')
    .select('provider, email')
    .eq('user_id', userId)

  if (error || !data) return []
  return data.map(d => ({ provider: d.provider as EmailProvider, email: d.email }))
}

// ─── Unified Functions ──────────────────────────────────────────────

// getUserEmailConnection — now checks any provider
export async function getUserEmailConnection(userId: string, adminClient?: SupabaseClient) {
  const provider = await getConnectedProvider(userId, adminClient)
  if (!provider) return null

  if (provider.provider === 'outlook') {
    return getUserOutlookConnection(userId, adminClient)
  }
  return getGmailConnection(userId, adminClient)
}

// scanInboxForEmails
export async function scanInboxForEmails(
  userId: string,
  options: { maxResults?: number; query?: string; after?: Date; adminClient?: SupabaseClient }
) {
  const provider = await getConnectedProvider(userId, options.adminClient)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return scanOutlookInbox(userId, options)
  }
  return gmailScan(userId, options)
}

// getEmailById
export async function getEmailById(userId: string, emailId: string) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return getOutlookEmailById(userId, emailId)
  }
  return gmailGetEmail(userId, emailId)
}

// getEmailThread
export async function getEmailThread(userId: string, threadId: string) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return getOutlookThread(userId, threadId)
  }
  return gmailGetThread(userId, threadId)
}

// sendEmail (adminClient optional — pass from cron/server contexts without cookies)
export async function sendEmail(
  userId: string,
  options: { to: string; subject: string; body: string; cc?: string; bcc?: string; threadId?: string },
  adminClient?: SupabaseClient
) {
  const provider = await getConnectedProvider(userId, adminClient)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return sendOutlookEmail(userId, options, adminClient)
  }
  return gmailSend(userId, options, adminClient)
}

// createDraft
export async function createDraft(
  userId: string,
  options: { to: string; subject: string; body: string; cc?: string; bcc?: string; threadId?: string }
) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return createOutlookDraft(userId, options)
  }
  return gmailCreateDraft(userId, options)
}

// getDrafts
export async function getDrafts(userId: string, maxResults: number = 20) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return getOutlookDrafts(userId, maxResults)
  }
  return gmailGetDrafts(userId, maxResults)
}

// updateDraft
export async function updateDraft(
  userId: string,
  draftId: string,
  options: { to: string; subject: string; body: string; cc?: string; bcc?: string }
) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return updateOutlookDraft(userId, draftId, options)
  }
  return gmailUpdateDraft(userId, draftId, options)
}

// deleteDraft
export async function deleteDraft(userId: string, draftId: string) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return deleteOutlookDraft(userId, draftId)
  }
  return gmailDeleteDraft(userId, draftId)
}

// sendDraft
export async function sendDraft(userId: string, draftId: string) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return sendOutlookDraft(userId, draftId)
  }
  return gmailSendDraft(userId, draftId)
}

// getLabels / getFolders — unified as "getLabels" for API compatibility
export async function getLabels(userId: string) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return getOutlookFolders(userId)
  }
  return gmailGetLabels(userId)
}

// createLabel / createFolder
export async function createLabel(userId: string, name: string, colors?: { backgroundColor?: string; textColor?: string }) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return createOutlookFolder(userId, name)
  }
  return gmailCreateLabel(userId, name, colors)
}

// applyLabels (Gmail only — Outlook uses moveToFolder, but we handle it)
export async function applyLabels(userId: string, emailIds: string[], labelIds: string[], adminClient?: SupabaseClient) {
  const provider = await getConnectedProvider(userId, adminClient)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    // For Outlook, "applying a label" means moving to a folder
    // Move to the first folder specified
    const { moveToFolder } = await import('@/lib/outlook/service')
    return moveToFolder(userId, emailIds, labelIds[0], adminClient)
  }
  return gmailApplyLabels(userId, emailIds, labelIds, adminClient)
}

// removeLabels (Gmail-specific; Outlook doesn't have label removal — move back to inbox)
export async function removeLabels(userId: string, emailIds: string[], labelIds: string[]) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    // Outlook doesn't have label removal — this is a no-op or move to inbox
    return { modifiedCount: 0 }
  }
  return gmailRemoveLabels(userId, emailIds, labelIds)
}

// archiveEmails
export async function archiveEmails(userId: string, emailIds: string[], adminClient?: SupabaseClient) {
  const provider = await getConnectedProvider(userId, adminClient)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return archiveOutlookEmails(userId, emailIds, adminClient)
  }
  return gmailArchive(userId, emailIds, adminClient)
}

// trashEmails
export async function trashEmails(userId: string, emailIds: string[]) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return trashOutlookEmails(userId, emailIds)
  }
  return gmailTrash(userId, emailIds)
}

// bulkTrashByQuery
export async function bulkTrashByQuery(userId: string, query: string, maxToTrash?: number, adminClient?: SupabaseClient) {
  const provider = await getConnectedProvider(userId, adminClient)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return bulkTrashOutlookByQuery(userId, query, maxToTrash, adminClient)
  }
  return gmailBulkTrash(userId, query, maxToTrash, adminClient)
}

// untrashEmails
export async function untrashEmails(userId: string, emailIds: string[]) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return untrashOutlookEmails(userId, emailIds)
  }
  return gmailUntrash(userId, emailIds)
}

// markAsRead
export async function markAsRead(userId: string, emailIds: string[]) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return markOutlookAsRead(userId, emailIds)
  }
  return gmailMarkRead(userId, emailIds)
}

// markAsUnread
export async function markAsUnread(userId: string, emailIds: string[]) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return markOutlookAsUnread(userId, emailIds)
  }
  return gmailMarkUnread(userId, emailIds)
}

// starEmails / flagEmails
export async function starEmails(userId: string, emailIds: string[]) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return flagOutlookEmails(userId, emailIds)
  }
  return gmailStar(userId, emailIds)
}

// unstarEmails / unflagEmails
export async function unstarEmails(userId: string, emailIds: string[]) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return unflagOutlookEmails(userId, emailIds)
  }
  return gmailUnstar(userId, emailIds)
}

// markAsImportant
export async function markAsImportant(userId: string, emailIds: string[]) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return markOutlookAsImportant(userId, emailIds)
  }
  return gmailMarkImportant(userId, emailIds)
}

// markAsNotImportant
export async function markAsNotImportant(userId: string, emailIds: string[]) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return markOutlookAsNotImportant(userId, emailIds)
  }
  return gmailMarkNotImportant(userId, emailIds)
}

// reportSpam
export async function reportSpam(userId: string, emailIds: string[]) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return reportOutlookSpam(userId, emailIds)
  }
  return gmailReportSpam(userId, emailIds)
}

// markNotSpam
export async function markNotSpam(userId: string, emailIds: string[]) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return markOutlookNotSpam(userId, emailIds)
  }
  return gmailMarkNotSpam(userId, emailIds)
}

// getContactFromEmail
export async function getContactFromEmail(userId: string, email: string) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return getOutlookContactFromEmail(userId, email)
  }
  return gmailGetContact(userId, email)
}

// getSenderHistory
export async function getSenderHistory(userId: string, email: string) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return getOutlookSenderHistory(userId, email)
  }
  return gmailGetSenderHistory(userId, email)
}

// getInboxStats
export async function getInboxStats(userId: string) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return getOutlookInboxStats(userId)
  }
  return gmailGetInboxStats(userId)
}

// findUnsubscribableEmails
export async function findUnsubscribableEmails(
  userId: string,
  options: { maxResults?: number; query?: string; adminClient?: SupabaseClient }
) {
  const provider = await getConnectedProvider(userId, options.adminClient)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return findOutlookUnsubscribableEmails(userId, options)
  }
  return gmailFindUnsub(userId, options)
}

// unsubscribeFromEmail
export async function unsubscribeFromEmail(userId: string, emailId: string) {
  const provider = await getConnectedProvider(userId)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return unsubscribeOutlookEmail(userId, emailId)
  }
  return gmailUnsub(userId, emailId)
}

// bulkUnsubscribe
export async function bulkUnsubscribe(userId: string, emailIds: string[], adminClient?: SupabaseClient) {
  const provider = await getConnectedProvider(userId, adminClient)
  if (!provider) throw new Error('No email connection found for user')

  if (provider.provider === 'outlook') {
    return bulkUnsubscribeOutlook(userId, emailIds)
  }
  return gmailBulkUnsub(userId, emailIds, adminClient)
}
