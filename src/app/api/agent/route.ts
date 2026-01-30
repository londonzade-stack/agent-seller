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
  analyzeEmailForLeadPotential,
  getUserEmailConnection,
} from '@/lib/gmail/service'

export const maxDuration = 60

// Medical sales focused system prompt
const SYSTEM_PROMPT = `You are an elite AI sales assistant for medical sales professionals. Your name is AgentSeller.

You help users with:
1. **Lead Detection**: Analyze emails to identify potential leads (doctors, hospital administrators, clinic managers, procurement officers)
2. **Email Drafting**: Write professional, personalized sales emails tailored to the medical industry
3. **Follow-up Management**: Suggest optimal follow-up timing and content
4. **Sales Intelligence**: Provide insights on sales strategies for medical equipment and supplies

Your communication style:
- Professional yet approachable
- Knowledgeable about healthcare industry dynamics
- Focus on relationship-building over hard selling
- Always consider HIPAA compliance and healthcare regulations
- Use medical industry terminology appropriately

When drafting emails:
- Address the recipient by their proper title (Dr., Administrator, Director, etc.)
- Reference specific pain points in healthcare settings
- Highlight value propositions relevant to patient care and operational efficiency
- Include clear calls to action
- Keep emails concise but impactful

When analyzing leads:
- Prioritize based on decision-making authority
- Consider budget cycles (end of fiscal year, grant periods)
- Note institutional type (hospital, clinic, research facility)
- Track engagement signals (email opens, meeting requests, questions)

Always be helpful, accurate, and focused on driving sales success while maintaining professional ethics.`

