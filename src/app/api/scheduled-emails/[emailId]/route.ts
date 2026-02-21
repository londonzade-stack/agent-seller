import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE — cancel a scheduled email (only if still scheduled)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ emailId: string }> }
) {
  const { emailId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify belongs to user and is still cancelable
  const { data: email } = await supabase
    .from('scheduled_emails')
    .select('id, status')
    .eq('id', emailId)
    .eq('user_id', user.id)
    .single()

  if (!email) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (email.status !== 'scheduled') {
    return NextResponse.json({ error: `Cannot cancel — email is already ${email.status}` }, { status: 400 })
  }

  const { error } = await supabase
    .from('scheduled_emails')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('id', emailId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
