import { createClient } from '@/lib/supabase/server'
import { sanitizeError } from '@/lib/logger'
import { searchWeb, findCompanies } from '@/lib/exa/service'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Check Pro plan
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, plan')
      .eq('user_id', user.id)
      .single()

    if (!subscription || (subscription.status !== 'active' && subscription.status !== 'trialing')) {
      return new Response(JSON.stringify({ error: 'Active subscription required' }), { status: 403 })
    }

    if (subscription.plan !== 'pro') {
      return new Response(JSON.stringify({ error: 'Pro plan required for outreach search' }), { status: 403 })
    }

    const body = await req.json()
    const { query, filters } = body as {
      query: string
      filters?: {
        industry?: string
        location?: string
        numResults?: number
        type?: 'companies' | 'general'
      }
    }

    if (!query || !query.trim()) {
      return new Response(JSON.stringify({ error: 'Search query is required' }), { status: 400 })
    }

    const numResults = Math.min(filters?.numResults || 10, 20)
    const searchType = filters?.type || 'companies'

    let results
    if (searchType === 'companies') {
      results = await findCompanies(query, {
        numResults,
        industry: filters?.industry,
        location: filters?.location,
      })
    } else {
      results = await searchWeb(query, {
        numResults,
        includeText: true,
        includeSummary: true,
      })
    }

    return Response.json({
      results: results.results.map(r => ({
        id: r.id,
        title: r.title,
        url: r.url,
        description: r.summary || r.text?.slice(0, 300) || '',
        publishedDate: r.publishedDate,
      })),
    })
  } catch (error) {
    sanitizeError('Outreach search error', error)
    return new Response(
      JSON.stringify({ error: 'Search failed' }),
      { status: 500 },
    )
  }
}
