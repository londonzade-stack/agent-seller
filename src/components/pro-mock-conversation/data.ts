export interface ProMockToolCall {
  name: string
  label: string
  inputSummary: string
  outputSummary: string
}

export interface ProMockApproval {
  action: string
  description: string
  details: string[]
  responded: 'approved' | 'denied'
}

export interface ProMockMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  toolCalls?: ProMockToolCall[]
  approval?: ProMockApproval
}

export interface ProMockConversationData {
  id: string
  title: string
  description: string
  messages: ProMockMessage[]
  promptText: string
}

export const PRO_MOCK_CONVERSATIONS: ProMockConversationData[] = [
  {
    id: 'find-companies',
    title: 'Find Companies',
    description: 'Search for target companies to sell to',
    promptText: 'Find SaaS companies in Austin that might need our analytics platform',
    messages: [
      {
        id: 'p1-m1',
        role: 'user',
        text: 'Find SaaS companies in Austin that might need our analytics platform',
      },
      {
        id: 'p1-m2',
        role: 'assistant',
        text: "I found **8 SaaS companies** in Austin that could be strong prospects for your analytics platform:\n\n| Company | Focus | Size | Why They Fit |\n|---------|-------|------|-------------|\n| DataStack | Data pipeline tools | ~120 employees | No built-in analytics layer |\n| CloudMetrics | Infrastructure monitoring | ~80 employees | Currently using legacy BI tools |\n| Revio | Revenue operations | ~200 employees | Recently raised Series B, scaling fast |\n| FormFlow | Form automation | ~50 employees | Blog mentions needing better insights |\n| ShipLane | Logistics SaaS | ~150 employees | Job posting for data engineer |\n\n+3 more results. Want me to deep-dive into any of these companies or start drafting outreach emails?",
        toolCalls: [
          {
            name: 'findCompanies',
            label: 'Finding companies',
            inputSummary: 'SaaS companies in Austin, TX',
            outputSummary: '8 companies found',
          },
          {
            name: 'webSearch',
            label: 'Searching the web',
            inputSummary: 'Austin SaaS companies analytics needs',
            outputSummary: '12 results found',
          },
        ],
      },
    ],
  },
  {
    id: 'company-research',
    title: 'Company Deep Dive',
    description: 'Research a prospect before outreach',
    promptText: 'Research Stripe — I want to pitch them our developer tools',
    messages: [
      {
        id: 'p2-m1',
        role: 'user',
        text: 'Research Stripe — I want to pitch them our developer tools',
      },
      {
        id: 'p2-m2',
        role: 'assistant',
        text: "Here's your full research brief on **Stripe**:\n\n**Company Overview:**\n- Global payments infrastructure for the internet\n- Founded 2010, HQ in San Francisco + Dublin\n- ~8,000 employees, valued at $50B+\n- Processes hundreds of billions in payments annually\n\n**Recent News & Signals:**\n- Launched Stripe Billing v3 with usage-based pricing support\n- Expanding embedded finance offerings for platforms\n- New developer experience team hiring 12+ roles\n- Published blog post about improving API latency by 40%\n\n**Key Decision Makers:**\n- David Singleton — CTO\n- Dev Ittycheria — Head of Developer Platform\n- Emily Zhang — VP of Engineering, Developer Experience\n\n**Pain Points & Opportunities:**\n- Actively investing in developer tooling (hiring signal)\n- Blog mentions challenges with internal observability\n- Could benefit from better developer analytics\n\nWant me to draft a personalized outreach email referencing these insights?",
        toolCalls: [
          {
            name: 'researchCompany',
            label: 'Researching company',
            inputSummary: 'Stripe (stripe.com)',
            outputSummary: 'Website, 8 articles, 4 overviews',
          },
          {
            name: 'webSearch',
            label: 'Searching the web',
            inputSummary: 'Stripe developer tools news 2026',
            outputSummary: '6 results found',
          },
          {
            name: 'webSearch',
            label: 'Searching the web',
            inputSummary: 'Stripe engineering leadership team',
            outputSummary: '4 results found',
          },
        ],
      },
    ],
  },
  {
    id: 'cold-outreach',
    title: 'Cold Outreach',
    description: 'Research and draft a personalized cold email',
    promptText: 'Research Notion and draft a cold email pitching our integration',
    messages: [
      {
        id: 'p3-m1',
        role: 'user',
        text: 'Research Notion and draft a cold email pitching our integration',
      },
      {
        id: 'p3-m2',
        role: 'assistant',
        text: "I've researched Notion and drafted a personalized cold email. Here's what I found and the draft I put together:\n\n**Research Highlights:**\n- Notion recently launched their API v2 with improved integrations\n- They're actively building an ecosystem of 3rd-party tools\n- Ivan Zhao (CEO) has publicly said they want to be \"the connected workspace\"\n- Currently 30M+ users, growing in enterprise segment\n\n**Draft ready for your review:**\n- To: partnerships@makenotion.com\n- Subject: Integration partnership — complementing Notion's connected workspace vision",
        toolCalls: [
          {
            name: 'researchCompany',
            label: 'Researching company',
            inputSummary: 'Notion (notion.so)',
            outputSummary: 'Website, 6 articles, 3 overviews',
          },
          {
            name: 'webSearch',
            label: 'Searching the web',
            inputSummary: 'Notion integrations partnerships 2026',
            outputSummary: '5 results found',
          },
          {
            name: 'draftEmail',
            label: 'Drafting email',
            inputSummary: 'Cold outreach to Notion partnerships',
            outputSummary: 'Draft created',
          },
        ],
        approval: {
          action: 'Send Email',
          description: 'Send personalized outreach email to partnerships@makenotion.com',
          details: ['References their API v2 launch', 'Highlights integration value prop', 'Proposes 15-min discovery call'],
          responded: 'approved',
        },
      },
      {
        id: 'p3-m3',
        role: 'assistant',
        text: "Email sent to **partnerships@makenotion.com**.\n\nThe email references their API v2 launch and connected workspace vision, positioning your tool as a natural complement. I kept it to 4 short paragraphs with a specific CTA for a 15-minute call.\n\nWant me to find more companies in the productivity tools space to reach out to?",
        toolCalls: [
          {
            name: 'sendEmail',
            label: 'Sending email',
            inputSummary: 'To: partnerships@makenotion.com',
            outputSummary: 'Email sent',
          },
        ],
      },
    ],
  },
  {
    id: 'smart-outreach',
    title: 'Smart Outreach',
    description: 'BLITZ asks questions before drafting',
    promptText: 'Contact hospital sales teams and try to sell our product, make drafts and let me review',
    messages: [
      {
        id: 'p9-m1',
        role: 'user',
        text: 'Contact hospital sales teams and try to sell our product, make drafts and let me review',
      },
      {
        id: 'p9-m2',
        role: 'assistant',
        text: "I'd love to help you reach out to hospital sales teams! Before I start researching and drafting, I need a few details so the emails land right:\n\n1. **What product are you selling?** (e.g., medical devices, SaaS platform, consulting services)\n2. **What's your target department?** (e.g., procurement, IT, radiology, administration)\n3. **Any specific region or hospital size?** (e.g., US-only, 200+ bed hospitals, academic medical centers)\n4. **What's your main value prop?** — the one-liner that hooks a buyer\n\nThe more context you give me, the more personalized and effective the outreach will be.",
      },
      {
        id: 'p9-m3',
        role: 'user',
        text: "We sell a patient monitoring SaaS platform that integrates with existing EHR systems. Target is IT directors and CTOs at mid-size hospitals (200-500 beds) in the Southeast US. Our main hook is we reduce nurse alert fatigue by 60% with smart alarm filtering.",
      },
      {
        id: 'p9-m4',
        role: 'assistant',
        text: "Great — that's a strong pitch. I found **6 mid-size hospitals** in the Southeast with active IT leadership and drafted personalized outreach for each:\n\n| Hospital | Location | Contact | Email Status |\n|----------|----------|---------|-------|\n| Piedmont Athens Regional | Athens, GA | CTO Mark Rivera | Draft ready |\n| Baptist Health Louisville | Louisville, KY | IT Director Sarah Chen | Draft ready |\n| Memorial Hospital Jacksonville | Jacksonville, FL | VP of IT James Okafor | Draft ready |\n| Carilion Roanoke Memorial | Roanoke, VA | CTO Lisa Pham | Draft ready |\n| Prisma Health Richland | Columbia, SC | IT Director David Kim | Draft ready |\n| Erlanger Medical Center | Chattanooga, TN | CTO Anita Brooks | Draft ready |\n\nEach email leads with the **60% alert fatigue reduction**, mentions their specific EHR system, and references recent news about their hospital. All 6 drafts are in your **Drafts** folder — review and send when ready.",
        toolCalls: [
          {
            name: 'findCompanies',
            label: 'Finding companies',
            inputSummary: 'Mid-size hospitals, Southeast US, 200-500 beds',
            outputSummary: '6 hospitals found',
          },
          {
            name: 'researchCompany',
            label: 'Researching company',
            inputSummary: '6 hospitals — IT leadership, EHR systems',
            outputSummary: '6 hospitals researched',
          },
          {
            name: 'webSearch',
            label: 'Searching the web',
            inputSummary: 'Hospital IT leadership Southeast US',
            outputSummary: '8 results found',
          },
          {
            name: 'draftEmail',
            label: 'Drafting email',
            inputSummary: '6 personalized outreach emails',
            outputSummary: '6 drafts created',
          },
        ],
      },
    ],
  },
  {
    id: 'batch-outreach',
    title: 'Batch Outreach',
    description: 'Find prospects and draft emails in bulk',
    promptText: 'Find 5 fintech startups and draft personalized outreach for each',
    messages: [
      {
        id: 'p4-m1',
        role: 'user',
        text: 'Find 5 fintech startups and draft personalized outreach for each',
      },
      {
        id: 'p4-m2',
        role: 'assistant',
        text: "I found 5 fintech startups and researched each one. Here's the full breakdown:\n\n| Company | What They Do | Key Signal | Email Status |\n|---------|-------------|------------|--------|\n| Ramp | Corporate card & spend mgmt | Just launched expense AI features | Draft ready |\n| Mercury | Banking for startups | Expanding to enterprise segment | Draft ready |\n| Brex | Financial OS for companies | Hiring 8 data engineers | Draft ready |\n| Plaid | Financial data infrastructure | New partnerships API launched | Draft ready |\n| Sardine | Fraud & compliance platform | Series B, scaling engineering | Draft ready |\n\nAll 5 drafts are personalized based on each company's recent news and hiring signals. Each email is in your **Drafts** folder — review and send when ready.\n\nWant me to schedule follow-ups for any that don't respond within 3 days?",
        toolCalls: [
          {
            name: 'findCompanies',
            label: 'Finding companies',
            inputSummary: 'Fintech startups, Series A-C',
            outputSummary: '5 companies found',
          },
          {
            name: 'researchCompany',
            label: 'Researching company',
            inputSummary: 'Ramp (ramp.com)',
            outputSummary: 'Website, 4 articles',
          },
          {
            name: 'researchCompany',
            label: 'Researching company',
            inputSummary: 'Mercury (mercury.com)',
            outputSummary: 'Website, 3 articles',
          },
          {
            name: 'researchCompany',
            label: 'Researching company',
            inputSummary: 'Brex (brex.com)',
            outputSummary: 'Website, 5 articles',
          },
          {
            name: 'researchCompany',
            label: 'Researching company',
            inputSummary: 'Plaid (plaid.com)',
            outputSummary: 'Website, 4 articles',
          },
          {
            name: 'researchCompany',
            label: 'Researching company',
            inputSummary: 'Sardine (sardine.ai)',
            outputSummary: 'Website, 3 articles',
          },
          {
            name: 'draftEmail',
            label: 'Drafting email',
            inputSummary: '5 personalized cold emails',
            outputSummary: '5 drafts created',
          },
        ],
      },
    ],
  },
  {
    id: 'follow-up-campaign',
    title: 'Follow-Up Campaign',
    description: 'Check responses and draft follow-ups',
    promptText: 'Check if any of my outreach emails got replies and draft follow-ups for those that didn\'t',
    messages: [
      {
        id: 'p5-m1',
        role: 'user',
        text: 'Check if any of my outreach emails got replies and draft follow-ups for those that didn\'t',
      },
      {
        id: 'p5-m2',
        role: 'assistant',
        text: "I checked all your recent outreach emails. Here's the status:\n\n**Got Replies (2):**\n- **Vercel** — Emily from partnerships responded, interested in a call next week\n- **Linear** — Auto-reply: out of office until Monday\n\n**No Response Yet (3):**\n- **Notion** — Sent 4 days ago, no reply\n- **Plaid** — Sent 3 days ago, no reply\n- **Ramp** — Sent 5 days ago, no reply\n\nI've drafted follow-up emails for the 3 that haven't responded. Each follow-up adds a new angle:\n- Notion: References their latest community update\n- Plaid: Mentions mutual connection found on LinkedIn\n- Ramp: Includes a relevant case study link\n\nAll 3 drafts are in your **Drafts** folder. Want me to send them now?",
        toolCalls: [
          {
            name: 'searchEmails',
            label: 'Searching emails',
            inputSummary: 'sent outreach emails, last 7 days',
            outputSummary: 'Found 5 sent emails',
          },
          {
            name: 'searchEmails',
            label: 'Searching emails',
            inputSummary: 'Replies to outreach threads',
            outputSummary: '2 replies found',
          },
          {
            name: 'webSearch',
            label: 'Searching the web',
            inputSummary: 'Notion community updates recent',
            outputSummary: '3 results found',
          },
          {
            name: 'draftEmail',
            label: 'Drafting email',
            inputSummary: 'Follow-up: Notion, Plaid, Ramp',
            outputSummary: '3 follow-up drafts created',
          },
        ],
        approval: {
          action: 'Send Emails',
          description: 'Send 3 follow-up emails to prospects who haven\'t replied',
          details: ['Notion — follow-up #1', 'Plaid — follow-up #1', 'Ramp — follow-up #1'],
          responded: 'approved',
        },
      },
      {
        id: 'p5-m3',
        role: 'assistant',
        text: "All 3 follow-up emails sent.\n\nI'll keep an eye on responses. Want me to set up an automation to check for replies daily and notify you in your Morning Briefing?",
        toolCalls: [
          {
            name: 'sendEmail',
            label: 'Sending email',
            inputSummary: 'Follow-up to Notion',
            outputSummary: 'Email sent',
          },
          {
            name: 'sendEmail',
            label: 'Sending email',
            inputSummary: 'Follow-up to Plaid',
            outputSummary: 'Email sent',
          },
          {
            name: 'sendEmail',
            label: 'Sending email',
            inputSummary: 'Follow-up to Ramp',
            outputSummary: 'Email sent',
          },
        ],
      },
    ],
  },
  {
    id: 'competitor-intel',
    title: 'Competitor Intel',
    description: 'Research competitors before a pitch',
    promptText: 'Research what HubSpot and Salesforce are doing in the AI space so I can position against them',
    messages: [
      {
        id: 'p6-m1',
        role: 'user',
        text: 'Research what HubSpot and Salesforce are doing in the AI space so I can position against them',
      },
      {
        id: 'p6-m2',
        role: 'assistant',
        text: "Here's your competitive intelligence brief:\n\n**HubSpot — AI Strategy:**\n- Launched \"Breeze\" AI across their CRM suite\n- AI-powered content generation for marketing emails\n- Predictive lead scoring in Sales Hub\n- Weakness: AI features are add-ons at higher tiers, not core\n\n**Salesforce — AI Strategy:**\n- Einstein GPT embedded across Sales Cloud\n- Autonomous AI agents for customer service (Agentforce)\n- Heavy enterprise focus, complex implementation\n- Weakness: Requires dedicated admin, 6+ month onboarding\n\n**Your Positioning Angles:**\n- Speed to value — works in minutes, not months\n- Email-native — lives where reps already work\n- Research-backed outreach — real web data, not templated\n- No CRM lock-in — complements existing tools\n\nWant me to draft a comparison one-pager you can attach to your outreach emails?",
        toolCalls: [
          {
            name: 'researchCompany',
            label: 'Researching company',
            inputSummary: 'HubSpot (hubspot.com)',
            outputSummary: 'Website, 6 articles, AI features',
          },
          {
            name: 'researchCompany',
            label: 'Researching company',
            inputSummary: 'Salesforce (salesforce.com)',
            outputSummary: 'Website, 8 articles, Einstein GPT',
          },
          {
            name: 'webSearch',
            label: 'Searching the web',
            inputSummary: 'HubSpot Breeze AI features 2026',
            outputSummary: '5 results found',
          },
          {
            name: 'webSearch',
            label: 'Searching the web',
            inputSummary: 'Salesforce Einstein Agentforce 2026',
            outputSummary: '7 results found',
          },
        ],
      },
    ],
  },
  {
    id: 'lead-qualification',
    title: 'Lead Qualification',
    description: 'Research inbound leads and prioritize',
    promptText: 'I got 4 demo requests today — research each company and tell me which ones to prioritize',
    messages: [
      {
        id: 'p7-m1',
        role: 'user',
        text: 'I got 4 demo requests today — research each company and tell me which ones to prioritize',
      },
      {
        id: 'p7-m2',
        role: 'assistant',
        text: "I've researched all 4 companies that requested demos. Here's my prioritization:\n\n**Priority: High**\n- **Acme Corp** — 500 employees, $40M revenue, actively looking for email tools (job posting for Sales Ops Manager mentions \"email automation\")\n- **TechFlow** — 200 employees, Series C funded ($30M), CTO tweeted about needing better outreach tools last week\n\n**Priority: Medium**\n- **GreenLeaf** — 80 employees, growing but early-stage. Good long-term prospect, budget may be limited\n\n**Priority: Low**\n- **QuickByte** — 15 employees, pre-seed. Likely exploring free options first\n\nI'd recommend scheduling Acme Corp and TechFlow this week — they have budget and active need. Want me to draft confirmation emails for each demo?",
        toolCalls: [
          {
            name: 'searchEmails',
            label: 'Searching emails',
            inputSummary: 'Demo requests, today',
            outputSummary: '4 demo requests found',
          },
          {
            name: 'researchCompany',
            label: 'Researching company',
            inputSummary: 'Acme Corp',
            outputSummary: 'Website, 3 articles, job postings',
          },
          {
            name: 'researchCompany',
            label: 'Researching company',
            inputSummary: 'TechFlow',
            outputSummary: 'Website, 4 articles, social media',
          },
          {
            name: 'researchCompany',
            label: 'Researching company',
            inputSummary: 'GreenLeaf',
            outputSummary: 'Website, 2 articles',
          },
          {
            name: 'researchCompany',
            label: 'Researching company',
            inputSummary: 'QuickByte',
            outputSummary: 'Website, 1 article',
          },
        ],
      },
    ],
  },
  {
    id: 'event-outreach',
    title: 'Event Outreach',
    description: 'Find attendees and draft pre-event emails',
    promptText: 'Find companies attending SaaStr Annual and draft outreach to set up meetings',
    messages: [
      {
        id: 'p8-m1',
        role: 'user',
        text: 'Find companies attending SaaStr Annual and draft outreach to set up meetings',
      },
      {
        id: 'p8-m2',
        role: 'assistant',
        text: "I found **12 companies** confirmed for SaaStr Annual that match your target profile. I've drafted pre-event outreach for the top 5:\n\n| Company | Booth/Talk | Contact | Email Status |\n|---------|-----------|---------|-------|\n| Gong | Keynote speaker | VP Sales | Draft ready |\n| Outreach.io | Booth #412 | Head of Partnerships | Draft ready |\n| Clari | Panel: Revenue Intelligence | Dir. of BD | Draft ready |\n| Chorus | Workshop host | CRO | Draft ready |\n| Salesloft | Booth #318 | VP Alliances | Draft ready |\n\nEach email mentions their specific involvement at SaaStr and proposes a 15-minute coffee meeting at the event. All drafts are in your **Drafts** folder.\n\nWant me to draft the remaining 7 or send these first?",
        toolCalls: [
          {
            name: 'webSearch',
            label: 'Searching the web',
            inputSummary: 'SaaStr Annual 2026 sponsors attendees',
            outputSummary: '8 results found',
          },
          {
            name: 'findCompanies',
            label: 'Finding companies',
            inputSummary: 'SaaStr Annual exhibitors & speakers',
            outputSummary: '12 companies found',
          },
          {
            name: 'researchCompany',
            label: 'Researching company',
            inputSummary: 'Gong, Outreach, Clari, Chorus, Salesloft',
            outputSummary: '5 companies researched',
          },
          {
            name: 'draftEmail',
            label: 'Drafting email',
            inputSummary: '5 pre-event outreach emails',
            outputSummary: '5 drafts created',
          },
        ],
      },
    ],
  },
]
