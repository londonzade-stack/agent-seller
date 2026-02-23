export interface MockToolCall {
  name: string
  label: string
  inputSummary: string
  outputSummary: string
}

export interface MockApproval {
  action: string
  description: string
  details: string[]
  responded: 'approved' | 'denied'
}

export interface MockMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  toolCalls?: MockToolCall[]
  approval?: MockApproval
  embed?: 'automations-panel'
}

export interface MockConversationData {
  id: string
  title: string
  description: string
  messages: MockMessage[]
  promptText: string
}

export const MOCK_CONVERSATIONS: MockConversationData[] = [
  {
    id: 'inbox-cleanup',
    title: 'Inbox Cleanup',
    description: 'Archive old promos in one shot',
    promptText: 'Archive all promotional emails older than 30 days',
    messages: [
      {
        id: 'c1-m1',
        role: 'user',
        text: 'Archive all promotional emails older than 30 days',
      },
      {
        id: 'c1-m2',
        role: 'assistant',
        text: 'Done! I archived **47 promotional emails** that were older than 30 days.\n\nYour inbox is a lot cleaner now. Want me to do the same for newsletters?',
        toolCalls: [
          {
            name: 'searchEmails',
            label: 'Searching emails',
            inputSummary: 'category:promotions older_than:30d',
            outputSummary: 'Found 47 emails',
          },
          {
            name: 'archiveEmails',
            label: 'Archiving emails',
            inputSummary: '47 emails',
            outputSummary: 'All archived',
          },
        ],
      },
    ],
  },
  {
    id: 'draft-followup',
    title: 'Draft Follow-Up',
    description: 'Context-aware reply to a client',
    promptText: 'Draft a follow-up to the Q3 proposal thread from Acme Corp',
    messages: [
      {
        id: 'c2-m1',
        role: 'user',
        text: 'Draft a follow-up to the Q3 proposal thread from Acme Corp',
      },
      {
        id: 'c2-m2',
        role: 'assistant',
        text: "I've drafted a follow-up for the Q3 proposal thread. The draft references Alex's last message about the March deadline and suggests a quick sync call.\n\n**Draft ready in your Drafts folder:**\n- To: Alex Chen <alex.chen@acme-corp.com>\n- Subject: Re: Q3 Proposal Follow-Up\n\nWant me to adjust the tone or add anything before you send it?",
        toolCalls: [
          {
            name: 'searchEmails',
            label: 'Searching emails',
            inputSummary: 'from:acme subject:Q3 proposal',
            outputSummary: 'Found 1 thread',
          },
          {
            name: 'getEmailThread',
            label: 'Reading thread',
            inputSummary: 'Q3 Proposal — Acme Corp',
            outputSummary: 'Loaded 3 messages',
          },
          {
            name: 'draftEmail',
            label: 'Drafting email',
            inputSummary: 'To: Alex Chen — Re: Q3 Proposal',
            outputSummary: 'Draft created',
          },
        ],
      },
    ],
  },
  {
    id: 'inbox-analytics',
    title: 'Inbox Analytics',
    description: 'Top senders and volume breakdown',
    promptText: 'Give me a breakdown of my inbox activity this week',
    messages: [
      {
        id: 'c3-m1',
        role: 'user',
        text: 'Give me a breakdown of my inbox activity this week',
      },
      {
        id: 'c3-m2',
        role: 'assistant',
        text: "Here's your inbox activity for this week:\n\n**Total emails received:** 84 — **Unread:** 23\n\n| Sender | Emails | Category |\n|--------|--------|----------|\n| GitHub | 18 | Notifications |\n| Slack | 14 | Internal |\n| Acme Corp | 9 | Client |\n| Stripe | 6 | Billing |\n| LinkedIn | 5 | Networking |\n\nYour busiest day was Tuesday with 31 emails. Want me to auto-archive the GitHub notifications?",
        toolCalls: [
          {
            name: 'getInboxStats',
            label: 'Analyzing inbox',
            inputSummary: 'this week',
            outputSummary: '84 emails analyzed',
          },
        ],
      },
    ],
  },
  {
    id: 'receipts-folder',
    title: 'Receipts Folder',
    description: 'Auto-sort receipts into a new label',
    promptText: 'Find all emails with receipt attachments and create a Receipts folder',
    messages: [
      {
        id: 'c4-m1',
        role: 'user',
        text: 'Find all emails with receipt attachments and create a Receipts folder',
      },
      {
        id: 'c4-m2',
        role: 'assistant',
        text: "All done! Here's what I did:\n\n- Created a new **Receipts** label\n- Found **31 emails** matching receipts, invoices, and order confirmations\n- Moved all 31 into the Receipts folder\n\nYou can find them in Gmail under **Labels > Receipts**. Want me to set this up to run automatically every week?",
        toolCalls: [
          {
            name: 'createLabel',
            label: 'Creating label',
            inputSummary: 'Receipts',
            outputSummary: 'Label created',
          },
          {
            name: 'searchEmails',
            label: 'Searching emails',
            inputSummary: 'has:attachment receipt OR invoice',
            outputSummary: '31 emails found',
          },
          {
            name: 'applyLabels',
            label: 'Applying labels',
            inputSummary: '31 emails → Receipts',
            outputSummary: 'Labels applied',
          },
        ],
      },
    ],
  },
  {
    id: 'unsubscribe-sweep',
    title: 'Unsubscribe Sweep',
    description: 'Bulk unsubscribe with approval',
    promptText: 'Unsubscribe me from all newsletters in my inbox',
    messages: [
      {
        id: 'c5-m1',
        role: 'user',
        text: 'Unsubscribe me from all newsletters in my inbox',
      },
      {
        id: 'c5-m2',
        role: 'assistant',
        text: 'I found **14 senders** with unsubscribe options. I need your approval to unsubscribe from all of them.',
        toolCalls: [
          {
            name: 'findUnsubscribableEmails',
            label: 'Scanning inbox',
            inputSummary: 'Finding newsletters',
            outputSummary: 'Found 14 senders',
          },
        ],
        approval: {
          action: 'Bulk Unsubscribe',
          description: 'Unsubscribe from 14 newsletter senders found in your inbox.',
          details: ['Morning Brew', 'Product Hunt Daily', 'LinkedIn Job Alerts', 'HubSpot Blog', '+10 more'],
          responded: 'approved',
        },
      },
      {
        id: 'c5-m3',
        role: 'assistant',
        text: "Done! Unsubscribed from **13 out of 14** senders.\n\nMorning Brew didn't support one-click unsubscribe — I've included their unsubscribe link in case you want to do it manually.",
        toolCalls: [
          {
            name: 'bulkUnsubscribe',
            label: 'Unsubscribing',
            inputSummary: '14 senders',
            outputSummary: '13 succeeded, 1 failed',
          },
        ],
      },
    ],
  },
  {
    id: 'delete-old-emails',
    title: 'Delete Old Emails',
    description: 'Trash emails with approval flow',
    promptText: 'Delete all emails from LinkedIn older than 60 days',
    messages: [
      {
        id: 'c6-m1',
        role: 'user',
        text: 'Delete all emails from LinkedIn older than 60 days',
      },
      {
        id: 'c6-m2',
        role: 'assistant',
        text: 'I found **23 emails** from LinkedIn that are older than 60 days. Since this is a destructive action, I need your approval before moving them to trash.',
        toolCalls: [
          {
            name: 'searchEmails',
            label: 'Searching emails',
            inputSummary: 'from:linkedin older_than:60d',
            outputSummary: 'Found 23 emails',
          },
        ],
        approval: {
          action: 'Trash Emails',
          description: 'Move 23 emails from LinkedIn (older than 60 days) to trash.',
          details: ['Job alerts (12)', 'Connection requests (6)', 'Notifications (5)'],
          responded: 'approved',
        },
      },
      {
        id: 'c6-m3',
        role: 'assistant',
        text: "Done! Moved **23 LinkedIn emails** to trash.\n\nThey'll stay in your trash for 30 days before being permanently deleted. You can recover them anytime before then.",
        toolCalls: [
          {
            name: 'trashEmails',
            label: 'Trashing emails',
            inputSummary: '23 emails',
            outputSummary: 'All moved to trash',
          },
        ],
      },
    ],
  },
  {
    id: 'send-email',
    title: 'Send Email',
    description: 'Draft, review, and send an email',
    promptText: 'Send an email to Sarah about the team meeting on Friday',
    messages: [
      {
        id: 'c7-m1',
        role: 'user',
        text: 'Send an email to Sarah about the team meeting on Friday',
      },
      {
        id: 'c7-m2',
        role: 'assistant',
        text: "I've drafted an email to Sarah about Friday's meeting. Please review before I send it.",
        toolCalls: [
          {
            name: 'searchEmails',
            label: 'Searching emails',
            inputSummary: 'from:sarah recent threads',
            outputSummary: 'Found contact: sarah@company.com',
          },
          {
            name: 'draftEmail',
            label: 'Drafting email',
            inputSummary: 'To: Sarah — Team Meeting Friday',
            outputSummary: 'Draft created',
          },
        ],
        approval: {
          action: 'Send Email',
          description: 'Send email to sarah@company.com — "Team Meeting This Friday at 2 PM"',
          details: ['To: sarah@company.com', 'Subject: Team Meeting This Friday', 'Includes agenda + Zoom link'],
          responded: 'approved',
        },
      },
      {
        id: 'c7-m3',
        role: 'assistant',
        text: "Email sent to **sarah@company.com**.\n\nSubject: Team Meeting This Friday at 2 PM\n\nI included the agenda items from your last meeting notes and the Zoom link. Sarah should have it in her inbox now.",
        toolCalls: [
          {
            name: 'sendEmail',
            label: 'Sending email',
            inputSummary: 'To: sarah@company.com',
            outputSummary: 'Email sent',
          },
        ],
      },
    ],
  },
  {
    id: 'setup-automation',
    title: 'Set Up Automation',
    description: 'Schedule recurring email tasks',
    promptText: 'Set up automations: archive promos weekly, inbox stats daily, and unsubscribe sweep monthly',
    messages: [
      {
        id: 'c8-m1',
        role: 'user',
        text: 'Set up three automations: archive old promotional emails every Sunday at 9 AM, give me inbox stats every morning at 8 AM, and run an unsubscribe sweep on the 1st of every month',
      },
      {
        id: 'c8-m2',
        role: 'assistant',
        text: "I've created all three automations for you. You'll see results in your **Morning Briefing** each day. Manage them from the **Automations** tab:",
        toolCalls: [
          {
            name: 'createRecurringTask',
            label: 'Creating automation',
            inputSummary: 'Archive promos — Weekly, Sundays 9 AM',
            outputSummary: 'Automation created',
          },
          {
            name: 'createRecurringTask',
            label: 'Creating automation',
            inputSummary: 'Inbox stats — Daily at 8 AM',
            outputSummary: 'Automation created',
          },
          {
            name: 'createRecurringTask',
            label: 'Creating automation',
            inputSummary: 'Unsubscribe sweep — Monthly, 1st at 9 AM',
            outputSummary: 'Automation created',
          },
        ],
        embed: 'automations-panel',
      },
    ],
  },
  {
    id: 'morning-briefing',
    title: 'Morning Briefing',
    description: 'See what the Agent did overnight',
    promptText: 'What did you do overnight?',
    messages: [
      {
        id: 'c9-m1',
        role: 'user',
        text: 'What did you do overnight?',
      },
      {
        id: 'c9-m2',
        role: 'assistant',
        text: "Good morning! Here's what I handled while you were away:\n\n**Automations completed:**\n- Archived **23 old promotional emails** (weekly cleanup)\n- Inbox stats: **84 emails** this week, **12 unread**, top sender is GitHub (18 emails)\n- Unsubscribe sweep found **3 new newsletters** — auto-unsubscribed from all\n\n**Your inbox right now:**\n- 12 unread emails\n- 3 flagged as important\n- 1 email from your client Acme Corp needs a reply\n\nWant me to draft a reply to the Acme Corp email?",
        toolCalls: [
          {
            name: 'getInboxStats',
            label: 'Analyzing inbox',
            inputSummary: 'Current inbox overview',
            outputSummary: '12 unread, 84 this week',
          },
          {
            name: 'getRecentEmails',
            label: 'Getting recent emails',
            inputSummary: 'Unread + important',
            outputSummary: '3 important emails',
          },
        ],
      },
    ],
  },
  {
    id: 'sales-outreach',
    title: 'Sales Outreach',
    description: 'Research a company and draft a cold email',
    promptText: 'Research Vercel and draft a cold outreach email to their team',
    messages: [
      {
        id: 'c10-m1',
        role: 'user',
        text: 'Research Vercel and draft a cold outreach email to their team',
      },
      {
        id: 'c10-m2',
        role: 'assistant',
        text: "Here's what I found about **Vercel**:\n\n**Company Overview:**\n- Frontend cloud platform for building and deploying web applications\n- Known for Next.js, the React framework they created\n- Raised $250M Series D, valued at $2.5B\n- HQ in San Francisco, ~500 employees\n\n**Recent News:**\n- Launched AI SDK for building AI-powered applications\n- New partnerships with major enterprise clients\n- Growing focus on edge computing and serverless infrastructure\n\nI've drafted a personalized cold email based on this research. Review it below:",
        toolCalls: [
          {
            name: 'researchCompany',
            label: 'Researching company',
            inputSummary: 'Vercel (vercel.com)',
            outputSummary: 'Website, 5 news articles, 3 overviews',
          },
          {
            name: 'webSearch',
            label: 'Searching the web',
            inputSummary: 'Vercel recent news 2026',
            outputSummary: '5 results found',
          },
          {
            name: 'draftEmail',
            label: 'Drafting email',
            inputSummary: 'Cold outreach to Vercel team',
            outputSummary: 'Draft created',
          },
        ],
        approval: {
          action: 'Send Email',
          description: 'Send personalized outreach email to partnerships@vercel.com',
          details: ['References their AI SDK launch', 'Proposes integration partnership', 'Includes specific value proposition'],
          responded: 'approved',
        },
      },
      {
        id: 'c10-m3',
        role: 'assistant',
        text: "Email sent to **partnerships@vercel.com**.\n\nThe email references their AI SDK launch and proposes how our platform could complement their developer tooling. I kept it concise — 4 paragraphs with a specific ask for a 15-minute call.\n\nWant me to research more companies in the developer tools space?",
        toolCalls: [
          {
            name: 'sendEmail',
            label: 'Sending email',
            inputSummary: 'To: partnerships@vercel.com',
            outputSummary: 'Email sent',
          },
        ],
      },
    ],
  },
]
