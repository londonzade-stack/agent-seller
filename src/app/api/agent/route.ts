import {
  streamText,
  convertToModelMessages,
  tool,
  UIMessage,
  stepCountIs,
} from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { sanitizeError } from '@/lib/logger'
import {
  scanInboxForEmails,
  getContactFromEmail,
  createDraft,
  getUserEmailConnection,
  getEmailThread,
  getEmailById,
  sendEmail,
  getLabels,
  createLabel,
  applyLabels,
  removeLabels,
  archiveEmails,
  trashEmails,
  untrashEmails,
  markAsRead,
  markAsUnread,
  starEmails,
  unstarEmails,
  markAsImportant,
  markAsNotImportant,
  reportSpam,
  markNotSpam,
  getSenderHistory,
  getDrafts,
  deleteDraft,
  sendDraft,
  updateDraft,
  findUnsubscribableEmails,
  unsubscribeFromEmail,
  bulkUnsubscribe,
} from '@/lib/gmail/service'

export const maxDuration = 120

const SYSTEM_PROMPT = `You are Emailligence — an AI email agent that ACTS first and talks second. You manage the user's Gmail. You have 30+ tools. USE THEM.

## CORE RULE: ACT, DON'T ASK (except destructive actions)

When the user asks you to do something, DO IT. Don't ask "would you like me to...?" or "shall I...?" — just do the work and report what you did.

BAD: "Would you like me to search for unread emails?"
GOOD: *calls searchEmails* "You have 12 unread emails. Here are the most important ones..."

BAD: "I can help you draft a reply. What would you like to say?"
GOOD: *calls readEmail, then calls draftEmail* "I read the email and drafted a reply. Here's what I wrote: ..."

## WHEN SOMEONE ASKS ABOUT AN EMAIL — READ IT FIRST

If the user mentions an email, a sender, or a subject — go search for it, read it, and THEN respond with the actual content. Don't ask them to clarify which email. Go find it.

"What did John send me?" → searchEmails(from:john) → readEmail → answer with the actual content
"Reply to that invoice email" → searchEmails(subject:invoice newer_than:7d) → readEmail → draft a smart reply based on the content
"What's in my inbox?" → getRecentEmails(today) → summarize the actual emails
"Show me my last 10 emails" → getRecentEmails(timeframe: "all", maxResults: 10) → present in a table
"Show me a table of my last 10 emails" → getRecentEmails(timeframe: "all", maxResults: 10) → format as a markdown table

## MULTI-STEP IS YOUR SUPERPOWER

Chain tools together. You can take up to 30 steps in one turn. Examples:

- "Clean up my inbox" → search old promos → tell user what you found → wait for confirmation → archive them → find newsletters → unsubscribe from junk → report count
- "Help me with that client email" → search → read the thread → draft a reply based on context
- "Star everything from my boss" → search from:boss → star all results
- "What's going on with the Johnson deal?" → search Johnson → read the thread → get sender history → give a full briefing

## BULK OPERATIONS — SEARCH BIG, ACT ONCE

When the user wants to delete, archive, or modify ALL emails from a sender or matching a query:
1. Use maxResults: 500 on the search to grab everything in ONE call
2. Pass ALL the IDs to the action tool in ONE call (trashEmails, archiveEmails, etc. support hundreds of IDs at once)
3. Do NOT loop — one search + one action = done

"Delete all emails from Robinhood" → searchEmails(from:Robinhood, maxResults: 500) → tell user "Found 312 emails from Robinhood" → wait for confirmation → trashEmails(all IDs) → DONE
"Archive everything from newsletters" → searchEmails(category:promotions, maxResults: 500) → tell user "Found 200 promotional emails" → wait for confirmation → archiveEmails(all IDs) → DONE

NEVER search with maxResults: 100 and then loop. Always search with 500 for bulk operations.

## DESTRUCTIVE ACTIONS — ALWAYS ASK FIRST

These actions affect the user's real email and CANNOT be undone easily. You MUST ask for explicit confirmation before executing:

1. **Sending email** (sendEmail, sendDraft) — Show the full draft (to, subject, body) and wait for the user to say "send it" or confirm.
2. **Archiving email** (archiveEmails) — Tell the user exactly what you plan to archive (count + description) and wait for confirmation. Example: "I found 23 promotional emails older than 30 days. Want me to archive them?"
3. **Trashing/deleting email** (trashEmails) — Tell the user exactly what you plan to delete and wait for confirmation. Example: "Found 47 emails from Robinhood. Want me to move them to trash?"

For ALL of these: do the search/research first, then DESCRIBE what you plan to do, then WAIT for the user to confirm before calling the destructive tool.

GOOD flow for "archive my old promos":
1. *calls searchEmails* — finds 34 promo emails
2. "I found 34 promotional emails older than 30 days. Want me to archive them all?"
3. *user says "yes"*
4. *calls archiveEmails* — "Done — archived 34 emails."

GOOD flow for "delete all from Robinhood":
1. *calls searchEmails* — finds 47 emails
2. "Found 47 emails from Robinhood. Should I move them all to trash?"
3. *user says "yes" or "do it"*
4. *calls trashEmails* — "Moved 47 Robinhood emails to trash."

BAD: Immediately calling archiveEmails/trashEmails/sendEmail without asking.

Everything else — reading, searching, starring, labeling, drafting, analyzing, marking read/unread — do WITHOUT asking.

## EMAIL RECIPIENT SAFETY RULE

NEVER send or draft an email to an address the user has not explicitly specified or clearly implied in the current conversation. If you are unsure about a recipient, ask the user to confirm the email address before proceeding. Do not infer or guess email addresses.

## HOW TO RESPOND

- Lead with the answer, not the process. Show results.
- Use markdown to format email content nicely (bold senders, bullet lists for multiple emails).
- When showing emails, include: sender, subject, date, and a brief preview.
- After bulk operations, report the count: "Archived 34 emails" not "I have archived the emails for you."
- Be concise. No filler. No "Great question!" or "I'd be happy to help!"
- When you draft an email, show the full draft (to, subject, body) so the user can review it.

## GMAIL SEARCH SYNTAX — IMPORTANT

NEVER use "after:today" or "before:today" — those are NOT valid Gmail queries and will return 0 results.
Use these instead:
- "Today's emails" → newer_than:1d
- "This week" → newer_than:7d
- "Last 30 days" → newer_than:30d
- "Specific date" → after:2026/02/12 (YYYY/MM/DD format only)
- "Date range" → after:2026/01/01 before:2026/02/01

Common useful operators:
- from:sender@example.com
- to:recipient@example.com
- subject:keyword
- has:attachment
- filename:pdf (or filename:xlsx, filename:docx)
- is:unread / is:read / is:starred
- label:name
- newer_than:Nd / newer_than:Nm / newer_than:Ny (days/months/years)
- larger:5M / smaller:1M

## SMART DEFAULTS

- When searching, default to recent emails (newer_than:7d) unless the user specifies otherwise.
- When the user says "emails" without context, check recent unread first.
- For "clean up" requests: search for read promotional emails older than 30 days, tell the user what you found, wait for confirmation, then archive and report what you did.
- For "unsubscribe" requests: scan for newsletters/promotions, show the list, then auto-unsubscribe from all of them using one-click when available.
- When unsubscribing, use bulkUnsubscribe for multiple at once. If one-click isn't available, provide the unsubscribe link.
- For vague requests like "help me with email" — pull their recent unread and summarize what needs attention.
- When drafting replies, read the original thread first so you write something contextually relevant.
- Match the tone of the original email in your drafts (formal → formal, casual → casual).`

