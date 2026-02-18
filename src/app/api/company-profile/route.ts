import { createClient } from '@/lib/supabase/server'
import { sanitizeError } from '@/lib/logger'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('company_profiles')
      .select('company_name, description, user_role, target_customer, industry, notes')
      .eq('user_id', user.id)
      .single()

    // PGRST116 = "no rows returned" — expected for new users who haven't set up a profile
    if (error && error.code !== 'PGRST116') {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return Response.json({ profile: profile || null })
  } catch (error) {
    sanitizeError('Company profile GET error', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch company profile' }),
      { status: 500 },
    )
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const body = await req.json()
    const { companyName, description, userRole, targetCustomer, industry, notes } = body

    const { data: profile, error } = await supabase
      .from('company_profiles')
      .upsert(
        {
          user_id: user.id,
          company_name: companyName || null,
          description: description || null,
          user_role: userRole || null,
          target_customer: targetCustomer || null,
          industry: industry || null,
          notes: notes || null,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return Response.json({ profile })
  } catch (error) {
    sanitizeError('Company profile PUT error', error)
    return new Response(
      JSON.stringify({ error: 'Failed to save company profile' }),
      { status: 500 },
    )
  }
}
