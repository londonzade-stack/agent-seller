import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from './admin-shared'

// Re-export client-safe utilities so server-side code can still import from '@/lib/admin'
export { ADMIN_EMAILS, isAdminEmail } from './admin-shared'

export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables for admin client')
  }
  return createSupabaseAdmin(url, serviceKey)
}

export async function verifyAdmin(): Promise<{ isAdmin: boolean; userId?: string; email?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { isAdmin: false }
  return {
    isAdmin: ADMIN_EMAILS.includes(user.email || ''),
    userId: user.id,
    email: user.email || undefined,
  }
}
