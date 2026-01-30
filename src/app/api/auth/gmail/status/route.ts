import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Check for Gmail connection
    const { data: connection, error: connError } = await supabase
      .from('user_email_connections')
      .select('id, email, provider, created_at')
      .eq('user_id', user.id)
      .eq('provider', 'gmail')
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
    console.error('Gmail status error:', error)
    return NextResponse.json(
      { error: 'Failed to check Gmail status' },
      { status: 500 }
    )
  }
}

// Disconnect Gmail
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

    // Delete Gmail connection
    const { error: deleteError } = await supabase
      .from('user_email_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'gmail')

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Gmail disconnect error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Gmail' },
      { status: 500 }
    )
  }
}