// Create tools that use real Gmail API when connected, fall back to mock data otherwise
function createTools(userId: string | null, isEmailConnected: boolean) {
  return {
    scanInboxForLeads: tool({
      description: 'Scan the connected email inbox to identify potential sales leads from recent emails',
      inputSchema: z.object({
        timeframe: z.enum(['today', 'week', 'month']).describe('The timeframe to scan'),
      }),
      execute: async ({ timeframe }) => {
        if (!isEmailConnected || !userId) {
          return {
            success: false,
            message: 'Please connect your Gmail first to scan for leads.',
            requiresConnection: true,
          }
        }

        try {
          // Calculate date based on timeframe
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

          // Fetch real emails from Gmail
          const emails = await scanInboxForEmails(userId, {
            maxResults: 30,
            after: afterDate,
          })

          // Analyze each email for lead potential
          const analyzedEmails = emails.map((email) => {
            const analysis = analyzeEmailForLeadPotential({
              from: email.from || '',
              subject: email.subject || '',
              preview: email.preview || email.snippet || '',
            })

            return {
              id: email.id,
              from: email.from,
              subject: email.subject,
              preview: email.snippet || email.preview,
              date: email.date,
              isLead: analysis.isLead,
              leadScore: analysis.leadScore,
              leadIndicators: analysis.indicators,
            }
          })

          // Filter to just leads
          const leads = analyzedEmails.filter((e) => e.isLead)

          return {
            success: true,
            timeframe,
            totalEmails: emails.length,
            leadsFound: leads.length,
            leads: leads.map((lead) => ({
              from: lead.from,
              subject: lead.subject,
              preview: lead.preview,
              leadScore: lead.leadScore,
              date: lead.date,
              indicators: lead.leadIndicators,
            })),
          }
        } catch (error) {
          console.error('Error scanning inbox:', error)
          return {
            success: false,
            error: 'Failed to scan inbox. Please try again.',
          }
        }
      },
    }),

    getContactDetails: tool({
      description: 'Get detailed information about a specific contact or lead from email history',
      inputSchema: z.object({
        email: z.string().describe('The email address of the contact'),
      }),
      execute: async ({ email }) => {
        if (!isEmailConnected || !userId) {
          return {
            success: false,
            message: 'Please connect your Gmail first to get contact details.',
            requiresConnection: true,
          }
        }

        try {
          const contact = await getContactFromEmail(userId, email)

          if (contact) {
            return {
              success: true,
              contact: {
                name: contact.name,
                email: contact.email,
                totalEmails: contact.totalEmails,
                lastContact: contact.lastContact,
                recentSubjects: contact.recentSubjects,
              },
            }
          }

          return {
            success: false,
            message: 'No emails found from this contact.',
          }
        } catch (error) {
          console.error('Error getting contact:', error)
          return {
            success: false,
            error: 'Failed to get contact details. Please try again.',
          }
        }
      },
    }),

    draftEmail: tool({
      description: 'Draft a professional sales email and save it as a Gmail draft',
      inputSchema: z.object({
        recipientEmail: z.string().describe('The recipient email address'),
        recipientName: z.string().describe('The recipient name and title'),
        purpose: z.enum(['introduction', 'follow-up', 'demo-request', 'proposal', 'check-in']).describe('The purpose of the email'),
        context: z.string().describe('Additional context about the recipient or previous interactions'),
        productFocus: z.string().nullable().describe('Specific product or service to highlight'),
        subject: z.string().describe('The email subject line'),
        body: z.string().describe('The full email body text'),
      }),
      execute: async ({ recipientEmail, recipientName, purpose, context, productFocus, subject, body }) => {
        if (!isEmailConnected || !userId) {
          // Return draft details without saving to Gmail
          return {
            success: true,
            savedToGmail: false,
            message: 'Connect Gmail to save drafts directly. Here is your draft:',
            draft: {
              to: recipientEmail,
              recipient: recipientName,
              subject,
              body,
              purpose,
              context,
              productFocus: productFocus || 'General medical equipment solutions',
            },
          }
        }

        try {
          // Create actual Gmail draft
          const draft = await createDraft(userId, {
            to: recipientEmail,
            subject,
            body,
          })

          return {
            success: true,
            savedToGmail: true,
            draftId: draft.id,
            message: 'Draft saved to your Gmail drafts folder.',
            draft: {
              to: recipientEmail,
              recipient: recipientName,
              subject,
              body,
              purpose,
              productFocus: productFocus || 'General medical equipment solutions',
            },
          }
        } catch (error) {
          console.error('Error creating draft:', error)
          return {
            success: false,
            error: 'Failed to save draft to Gmail. Here is your draft to copy manually:',
            draft: {
              to: recipientEmail,
              subject,
              body,
            },
          }
        }
      },
    }),

    getSalesActivity: tool({
      description: 'Get a summary of recent email activity and potential pipeline',
      inputSchema: z.object({
        period: z.enum(['daily', 'weekly', 'monthly']).describe('The reporting period'),
      }),
      execute: async ({ period }) => {
        if (!isEmailConnected || !userId) {
          return {
            success: false,
            message: 'Please connect your Gmail first to get activity reports.',
            requiresConnection: true,
          }
        }

        try {
          // Calculate date range
          const now = new Date()
          let afterDate: Date
          switch (period) {
            case 'daily':
              afterDate = new Date(now.setDate(now.getDate() - 1))
              break
            case 'weekly':
              afterDate = new Date(now.setDate(now.getDate() - 7))
              break
            case 'monthly':
              afterDate = new Date(now.setMonth(now.getMonth() - 1))
              break
          }

          // Get emails for the period
          const emails = await scanInboxForEmails(userId, {
            maxResults: 100,
            after: afterDate,
          })

          // Analyze for leads
          const analyzedEmails = emails.map((email) => {
            const analysis = analyzeEmailForLeadPotential({
              from: email.from || '',
              subject: email.subject || '',
              preview: email.preview || '',
            })
            return { ...email, ...analysis }
          })

          const leads = analyzedEmails.filter((e) => e.isLead)

          // Get unique senders
          const uniqueContacts = new Set(emails.map((e) => e.from))

          return {
            success: true,
            period,
            summary: {
              totalEmails: emails.length,
              uniqueContacts: uniqueContacts.size,
              potentialLeads: leads.length,
              highScoreLeads: leads.filter((l) => l.leadScore >= 60).length,
            },
            topLeads: leads
              .sort((a, b) => b.leadScore - a.leadScore)
              .slice(0, 5)
              .map((l) => ({
                from: l.from,
                subject: l.subject,
                leadScore: l.leadScore,
              })),
          }
        } catch (error) {
          console.error('Error getting activity:', error)
          return {
            success: false,
            error: 'Failed to get activity summary. Please try again.',
          }
        }
      },
    }),

    scheduleFollowUp: tool({
      description: 'Schedule a follow-up reminder for a lead (note: this creates a reminder in the chat, not a calendar event)',
      inputSchema: z.object({
        contactEmail: z.string().describe('The contact email address'),
        followUpDate: z.string().describe('The date for follow-up (YYYY-MM-DD format)'),
        notes: z.string().describe('Notes for the follow-up'),
      }),
      execute: async ({ contactEmail, followUpDate, notes }) => {
        // This is a reminder tool - doesn't require Gmail connection
        return {
          success: true,
          reminder: {
            contact: contactEmail,
            date: followUpDate,
            notes,
            message: `Follow-up reminder set for ${followUpDate}. I'll remind you to reach out to ${contactEmail}.`,
          },
        }
      },
    }),
  }
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json()

    // Get current user from Supabase
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id || null

    // Check if user has Gmail connected
    let isEmailConnected = false
    if (userId) {
      const connection = await getUserEmailConnection(userId)
      isEmailConnected = !!connection
    }

    // Create tools with user context
    const tools = createTools(userId, isEmailConnected)

    // Enhance system prompt based on email connection status
    const systemPrompt = isEmailConnected
      ? SYSTEM_PROMPT
      : SYSTEM_PROMPT +
        '\n\nNOTE: The user has not connected their Gmail yet. When they try to use email-related features (scanning inbox, getting contacts, drafting emails), let them know they need to connect their Gmail first. You can still help with general sales advice, email drafting templates, and strategy discussions.'

    const result = streamText({
      model: 'google/gemini-2.5-flash',
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(10),
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
