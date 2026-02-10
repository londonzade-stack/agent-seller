import { createClient } from '@/lib/supabase/server'
import { scanInboxForEmails } from '@/lib/gmail/service'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Fetch recent emails and extract unique contacts
    const emails = await scanInboxForEmails(user.id, { maxResults: 100 })

    const contactMap = new Map<string, {
      email: string
      name: string
      totalEmails: number
      lastContactDate: string
      labels: string[]
    }>()

    for (const email of emails) {
      const sender = email.from || ''
      // Extract email address from "Name <email>" format
      const emailMatch = sender.match(/<([^>]+)>/)
      const emailAddr = emailMatch ? emailMatch[1] : sender
      const nameMatch = sender.match(/^([^<]+)/)
      const name = nameMatch ? nameMatch[1].trim().replace(/"/g, '') : emailAddr

      if (!emailAddr || emailAddr.includes('noreply') || emailAddr.includes('no-reply')) continue

      const existing = contactMap.get(emailAddr)
      if (existing) {
        existing.totalEmails++
        if (new Date(email.date || '') > new Date(existing.lastContactDate)) {
          existing.lastContactDate = email.date || existing.lastContactDate
        }
      } else {
        contactMap.set(emailAddr, {
          email: emailAddr,
          name: name || emailAddr,
          totalEmails: 1,
          lastContactDate: email.date || new Date().toISOString(),
          labels: [],
        })
      }
    }

    const contacts = Array.from(contactMap.values())
      .sort((a, b) => new Date(b.lastContactDate).getTime() - new Date(a.lastContactDate).getTime())

    return Response.json({ contacts })
  } catch (error) {
    console.error('Contacts API error:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch contacts' }), { status: 500 })
  }
}