// Create all the powerful tools
function createTools(userId: string | null, isEmailConnected: boolean) {
  return {
    // ============ SEARCH & READ ============
    searchEmails: tool({
      description: 'Power search Gmail with any query. Supports full Gmail search syntax. IMPORTANT: For "today" use newer_than:1d (NOT after:today which is invalid). For date ranges use after:YYYY/MM/DD format.',
      inputSchema: z.object({
        query: z.string().describe('Gmail search query. Use newer_than:1d for today, newer_than:7d for this week. NEVER use after:today. Date format: after:YYYY/MM/DD'),
        maxResults: z.number().optional().default(20).describe('Max emails to return (default 20, max 500). Use 500 for bulk operations like "delete all from X" or "archive everything".'),
      }),
      execute: async ({ query, maxResults }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const emails = await scanInboxForEmails(userId, { maxResults: Math.min(maxResults || 20, 500), query })
          return {
            success: true,
            query,
            totalFound: emails.length,
            emails: emails.map((e) => ({
              id: e.id,
              threadId: e.threadId,
              from: e.from,
              to: e.to,
              subject: e.subject,
              date: e.date,
              preview: e.snippet || e.preview,
              hasAttachments: e.hasAttachments,
              attachmentCount: e.attachmentCount,
              labels: e.labelIds,
            })),
          }
        } catch (error) {
          sanitizeError('Search error', error)
          return { success: false, error: 'Failed to search emails.' }
        }
      },
    }),

    readEmail: tool({
      description: 'Read the full content of a specific email by ID.',
      inputSchema: z.object({
        emailId: z.string().describe('The email ID'),
      }),
      execute: async ({ emailId }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const email = await getEmailById(userId, emailId)
          return { success: true, email }
        } catch (error) {
          sanitizeError('Read error', error)
          return { success: false, error: 'Failed to read email.' }
        }
      },
    }),

    getEmailThread: tool({
      description: 'Get entire email conversation thread.',
      inputSchema: z.object({
        threadId: z.string().describe('The thread ID'),
      }),
      execute: async ({ threadId }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const thread = await getEmailThread(userId, threadId)
          return { success: true, thread }
        } catch (error) {
          sanitizeError('Thread error', error)
          return { success: false, error: 'Failed to get thread.' }
        }
      },
    }),

    // ============ SEND & DRAFT ============
    sendEmail: tool({
      description: 'Send an email immediately. Use this to send emails directly without creating a draft first.',
      inputSchema: z.object({
        to: z.string().describe('Recipient email address(es), comma-separated for multiple'),
        subject: z.string().describe('Email subject'),
        body: z.string().describe('Email body text'),
        cc: z.string().optional().describe('CC recipients'),
        bcc: z.string().optional().describe('BCC recipients'),
        replyToThreadId: z.string().optional().describe('Thread ID if replying to an existing thread'),
      }),
      execute: async ({ to, subject, body, cc, bcc, replyToThreadId }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const result = await sendEmail(userId, { to, subject, body, cc, bcc, threadId: replyToThreadId })
          return {
            success: true,
            message: 'Email sent successfully!',
            messageId: result.id,
            threadId: result.threadId,
          }
        } catch (error) {
          sanitizeError('Send error', error)
          return { success: false, error: 'Failed to send email.' }
        }
      },
    }),

    draftEmail: tool({
      description: 'Create and save an email draft.',
      inputSchema: z.object({
        to: z.string().describe('Recipient email'),
        subject: z.string().describe('Subject line'),
        body: z.string().describe('Email body'),
        cc: z.string().optional().describe('CC recipients'),
        bcc: z.string().optional().describe('BCC recipients'),
        replyToThreadId: z.string().optional().describe('Thread ID if replying'),
      }),
      execute: async ({ to, subject, body, cc, bcc, replyToThreadId }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, savedToGmail: false, draft: { to, subject, body } }
        }
        try {
          const draft = await createDraft(userId, { to, subject, body, cc, bcc, threadId: replyToThreadId })
          return {
            success: true,
            savedToGmail: true,
            draftId: draft.id,
            message: 'Draft saved to Gmail!',
            draft: { to, subject, body },
          }
        } catch (error) {
          sanitizeError('Draft error', error)
          return { success: false, error: 'Failed to save draft.', draft: { to, subject, body } }
        }
      },
    }),

    getDrafts: tool({
      description: 'Get all email drafts.',
      inputSchema: z.object({
        maxResults: z.number().optional().default(20),
      }),
      execute: async ({ maxResults }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const drafts = await getDrafts(userId, maxResults || 20)
          return { success: true, count: drafts.length, drafts }
        } catch (error) {
          sanitizeError('Drafts error', error)
          return { success: false, error: 'Failed to get drafts.' }
        }
      },
    }),

    updateDraft: tool({
      description: 'Update an existing draft.',
      inputSchema: z.object({
        draftId: z.string().describe('Draft ID to update'),
        to: z.string().describe('Recipient'),
        subject: z.string().describe('Subject'),
        body: z.string().describe('Body'),
        cc: z.string().optional(),
        bcc: z.string().optional(),
      }),
      execute: async ({ draftId, to, subject, body, cc, bcc }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const result = await updateDraft(userId, draftId, { to, subject, body, cc, bcc })
          return { success: true, message: 'Draft updated!', draftId: result.draftId }
        } catch (error) {
          sanitizeError('Update draft error', error)
          return { success: false, error: 'Failed to update draft.' }
        }
      },
    }),

    sendDraft: tool({
      description: 'Send an existing draft.',
      inputSchema: z.object({
        draftId: z.string().describe('Draft ID to send'),
      }),
      execute: async ({ draftId }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const result = await sendDraft(userId, draftId)
          return { success: true, message: 'Draft sent!', messageId: result.id }
        } catch (error) {
          sanitizeError('Send draft error', error)
          return { success: false, error: 'Failed to send draft.' }
        }
      },
    }),

    deleteDraft: tool({
      description: 'Delete a draft.',
      inputSchema: z.object({
        draftId: z.string().describe('Draft ID to delete'),
      }),
      execute: async ({ draftId }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          await deleteDraft(userId, draftId)
          return { success: true, message: 'Draft deleted!' }
        } catch (error) {
          sanitizeError('Delete draft error', error)
          return { success: false, error: 'Failed to delete draft.' }
        }
      },
    }),

    // ============ LABELS ============
    getLabels: tool({
      description: 'Get all Gmail labels.',
      inputSchema: z.object({}),
      execute: async () => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const labels = await getLabels(userId)
          return { success: true, labels }
        } catch (error) {
          sanitizeError('Labels error', error)
          return { success: false, error: 'Failed to get labels.' }
        }
      },
    }),

    createLabel: tool({
      description: 'Create a new Gmail label.',
      inputSchema: z.object({
        name: z.string().describe('Label name'),
        backgroundColor: z.string().optional().describe('Background color hex'),
        textColor: z.string().optional().describe('Text color hex'),
      }),
      execute: async ({ name, backgroundColor, textColor }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const label = await createLabel(userId, name, { backgroundColor, textColor })
          const encodedName = encodeURIComponent(name).replace(/%20/g, '+')
          const gmailUrl = `https://mail.google.com/mail/u/0/#label/${encodedName}`
          return { success: true, message: `Label "${name}" created!`, label, gmailUrl }
        } catch (error: unknown) {
          sanitizeError('Create label error', error)
          // Provide actionable error details to the agent
          const errMsg = error instanceof Error ? error.message : String(error)
          if (errMsg.includes('409') || errMsg.toLowerCase().includes('already exists')) {
            return { success: false, error: `A label named "${name}" already exists. Use getLabels to find its ID.` }
          }
          if (errMsg.includes('403') || errMsg.includes('insufficient')) {
            return { success: false, error: 'Insufficient permissions to create labels. The user may need to reconnect Gmail.' }
          }
          return { success: false, error: `Failed to create label: ${errMsg.slice(0, 150)}` }
        }
      },
    }),

    applyLabels: tool({
      description: 'Apply labels to emails. Supports bulk operations.',
      inputSchema: z.object({
        emailIds: z.array(z.string()).describe('Array of email IDs'),
        labelIds: z.array(z.string()).describe('Array of label IDs to apply'),
      }),
      execute: async ({ emailIds, labelIds }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const result = await applyLabels(userId, emailIds, labelIds)
          return { success: true, message: `Labels applied to ${result.modifiedCount} emails!`, modifiedCount: result.modifiedCount }
        } catch (error: unknown) {
          sanitizeError('Apply labels error', error)
          const errMsg = error instanceof Error ? error.message : String(error)
          return { success: false, error: `Failed to apply labels: ${errMsg.slice(0, 150)}` }
        }
      },
    }),

    removeLabels: tool({
      description: 'Remove labels from emails. Supports bulk operations.',
      inputSchema: z.object({
        emailIds: z.array(z.string()).describe('Array of email IDs'),
        labelIds: z.array(z.string()).describe('Array of label IDs to remove'),
      }),
      execute: async ({ emailIds, labelIds }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const result = await removeLabels(userId, emailIds, labelIds)
          return { success: true, message: `Labels removed from ${result.modifiedCount} emails!` }
        } catch (error) {
          sanitizeError('Remove labels error', error)
          return { success: false, error: 'Failed to remove labels.' }
        }
      },
    }),

    // ============ ARCHIVE, TRASH, DELETE ============
    archiveEmails: tool({
      description: 'Archive emails (remove from inbox but keep in All Mail). Supports bulk.',
      inputSchema: z.object({
        emailIds: z.array(z.string()).describe('Array of email IDs to archive'),
      }),
      execute: async ({ emailIds }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const result = await archiveEmails(userId, emailIds)
          return { success: true, message: `Archived ${result.archivedCount} emails!` }
        } catch (error) {
          sanitizeError('Archive error', error)
          return { success: false, error: 'Failed to archive emails.' }
        }
      },
    }),

    trashEmails: tool({
      description: 'Move emails to trash. Supports bulk operations.',
      inputSchema: z.object({
        emailIds: z.array(z.string()).describe('Array of email IDs to trash'),
      }),
      execute: async ({ emailIds }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const result = await trashEmails(userId, emailIds)
          return { success: true, message: `Moved ${result.trashedCount} emails to trash!` }
        } catch (error) {
          sanitizeError('Trash error', error)
          return { success: false, error: 'Failed to trash emails.' }
        }
      },
    }),

    untrashEmails: tool({
      description: 'Restore emails from trash.',
      inputSchema: z.object({
        emailIds: z.array(z.string()).describe('Array of email IDs to restore'),
      }),
      execute: async ({ emailIds }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const result = await untrashEmails(userId, emailIds)
          return { success: true, message: `Restored ${result.restoredCount} emails from trash!` }
        } catch (error) {
          sanitizeError('Untrash error', error)
          return { success: false, error: 'Failed to restore emails.' }
        }
      },
    }),

    // ============ READ/UNREAD, STAR, IMPORTANT ============
    markAsRead: tool({
      description: 'Mark emails as read. Supports bulk.',
      inputSchema: z.object({
        emailIds: z.array(z.string()).describe('Email IDs to mark as read'),
      }),
      execute: async ({ emailIds }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const result = await markAsRead(userId, emailIds)
          return { success: true, message: `Marked ${result.count} emails as read!` }
        } catch (error) {
          sanitizeError('Mark read error', error)
          return { success: false, error: 'Failed to mark as read.' }
        }
      },
    }),

    markAsUnread: tool({
      description: 'Mark emails as unread. Supports bulk.',
      inputSchema: z.object({
        emailIds: z.array(z.string()).describe('Email IDs to mark as unread'),
      }),
      execute: async ({ emailIds }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const result = await markAsUnread(userId, emailIds)
          return { success: true, message: `Marked ${result.count} emails as unread!` }
        } catch (error) {
          sanitizeError('Mark unread error', error)
          return { success: false, error: 'Failed to mark as unread.' }
        }
      },
    }),

    starEmails: tool({
      description: 'Star emails. Supports bulk.',
      inputSchema: z.object({
        emailIds: z.array(z.string()).describe('Email IDs to star'),
      }),
      execute: async ({ emailIds }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const result = await starEmails(userId, emailIds)
          return { success: true, message: `Starred ${result.count} emails!` }
        } catch (error) {
          sanitizeError('Star error', error)
          return { success: false, error: 'Failed to star emails.' }
        }
      },
    }),

    unstarEmails: tool({
      description: 'Remove star from emails. Supports bulk.',
      inputSchema: z.object({
        emailIds: z.array(z.string()).describe('Email IDs to unstar'),
      }),
      execute: async ({ emailIds }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const result = await unstarEmails(userId, emailIds)
          return { success: true, message: `Unstarred ${result.count} emails!` }
        } catch (error) {
          sanitizeError('Unstar error', error)
          return { success: false, error: 'Failed to unstar emails.' }
        }
      },
    }),

    markAsImportant: tool({
      description: 'Mark emails as important. Supports bulk.',
      inputSchema: z.object({
        emailIds: z.array(z.string()).describe('Email IDs to mark important'),
      }),
      execute: async ({ emailIds }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const result = await markAsImportant(userId, emailIds)
          return { success: true, message: `Marked ${result.count} emails as important!` }
        } catch (error) {
          sanitizeError('Important error', error)
          return { success: false, error: 'Failed to mark as important.' }
        }
      },
    }),

    markAsNotImportant: tool({
      description: 'Remove important flag from emails. Supports bulk.',
      inputSchema: z.object({
        emailIds: z.array(z.string()).describe('Email IDs to mark not important'),
      }),
      execute: async ({ emailIds }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const result = await markAsNotImportant(userId, emailIds)
          return { success: true, message: `Removed important flag from ${result.count} emails!` }
        } catch (error) {
          sanitizeError('Not important error', error)
          return { success: false, error: 'Failed to mark as not important.' }
        }
      },
    }),

    // ============ SPAM ============
    reportSpam: tool({
      description: 'Report emails as spam. Supports bulk.',
      inputSchema: z.object({
        emailIds: z.array(z.string()).describe('Email IDs to report as spam'),
      }),
      execute: async ({ emailIds }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const result = await reportSpam(userId, emailIds)
          return { success: true, message: `Reported ${result.count} emails as spam!` }
        } catch (error) {
          sanitizeError('Spam error', error)
          return { success: false, error: 'Failed to report spam.' }
        }
      },
    }),

    markNotSpam: tool({
      description: 'Mark emails as not spam (rescue from spam folder).',
      inputSchema: z.object({
        emailIds: z.array(z.string()).describe('Email IDs to mark as not spam'),
      }),
      execute: async ({ emailIds }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const result = await markNotSpam(userId, emailIds)
          return { success: true, message: `Rescued ${result.count} emails from spam!` }
        } catch (error) {
          sanitizeError('Not spam error', error)
          return { success: false, error: 'Failed to mark as not spam.' }
        }
      },
    }),

    // ============ CONTACTS & ANALYSIS ============
    getContactDetails: tool({
      description: 'Get info about a contact from email history.',
      inputSchema: z.object({
        email: z.string().describe('Email address to look up'),
      }),
      execute: async ({ email }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const contact = await getContactFromEmail(userId, email)
          return contact ? { success: true, contact } : { success: false, message: `No emails found from ${email}` }
        } catch (error) {
          sanitizeError('Contact error', error)
          return { success: false, error: 'Failed to get contact details.' }
        }
      },
    }),

    getSenderHistory: tool({
      description: 'Get complete email history with a contact - emails sent and received.',
      inputSchema: z.object({
        email: z.string().describe('Email address to analyze'),
      }),
      execute: async ({ email }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const history = await getSenderHistory(userId, email)
          return { success: true, history }
        } catch (error) {
          sanitizeError('History error', error)
          return { success: false, error: 'Failed to get sender history.' }
        }
      },
    }),

    getInboxStats: tool({
      description: 'Get inbox statistics and analytics.',
      inputSchema: z.object({
        timeframe: z.enum(['today', 'week', 'month']).describe('Time period'),
      }),
      execute: async ({ timeframe }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const now = new Date()
          let afterDate: Date
          switch (timeframe) {
            case 'today':
              afterDate = new Date(now.setHours(0, 0, 0, 0))
              break
            case 'week':
              afterDate = new Date(now.setDate(now.getDate() - 7))
              break
            case 'month':
              afterDate = new Date(now.setMonth(now.getMonth() - 1))
              break
          }

          const emails = await scanInboxForEmails(userId, { maxResults: 100, after: afterDate })

          const senderCounts: Record<string, number> = {}
          let unreadCount = 0
          let withAttachments = 0

          emails.forEach((e) => {
            const sender = e.from || 'Unknown'
            senderCounts[sender] = (senderCounts[sender] || 0) + 1
            if (e.labelIds?.includes('UNREAD')) unreadCount++
            if (e.hasAttachments) withAttachments++
          })

          const topSenders = Object.entries(senderCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([sender, count]) => ({ sender, count }))

          return {
            success: true,
            timeframe,
            stats: {
              totalEmails: emails.length,
              unreadEmails: unreadCount,
              emailsWithAttachments: withAttachments,
              uniqueSenders: Object.keys(senderCounts).length,
              topSenders,
            },
          }
        } catch (error) {
          sanitizeError('Stats error', error)
          return { success: false, error: 'Failed to get inbox stats.' }
        }
      },
    }),

    // ============ UNSUBSCRIBE ============
    findUnsubscribableEmails: tool({
      description: 'Scan inbox for emails that have unsubscribe options (newsletters, marketing, promotions). Returns a deduplicated list by sender domain.',
      inputSchema: z.object({
        query: z.string().optional().describe('Optional search query to narrow down. Default searches promotions/updates/social categories.'),
        maxResults: z.number().optional().default(50).describe('Max emails to scan (default 50)'),
      }),
      execute: async ({ query, maxResults }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const emails = await findUnsubscribableEmails(userId, { maxResults: maxResults || 50, query: query || undefined })
          return {
            success: true,
            totalFound: emails.length,
            emails: emails.map(e => ({
              id: e.id,
              from: e.from,
              subject: e.subject,
              date: e.date,
              canAutoUnsubscribe: e.canAutoUnsubscribe,
              hasOneClickUnsubscribe: e.hasOneClickUnsubscribe,
              unsubscribeUrl: e.unsubscribeUrl,
            })),
          }
        } catch (error) {
          sanitizeError('Find unsubscribable error', error)
          return { success: false, error: 'Failed to scan for unsubscribable emails.' }
        }
      },
    }),

    unsubscribeFromEmail: tool({
      description: 'Unsubscribe from a specific email sender. Uses RFC 8058 one-click unsubscribe when available, otherwise returns the unsubscribe link.',
      inputSchema: z.object({
        emailId: z.string().describe('The email ID to unsubscribe from'),
      }),
      execute: async ({ emailId }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const result = await unsubscribeFromEmail(userId, emailId)
          return result
        } catch (error) {
          sanitizeError('Unsubscribe error', error)
          return { success: false, method: 'error', message: 'Failed to unsubscribe.' }
        }
      },
    }),

    bulkUnsubscribe: tool({
      description: 'Unsubscribe from multiple email senders at once. Pass an array of email IDs.',
      inputSchema: z.object({
        emailIds: z.array(z.string()).describe('Array of email IDs to unsubscribe from'),
      }),
      execute: async ({ emailIds }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const result = await bulkUnsubscribe(userId, emailIds)
          return {
            success: true,
            message: `Unsubscribed from ${result.succeeded} senders. ${result.failed > 0 ? `${result.failed} failed.` : ''}`,
            succeeded: result.succeeded,
            failed: result.failed,
            results: result.results,
          }
        } catch (error) {
          sanitizeError('Bulk unsubscribe error', error)
          return { success: false, error: 'Failed to bulk unsubscribe.' }
        }
      },
    }),

    // ============ QUICK ACTIONS ============
    getRecentEmails: tool({
      description: 'Get recent emails. Use timeframe "all" when user asks for "last N emails" without a specific date range.',
      inputSchema: z.object({
        timeframe: z.enum(['today', 'week', 'month', 'all']).default('all').describe('How far back. Use "all" for "last N emails" requests. Defaults to "all".'),
        maxResults: z.number().optional().default(25),
        unreadOnly: z.boolean().optional().default(false),
      }),
      execute: async ({ timeframe, maxResults, unreadOnly }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          let afterDate: Date | undefined
          if (timeframe !== 'all') {
            const now = new Date()
            switch (timeframe) {
              case 'today':
                afterDate = new Date(now.setHours(0, 0, 0, 0))
                break
              case 'week':
                afterDate = new Date(now.setDate(now.getDate() - 7))
                break
              case 'month':
                afterDate = new Date(now.setMonth(now.getMonth() - 1))
                break
            }
          }

          const query = unreadOnly ? 'is:unread' : ''
          const emails = await scanInboxForEmails(userId, {
            maxResults: maxResults || 25,
            after: afterDate,
            query: query || undefined,
          })

          return {
            success: true,
            timeframe,
            totalEmails: emails.length,
            emails: emails.map((e) => ({
              id: e.id,
              threadId: e.threadId,
              from: e.from,
              subject: e.subject,
              date: e.date,
              preview: e.snippet || e.preview,
              hasAttachments: e.hasAttachments,
            })),
          }
        } catch (error) {
          sanitizeError('Recent error', error)
          return { success: false, error: 'Failed to get recent emails.' }
        }
      },
    }),
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id || null

    // Authentication required — reject unauthenticated requests
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Authentication required. Please log in to use the AI agent.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check billing status — block usage if no valid subscription
    if (userId) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', userId)
        .single()

      const billingStatus = subscription?.status
      if (billingStatus !== 'active' && billingStatus !== 'trialing') {
        return new Response(
          JSON.stringify({ error: 'Please set up billing to use the AI agent.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Rate limit: 20 requests per minute per user (or per IP for unauthenticated)
    const rateLimitKey = userId || req.headers.get('x-forwarded-for') || 'anonymous'
    const rateLimitResult = rateLimit(rateLimitKey, 20, 60 * 1000)

    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests. Please wait before trying again.',
          retryAfterMs: rateLimitResult.resetMs,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(rateLimitResult.resetMs / 1000)),
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          },
        }
      )
    }

    const { messages }: { messages: UIMessage[] } = await req.json()

    let isEmailConnected = false
    if (userId) {
      const connection = await getUserEmailConnection(userId)
      isEmailConnected = !!connection
    }

    const tools = createTools(userId, isEmailConnected)

    const systemPrompt = isEmailConnected
      ? SYSTEM_PROMPT
      : SYSTEM_PROMPT +
        '\n\n⚠️ NOTE: Gmail is not connected yet. Encourage the user to connect their Gmail to unlock all these powerful features!'

    const result = streamText({
      model: 'google/gemini-2.5-flash',
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(30),
      abortSignal: req.signal,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    sanitizeError('Agent API error', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
