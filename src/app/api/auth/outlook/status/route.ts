import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeError } from '@/lib/logger'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check for Outlook connection
    const { data: connection, error: connError } = await supabase
      .from('user_email_connections')
      .select('id, email, provider, created_at')
      .eq('user_id', user.id)
      .eq('provider', 'outlook')
      .single()

    if (connError || !connection) {
      return NextResponse.json({
        connected: false,
        email: null,
      })
    }

    return NextResponse.json({
      connected: true,
      email: connection.email,
      provider: connection.provider,
      connectedAt: connection.created_at,
    })
  } catch (error) {
    sanitizeError('Outlook status error', error)
    return NextResponse.json(
      { error: 'Failed to check Outlook status' },
      { status: 500 }
    )
  }
}

// Disconnect Outlook
export async function DELETE() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Delete Outlook connection
    const { error: deleteError } = await supabase
      .from('user_email_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'outlook')

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    sanitizeError('Outlook disconnect error', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Outlook' },
      { status: 500 }
    )
  }
}
