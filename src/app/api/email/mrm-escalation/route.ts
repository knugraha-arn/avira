import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-sender'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { riskCode, riskTitle, mrmReason, riskId } = await request.json()

  // Ambil semua admin aktif
  const { data: admins } = await supabase
    .from('avr_user_profiles')
    .select('full_name, email')
    .eq('role', 'admin')
    .eq('is_active', true)

  if (!admins?.length) return NextResponse.json({ ok: true, sent: 0 })

  const results = await Promise.all(
    admins.map(admin =>
      sendEmail(admin.email, 'risk_escalated', {
        recipientName: admin.full_name,
        riskCode,
        riskTitle,
        mrmReason,
        riskId,
      })
    )
  )

  return NextResponse.json({ ok: true, sent: results.filter(r => r.ok).length })
}
