import { createClient } from '@/lib/supabase/server'
import { sanitizeError } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { message, rating, page } = await request.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 })
    }

    if (rating !== undefined && rating !== null) {
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return new Response(JSON.stringify({ error: 'Rating must be between 1 and 5' }), { status: 400 })
      }
    }

    const { error } = await supabase
      .from('feedback')
      .insert({
        user_id: user.id,
        message: message.trim(),
        rating: rating || null,
        page: page || null,
      })

    if (error) {
      sanitizeError('Feedback insert error', error)
      return new Response(
        JSON.stringify({ error: 'Failed to submit feedback' }),
        { status: 500 },
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    sanitizeError('Feedback error', error)
    return new Response(
      JSON.stringify({ error: 'Failed to submit feedback' }),
      { status: 500 },
    )
  }
}
