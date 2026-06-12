import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-sender'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { adminEmails, deactivatedUserName, deactivatedByName } = await request.json()
  if (!adminEmails?.length) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  // Kirim ke semua admin
  const results = await Promise.all(
    adminEmails.map((email: string) =>
      sendEmail(email, 'user_deactivated', {
        recipientName:       'Admin',
        deactivatedUserName,
        deactivatedByName,
      })
    )
  )

  return NextResponse.json({ ok: true, sent: results.filter(r => r.ok).length })
}
