/**
 * Exa.ai Web Search Service
 * Provides web search, company research, and contact finding capabilities.
 * Used by Pro plan agent tools and the outreach dashboard.
 */

const EXA_API_URL = 'https://api.exa.ai'

function getApiKey(): string {
  const key = process.env.EXA_API_KEY
  if (!key) {
    throw new Error('EXA_API_KEY environment variable is not set')
  }
  return key
}

export interface ExaSearchResult {
  id: string
  title: string
  url: string
  publishedDate?: string
  author?: string
  text?: string
  highlights?: string[]
  highlightScores?: number[]
  summary?: string
}

export interface ExaSearchResponse {
  requestId: string
  results: ExaSearchResult[]
}

/**
 * General web search via Exa.ai
 */
export async function searchWeb(
  query: string,
  options: {
    numResults?: number
    type?: 'instant' | 'neural' | 'auto' | 'keyword'
    includeDomains?: string[]
    excludeDomains?: string[]
    startPublishedDate?: string
    category?: 'company' | 'research paper' | 'news' | 'tweet' | 'personal site' | 'financial report' | 'people'
    includeText?: boolean
    includeSummary?: boolean
  } = {}
): Promise<ExaSearchResponse> {
  const {
    numResults = 10,
    type = 'instant',
    includeDomains,
    excludeDomains,
    startPublishedDate,
    category,
    includeText = true,
    includeSummary = false,
  } = options

  const body: Record<string, unknown> = {
    query,
    numResults,
    type,
    contents: {
      text: includeText ? { maxCharacters: 2000 } : false,
      ...(includeSummary ? { summary: true } : {}),
    },
  }

  if (includeDomains?.length) body.includeDomains = includeDomains
  if (excludeDomains?.length) body.excludeDomains = excludeDomains
  if (startPublishedDate) body.startPublishedDate = startPublishedDate
  if (category) body.category = category

  const res = await fetch(`${EXA_API_URL}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getApiKey(),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Exa search failed: ${res.status} ${err}`)
  }

  return res.json()
}

/**
 * Find companies matching criteria (industry, location, etc.)
 * Uses Exa's company category filter for better results.
 */
export async function findCompanies(
  query: string,
  options: {
    numResults?: number
    industry?: string
    location?: string
  } = {}
): Promise<ExaSearchResponse> {
  const { numResults = 10, industry, location } = options

  // Build a rich search query
  let searchQuery = query
  if (industry) searchQuery += ` ${industry}`
  if (location) searchQuery += ` ${location}`

  return searchWeb(searchQuery, {
    numResults,
    category: 'company',
    includeText: true,
    includeSummary: true,
  })
}

/**
 * Deep research on a specific company.
 * Searches for the company website, recent news, and key info.
 */
export async function researchCompany(
  companyName: string,
  options: {
    domain?: string
  } = {}
): Promise<{
  website: ExaSearchResult | null
  news: ExaSearchResult[]
  overview: ExaSearchResult[]
}> {
  const { domain } = options

  // Run multiple searches in parallel for comprehensive research
  const [websiteResults, newsResults, overviewResults] = await Promise.all([
    // Find the company website
    searchWeb(`${companyName} official website`, {
      numResults: 3,
      category: 'company',
      includeText: true,
      ...(domain ? { includeDomains: [domain] } : {}),
    }),
    // Find recent news
    searchWeb(`${companyName} news announcements`, {
      numResults: 5,
      category: 'news',
      includeText: true,
      startPublishedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // last 90 days
    }),
    // General overview / about
    searchWeb(`${companyName} about company overview leadership team`, {
      numResults: 5,
      includeText: true,
      includeSummary: true,
    }),
  ])

  return {
    website: websiteResults.results[0] || null,
    news: newsResults.results,
    overview: overviewResults.results,
  }
}

/**
 * Find potential contact emails for a company domain.
 * Searches for email patterns, team pages, contact pages.
 */
export async function findContactInfo(
  companyName: string,
  domain?: string
): Promise<ExaSearchResponse> {
  const query = domain
    ? `${companyName} contact email team leadership "${domain}"`
    : `${companyName} contact email team leadership decision makers`

  return searchWeb(query, {
    numResults: 10,
    includeText: true,
    ...(domain ? { includeDomains: [domain] } : {}),
  })
}
