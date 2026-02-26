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
    id: 'find-prospects',
    title: 'Find Prospects',
    description: 'Search for companies to sell to',
    promptText: 'Find companies in my target market that could use our product',
    messages: [
      {
        id: 'p1-m1',
        role: 'user',
        text: 'Find companies in my target market that could use our product',
      },
      {
        id: 'p1-m2',
        role: 'assistant',
        text: "Based on your company profile, I searched for prospects that match your ideal customer. Here are **8 strong matches**:\n\n| Company | Industry | Size | Why They Fit |\n|---------|----------|------|-------------|\n| Meridian Health Systems | Healthcare | ~200 employees | Actively hiring for ops roles — scaling fast |\n| Vantage Financial | Fintech | ~120 employees | Blog mentions switching from legacy tools |\n| NovaTech Solutions | Enterprise SaaS | ~300 employees | Just raised Series B, expanding sales team |\n| Pinecrest Logistics | Supply chain | ~80 employees | Job posting mentions needing better tooling |\n| Atlas Group | Professional services | ~150 employees | Recent press about digital transformation |\n\n+3 more results. Want me to deep-dive into any of these or start drafting outreach?",
        toolCalls: [
          {
            name: 'findCompanies',
            label: 'Finding companies',
            inputSummary: 'Companies matching target market profile',
            outputSummary: '8 companies found',
          },
          {
            name: 'webSearch',
            label: 'Searching the web',
            inputSummary: 'Company hiring signals and recent news',
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
    promptText: 'Research Shopify — I want to see if they\'d be a good prospect',
    messages: [
      {
        id: 'p2-m1',
        role: 'user',
        text: "Research Shopify — I want to see if they'd be a good prospect",
      },
      {
        id: 'p2-m2',
        role: 'assistant',
        text: "Here's your research brief on **Shopify**:\n\n**Company Overview:**\n- E-commerce platform powering millions of businesses\n- Founded 2006, HQ in Ottawa, Canada\n- ~12,000 employees, publicly traded (NYSE: SHOP)\n- Revenue $7B+, focused on merchants and enterprise\n\n**Recent News & Signals:**\n- Launched Shopify Magic (AI-powered tools for merchants)\n- Expanding B2B wholesale features for enterprise sellers\n- New developer platform with improved APIs\n- CEO posted about operational efficiency as top priority\n\n**Key Decision Makers:**\n- Kaz Nejatian — COO & VP Product\n- Glen Worthington — VP Sales & Revenue\n- Farhan Thawar — VP Engineering\n\n**Opportunities:**\n- Heavy investment in developer tooling (hiring signal)\n- Public focus on merchant efficiency and automation\n- Growing enterprise segment could need your solution\n\nWant me to draft a personalized outreach email using these insights?",
        toolCalls: [
          {
            name: 'researchCompany',
            label: 'Researching company',
            inputSummary: 'Shopify (shopify.com)',
            outputSummary: 'Website, 8 articles, 4 overviews',
          },
          {
            name: 'webSearch',
            label: 'Searching the web',
            inputSummary: 'Shopify recent news and leadership',
            outputSummary: '6 results found',
          },
          {
            name: 'webSearch',
            label: 'Searching the web',
            inputSummary: 'Shopify leadership team 2026',
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
    promptText: 'Research HubSpot and draft a cold email to their partnerships team',
    messages: [
      {
        id: 'p3-m1',
        role: 'user',
        text: 'Research HubSpot and draft a cold email to their partnerships team',
      },
      {
        id: 'p3-m2',
        role: 'assistant',
        text: "I've researched HubSpot and drafted a personalized cold email:\n\n**Research Highlights:**\n- HubSpot recently launched their AI assistant \"Breeze\" across their CRM suite\n- Active partner ecosystem with 1,500+ integrations in their marketplace\n- Yamini Rangan (CEO) has publicly focused on growing the partner ecosystem\n- App marketplace seeing 40% YoY growth in installations\n\n**Draft ready for your review:**\n- To: partnerships@hubspot.com\n- Subject: Quick idea for your growing partner ecosystem",
        toolCalls: [
          {
            name: 'researchCompany',
            label: 'Researching company',
            inputSummary: 'HubSpot (hubspot.com)',
            outputSummary: 'Website, 6 articles, 3 overviews',
          },
          {
            name: 'webSearch',
            label: 'Searching the web',
            inputSummary: 'HubSpot partnerships ecosystem 2026',
            outputSummary: '5 results found',
          },
          {
            name: 'draftEmail',
            label: 'Drafting email',
            inputSummary: 'Cold outreach to HubSpot partnerships',
            outputSummary: 'Draft created',
          },
        ],
        approval: {
          action: 'Send Email',
          description: 'Send personalized outreach email to partnerships@hubspot.com',
          details: ['References their Breeze AI launch', 'Highlights ecosystem fit', 'Proposes 15-min intro call'],
          responded: 'approved',
        },
      },
      {
        id: 'p3-m3',
        role: 'assistant',
        text: "Email sent to **partnerships@hubspot.com**.\n\nThe email leads with their partner ecosystem growth and Breeze AI launch, positioning your product as a natural fit. I kept it to 4 short paragraphs with a CTA for a 15-minute call.\n\nWant me to find more companies like HubSpot to reach out to?",
        toolCalls: [
          {
            name: 'sendEmail',
            label: 'Sending email',
            inputSummary: 'To: partnerships@hubspot.com',
            outputSummary: 'Email sent',
          },
        ],
      },
    ],
  },
  {
    id: 'batch-outreach',
    title: 'Batch Outreach',
    description: 'Find prospects and draft emails in bulk',
    promptText: 'Find 5 companies in our space and draft personalized outreach for each',
    messages: [
      {
        id: 'p4-m1',
        role: 'user',
        text: 'Find 5 companies in our space and draft personalized outreach for each',
      },
      {
        id: 'p4-m2',
        role: 'assistant',
        text: "I found 5 companies that match your target profile and researched each one:\n\n| Company | What They Do | Key Signal | Email Status |\n|---------|-------------|------------|--------|\n| Ramp | Corporate card & spend mgmt | Just launched AI expense features | Draft ready |\n| Mercury | Banking for startups | Expanding to enterprise segment | Draft ready |\n| Brex | Financial OS for companies | Hiring 8 data engineers | Draft ready |\n| Plaid | Financial data infrastructure | New partnerships API launched | Draft ready |\n| Sardine | Fraud & compliance platform | Series B, scaling fast | Draft ready |\n\nEach email is personalized based on their recent news and hiring activity. All 5 drafts are in your **Drafts** folder — review and send when ready.\n\nWant me to schedule follow-ups for any that don't respond within 3 days?",
        toolCalls: [
          {
            name: 'findCompanies',
            label: 'Finding companies',
            inputSummary: 'Companies matching target profile',
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
        text: "I checked all your recent outreach emails. Here's the status:\n\n**Got Replies (2):**\n- **Vercel** — Emily from partnerships responded, interested in a call next week\n- **Linear** — Auto-reply: out of office until Monday\n\n**No Response Yet (3):**\n- **HubSpot** — Sent 4 days ago, no reply\n- **Plaid** — Sent 3 days ago, no reply\n- **Ramp** — Sent 5 days ago, no reply\n\nI've drafted follow-up emails for the 3 that haven't responded. Each follow-up adds a new angle:\n- HubSpot: References their latest partner summit announcement\n- Plaid: Mentions a relevant case study\n- Ramp: Ties into their recent product launch\n\nAll 3 drafts are in your **Drafts** folder. Want me to send them now?",
        toolCalls: [
          {
            name: 'searchEmails',
            label: 'Searching emails',
            inputSummary: 'Sent outreach emails, last 7 days',
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
            inputSummary: 'HubSpot partner summit recent news',
            outputSummary: '3 results found',
          },
          {
            name: 'draftEmail',
            label: 'Drafting email',
            inputSummary: 'Follow-up: HubSpot, Plaid, Ramp',
            outputSummary: '3 follow-up drafts created',
          },
        ],
        approval: {
          action: 'Send Emails',
          description: 'Send 3 follow-up emails to prospects who haven\'t replied',
          details: ['HubSpot — follow-up #1', 'Plaid — follow-up #1', 'Ramp — follow-up #1'],
          responded: 'approved',
        },
      },
      {
        id: 'p5-m3',
        role: 'assistant',
        text: "All 3 follow-up emails sent.\n\nI'll keep an eye on responses. Want me to set up an automation to check for replies daily and notify you?",
        toolCalls: [
          {
            name: 'sendEmail',
            label: 'Sending email',
            inputSummary: 'Follow-up to HubSpot',
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
    promptText: 'Research our top competitors and help me position against them',
    messages: [
      {
        id: 'p6-m1',
        role: 'user',
        text: 'Research our top competitors and help me position against them',
      },
      {
        id: 'p6-m2',
        role: 'assistant',
        text: "Here's your competitive intelligence brief:\n\n**Competitor A — HubSpot:**\n- Launched \"Breeze\" AI across their CRM suite\n- AI-powered content generation for marketing emails\n- Predictive lead scoring in Sales Hub\n- Weakness: AI features are add-ons at higher tiers, not core\n\n**Competitor B — Salesforce:**\n- Einstein GPT embedded across Sales Cloud\n- Autonomous AI agents for customer service (Agentforce)\n- Heavy enterprise focus, complex implementation\n- Weakness: Requires dedicated admin, 6+ month onboarding\n\n**Your Positioning Angles:**\n- Speed to value — works in minutes, not months\n- Email-native — lives where reps already work\n- Research-backed outreach — real web data, not templated\n- No CRM lock-in — complements existing tools\n\nWant me to draft a comparison one-pager you can use in outreach?",
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
    promptText: 'I got demo requests today — research each company and tell me which ones to prioritize',
    messages: [
      {
        id: 'p7-m1',
        role: 'user',
        text: 'I got demo requests today — research each company and tell me which ones to prioritize',
      },
      {
        id: 'p7-m2',
        role: 'assistant',
        text: "I found 4 demo requests in your inbox and researched each company:\n\n**Priority: High**\n- **Acme Corp** — 500 employees, $40M revenue, actively looking for email tools (job posting for Sales Ops Manager mentions \"email automation\")\n- **TechFlow** — 200 employees, Series C funded ($30M), CTO tweeted about needing better outreach tools last week\n\n**Priority: Medium**\n- **GreenLeaf** — 80 employees, growing but early-stage. Good long-term prospect, budget may be limited\n\n**Priority: Low**\n- **QuickByte** — 15 employees, pre-seed. Likely exploring free options first\n\nI'd recommend scheduling Acme Corp and TechFlow this week — they have budget and active need. Want me to draft confirmation emails for each demo?",
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
  {
    id: 'smart-outreach',
    title: 'Smart Outreach',
    description: 'Agent asks questions when it needs context',
    promptText: 'Reach out to companies in the healthcare space and sell our product',
    messages: [
      {
        id: 'p9-m1',
        role: 'user',
        text: 'Reach out to companies in the healthcare space and sell our product',
      },
      {
        id: 'p9-m2',
        role: 'assistant',
        text: "I'd love to help you reach out to healthcare companies! Before I start researching and drafting, a quick question so the emails land right:\n\n**What's your main value prop?** — the one-liner that hooks a buyer. For example: \"We cut patient wait times by 40%\" or \"Our platform saves billing teams 10 hours a week.\"\n\nThe more context you give me, the more personalized and effective the outreach will be.",
      },
      {
        id: 'p9-m3',
        role: 'user',
        text: "We sell a patient monitoring platform that integrates with existing EHR systems. Our main hook is we reduce nurse alert fatigue by 60% with smart alarm filtering. Target IT directors at mid-size hospitals.",
      },
      {
        id: 'p9-m4',
        role: 'assistant',
        text: "Great — that's a strong pitch. I found **6 mid-size hospitals** with active IT leadership and drafted personalized outreach for each:\n\n| Hospital | Location | Contact | Email Status |\n|----------|----------|---------|-------|\n| Piedmont Athens Regional | Athens, GA | CTO Mark Rivera | Draft ready |\n| Baptist Health Louisville | Louisville, KY | IT Director Sarah Chen | Draft ready |\n| Memorial Hospital Jacksonville | Jacksonville, FL | VP of IT James Okafor | Draft ready |\n| Carilion Roanoke Memorial | Roanoke, VA | CTO Lisa Pham | Draft ready |\n| Prisma Health Richland | Columbia, SC | IT Director David Kim | Draft ready |\n| Erlanger Medical Center | Chattanooga, TN | CTO Anita Brooks | Draft ready |\n\nEach email leads with the **60% alert fatigue reduction**, mentions their specific EHR system, and references recent news about their hospital. All 6 drafts are in your **Drafts** folder — review and send when ready.",
        toolCalls: [
          {
            name: 'findCompanies',
            label: 'Finding companies',
            inputSummary: 'Mid-size hospitals with IT leadership',
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
            inputSummary: 'Hospital IT leadership and EHR systems',
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
    id: 'outreach-automation',
    title: 'Outreach Automation',
    description: 'Set up recurring outreach tasks',
    promptText: 'Every Monday, find 5 new companies in my target market and draft cold emails for each',
    messages: [
      {
        id: 'p10-m1',
        role: 'user',
        text: 'Every Monday, find 5 new companies in my target market and draft cold emails for each',
      },
      {
        id: 'p10-m2',
        role: 'assistant',
        text: "I've set up a **weekly automation** that runs every Monday morning:\n\n**Recurring Task: Weekly Prospect Outreach**\n- Searches for 5 new companies matching your target market\n- Researches each company for recent news and key contacts\n- Drafts personalized cold emails referencing your product\n- Saves all drafts to your **Drafts** folder for review\n\nYou'll see the results in your Monday Morning Briefing each week. The first run is scheduled for next Monday at 9:00 AM.\n\nWant me to also set up a follow-up automation that checks for replies every Wednesday?",
        toolCalls: [
          {
            name: 'createRecurringTask',
            label: 'Creating automation',
            inputSummary: 'Weekly: find prospects + draft outreach',
            outputSummary: 'Automation created — runs every Monday',
          },
        ],
      },
    ],
  },
]
