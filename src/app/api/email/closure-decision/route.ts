import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-sender'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { to, recipientName, riskCode, riskTitle, approverName, decision, rejectionReason, riskId } = await request.json()
  if (!to || !decision) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const template = decision === 'Approved' ? 'closure_approved' : 'closure_rejected'

  const result = await sendEmail(to, template, {
    recipientName,
    riskCode,
    riskTitle,
    approverName,
    rejectionReason,
    riskId,
  })

  return NextResponse.json(result)
}
