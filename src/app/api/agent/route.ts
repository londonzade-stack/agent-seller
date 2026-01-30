import {
  streamText,
  convertToModelMessages,
  tool,
  UIMessage,
  stepCountIs,
} from 'ai'
import { z } from 'zod'

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

// Simulated email data for demo purposes
const MOCK_EMAILS = [
  {
    id: '1',
    from: 'dr.sarah.johnson@mercy-hospital.org',
    subject: 'Re: Surgical Equipment Demo Request',
    preview: 'Thank you for reaching out. Our cardiology department is currently evaluating new surgical suites...',
    date: '2024-01-28',
    isLead: true,
    leadScore: 85,
  },
  {
    id: '2', 
    from: 'procurement@regional-medical.com',
    subject: 'RFP - Medical Imaging Equipment',
    preview: 'We are seeking proposals for upgrading our radiology department equipment...',
    date: '2024-01-27',
    isLead: true,
    leadScore: 92,
  },
  {
    id: '3',
    from: 'admin@citycare-clinic.net',
    subject: 'Budget Planning Meeting Follow-up',
    preview: 'Following our discussion about Q2 equipment purchases, I wanted to clarify...',
    date: '2024-01-26',
    isLead: true,
    leadScore: 78,
  },
  {
    id: '4',
    from: 'newsletter@medical-news.com',
    subject: 'Weekly Industry Updates',
    preview: 'This week in medical technology: new FDA approvals, industry trends...',
    date: '2024-01-26',
    isLead: false,
    leadScore: 0,
  },
]

const MOCK_CONTACTS = [
  {
    name: 'Dr. Sarah Johnson',
    title: 'Chief of Cardiology',
    organization: 'Mercy Hospital',
    email: 'dr.sarah.johnson@mercy-hospital.org',
    lastContact: '2024-01-28',
    status: 'Active Lead',
    notes: 'Interested in SurgicalPro X3. Demo scheduled for next week.',
  },
  {
    name: 'James Mitchell',
    title: 'Procurement Director',
    organization: 'Regional Medical Center',
    email: 'procurement@regional-medical.com',
    lastContact: '2024-01-27',
    status: 'New Lead',
    notes: 'Submitted RFP for imaging equipment. Budget ~$2M.',
  },
  {
    name: 'Lisa Chen',
    title: 'Practice Administrator',
    organization: 'CityCare Clinic Network',
    email: 'admin@citycare-clinic.net',
    lastContact: '2024-01-26',
    status: 'Nurturing',
    notes: 'Q2 budget discussions ongoing. Multiple clinic locations.',
  },
]

// Define tools for the agent
const tools = {
  scanInboxForLeads: tool({
    description: 'Scan the connected email inbox to identify potential sales leads from recent emails',
    inputSchema: z.object({
      timeframe: z.enum(['today', 'week', 'month']).describe('The timeframe to scan'),
    }),
    execute: async ({ timeframe }) => {
      // In production, this would connect to Gmail/Outlook API
      const leads = MOCK_EMAILS.filter(email => email.isLead)
      return {
        success: true,
        timeframe,
        totalEmails: MOCK_EMAILS.length,
        leadsFound: leads.length,
        leads: leads.map(lead => ({
          from: lead.from,
          subject: lead.subject,
          preview: lead.preview,
          leadScore: lead.leadScore,
          date: lead.date,
        })),
      }
    },
  }),

  getContactDetails: tool({
    description: 'Get detailed information about a specific contact or lead',
    inputSchema: z.object({
      email: z.string().describe('The email address of the contact'),
    }),
    execute: async ({ email }) => {
      const contact = MOCK_CONTACTS.find(c => 
        c.email.toLowerCase().includes(email.toLowerCase()) ||
        email.toLowerCase().includes(c.email.split('@')[0].toLowerCase())
      )
      
      if (contact) {
        return { success: true, contact }
      }
      return { success: false, message: 'Contact not found' }
    },
  }),

  draftEmail: tool({
    description: 'Draft a professional sales email for a prospect',
    inputSchema: z.object({
      recipientEmail: z.string().describe('The recipient email address'),
      recipientName: z.string().describe('The recipient name and title'),
      purpose: z.enum(['introduction', 'follow-up', 'demo-request', 'proposal', 'check-in']).describe('The purpose of the email'),
      context: z.string().describe('Additional context about the recipient or previous interactions'),
      productFocus: z.string().nullable().describe('Specific product or service to highlight'),
    }),
    execute: async ({ recipientEmail, recipientName, purpose, context, productFocus }) => {
      // In production, this would use the AI to generate personalized content
      // For now, return structured data that the LLM can use
      return {
        success: true,
        draft: {
          to: recipientEmail,
          recipient: recipientName,
          purpose,
          context,
          productFocus: productFocus || 'General medical equipment solutions',
          suggestedSubject: purpose === 'follow-up' 
            ? `Following up: ${productFocus || 'Our conversation'}`
            : purpose === 'demo-request'
            ? `Demo Request: ${productFocus || 'Medical Equipment'}`
            : `${productFocus || 'Medical Solutions'} for ${recipientName.split(' ').pop()}`,
          note: 'Draft generated. Please review and personalize before sending.',
        },
      }
    },
  }),

  getSalesActivity: tool({
    description: 'Get a summary of recent sales activity and pipeline status',
    inputSchema: z.object({
      period: z.enum(['daily', 'weekly', 'monthly']).describe('The reporting period'),
    }),
    execute: async ({ period }) => {
      return {
        success: true,
        period,
        summary: {
          newLeads: 3,
          activeDeals: 7,
          emailsSent: 24,
          emailsOpened: 18,
          meetingsScheduled: 4,
          proposalsSent: 2,
          dealsClosed: 1,
          pipelineValue: '$487,500',
        },
        topLeads: MOCK_CONTACTS.slice(0, 3).map(c => ({
          name: c.name,
          organization: c.organization,
          status: c.status,
        })),
      }
    },
  }),

  scheduleFollowUp: tool({
    description: 'Schedule a follow-up reminder for a lead',
    inputSchema: z.object({
      contactEmail: z.string().describe('The contact email address'),
      followUpDate: z.string().describe('The date for follow-up (YYYY-MM-DD format)'),
      notes: z.string().describe('Notes for the follow-up'),
    }),
    execute: async ({ contactEmail, followUpDate, notes }) => {
      return {
        success: true,
        reminder: {
          contact: contactEmail,
          date: followUpDate,
          notes,
          message: `Follow-up reminder set for ${followUpDate}`,
        },
      }
    },
  }),
}

export async function POST(req: Request) {
  const { messages, isEmailConnected }: { messages: UIMessage[]; isEmailConnected?: boolean } = await req.json()

  // Enhance system prompt based on email connection status
  const systemPrompt = isEmailConnected 
    ? SYSTEM_PROMPT 
    : SYSTEM_PROMPT + '\n\nNOTE: The user has not connected their email yet. Encourage them to connect their work email to unlock full functionality like lead detection and email analysis. You can still help with general sales advice, email drafting templates, and strategy discussions.'

  const result = streamText({
    model: 'google/gemini-2.5-flash',
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(10),
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse()
}
