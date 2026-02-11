import {
  streamText,
  convertToModelMessages,
  tool,
  UIMessage,
  stepCountIs,
} from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
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
} from '@/lib/gmail/service'

export const maxDuration = 120

const SYSTEM_PROMPT = `You are AgentSeller — an AI email agent that ACTS first and talks second. You manage the user's Gmail. You have 30+ tools. USE THEM.

## CORE RULE: ACT, DON'T ASK

When the user asks you to do something, DO IT. Don't ask "would you like me to...?" or "shall I...?" — just do the work and report what you did.

BAD: "Would you like me to search for unread emails?"
GOOD: *calls searchEmails* "You have 12 unread emails. Here are the most important ones..."

BAD: "I can help you draft a reply. What would you like to say?"
GOOD: *calls readEmail, then calls draftEmail* "I read the email and drafted a reply. Here's what I wrote: ..."

BAD: "Should I archive these?"
GOOD: *calls archiveEmails* "Done — archived 23 promotional emails."

## WHEN SOMEONE ASKS ABOUT AN EMAIL — READ IT FIRST

If the user mentions an email, a sender, or a subject — go search for it, read it, and THEN respond with the actual content. Don't ask them to clarify which email. Go find it.

"What did John send me?" → searchEmails(from:john) → readEmail → answer with the actual content
"Reply to that invoice email" → searchEmails(subject:invoice newer_than:7d) → readEmail → draft a smart reply based on the content
"What's in my inbox?" → getRecentEmails(today) → summarize the actual emails

## MULTI-STEP IS YOUR SUPERPOWER

Chain tools together. You can take up to 30 steps in one turn. Examples:

- "Clean up my inbox" → search old promos → archive them → search newsletters → archive those → report count
- "Help me with that client email" → search → read the thread → draft a reply based on context
- "Star everything from my boss" → search from:boss → star all results
- "What's going on with the Johnson deal?" → search Johnson → read the thread → get sender history → give a full briefing

## ONLY ASK PERMISSION FOR:

1. SENDING an email (show the draft first, wait for "send it")
2. TRASHING more than 20 emails at once
3. That's it. Everything else — just do it.

Reading emails, searching, archiving, starring, labeling, drafting, analyzing — all of these you do WITHOUT asking.

## HOW TO RESPOND

- Lead with the answer, not the process. Show results.
- Use markdown to format email content nicely (bold senders, bullet lists for multiple emails).
- When showing emails, include: sender, subject, date, and a brief preview.
- After bulk operations, report the count: "Archived 34 emails" not "I have archived the emails for you."
- Be concise. No filler. No "Great question!" or "I'd be happy to help!"
- When you draft an email, show the full draft (to, subject, body) so the user can review it.

## SMART DEFAULTS

- When searching, default to recent emails (newer_than:7d) unless the user specifies otherwise.
- When the user says "emails" without context, check recent unread first.
- For "clean up" requests: archive read promotional emails older than 30 days, then report what you did.
- For vague requests like "help me with email" — pull their recent unread and summarize what needs attention.
- When drafting replies, read the original thread first so you write something contextually relevant.
- Match the tone of the original email in your drafts (formal → formal, casual → casual).`

// Create all the powerful tools
function createTools(userId: string | null, isEmailConnected: boolean) {
  return {
    // ============ SEARCH & READ ============
    searchEmails: tool({
      description: 'Power search Gmail with any query. Supports full Gmail search syntax.',
      inputSchema: z.object({
        query: z.string().describe('Gmail search query - supports from:, to:, subject:, has:attachment, is:unread, after:, before:, label:, etc.'),
        maxResults: z.number().optional().default(20).describe('Max emails to return (default 20, max 100)'),
      }),
      execute: async ({ query, maxResults }) => {
        if (!isEmailConnected || !userId) {
          return { success: false, message: 'Please connect your Gmail first.', requiresConnection: true }
        }
        try {
          const emails = await scanInboxForEmails(userId, { maxResults: Math.min(maxResults || 20, 100), query })
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
          console.error('Search error:', error)
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
          console.error('Read error:', error)
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
          console.error('Thread error:', error)
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
          console.error('Send error:', error)
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
          console.error('Draft error:', error)
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
          console.error('Drafts error:', error)
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
          console.error('Update draft error:', error)
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
          console.error('Send draft error:', error)
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
          console.error('Delete draft error:', error)
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
          console.error('Labels error:', error)
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
          return { success: true, message: `Label "${name}" created!`, label }
        } catch (error) {
          console.error('Create label error:', error)
          return { success: false, error: 'Failed to create label.' }
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
          return { success: true, message: `Labels applied to ${result.modifiedCount} emails!` }
        } catch (error) {
          console.error('Apply labels error:', error)
          return { success: false, error: 'Failed to apply labels.' }
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
          console.error('Remove labels error:', error)
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
          console.error('Archive error:', error)
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
          console.error('Trash error:', error)
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
          console.error('Untrash error:', error)
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
          console.error('Mark read error:', error)
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
          console.error('Mark unread error:', error)
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
          console.error('Star error:', error)
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
          console.error('Unstar error:', error)
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
          console.error('Important error:', error)
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
          console.error('Not important error:', error)
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
          console.error('Spam error:', error)
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
          console.error('Not spam error:', error)
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
          console.error('Contact error:', error)
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
          console.error('History error:', error)
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
          console.error('Stats error:', error)
          return { success: false, error: 'Failed to get inbox stats.' }
        }
      },
    }),

    // ============ QUICK ACTIONS ============
    getRecentEmails: tool({
      description: 'Quick way to get recent emails.',
      inputSchema: z.object({
        timeframe: z.enum(['today', 'week', 'month']).describe('How far back'),
        maxResults: z.number().optional().default(25),
        unreadOnly: z.boolean().optional().default(false),
      }),
      execute: async ({ timeframe, maxResults, unreadOnly }) => {
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
          console.error('Recent error:', error)
          return { success: false, error: 'Failed to get recent emails.' }
        }
      },
    }),
  }
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id || null

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
    console.error('Agent API error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
