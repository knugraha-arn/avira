import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-sender'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { to, recipientName, inviterName, role } = await request.json()
  if (!to) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  const result = await sendEmail(to, 'invite', { recipientName, inviterName, role })
  return NextResponse.json(result)
}
