import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-sender'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const results: Record<string, string> = {}

  // 1. Expire risk library
  const { error: expireErr } = await supabase.rpc('avr_expire_risk_library')
  results.expire_library = expireErr?.message ?? 'ok'

  // 2. Generate in-app notifications
  const { error: reviewNotifErr } = await supabase.rpc('avr_notify_review_due')
  results.notify_review = reviewNotifErr?.message ?? 'ok'

  const { error: overdueNotifErr } = await supabase.rpc('avr_notify_overdue_mitigation')
  results.notify_overdue = overdueNotifErr?.message ?? 'ok'

  const { error: libraryNotifErr } = await supabase.rpc('avr_notify_library_expiring')
  results.notify_library = libraryNotifErr?.message ?? 'ok'

  // 3. Kirim email review due (H-7 dan H-1)
  const { data: dueReviews } = await supabase
    .from('avr_v_due_review')
    .select('id, risk_code, title, risk_owner_id, days_until_review')
    .in('days_until_review', [7, 1])

  let emailReviewSent = 0
  for (const risk of dueReviews ?? []) {
    if (!risk.risk_owner_id) continue
    const { data: owner } = await supabase
      .from('avr_user_profiles')
      .select('full_name, email')
      .eq('id', risk.risk_owner_id)
      .single()
    if (!owner?.email) continue

    await sendEmail(owner.email, 'review_due', {
      recipientName:   owner.full_name,
      riskCode:        risk.risk_code,
      riskTitle:       risk.title,
      daysUntilReview: risk.days_until_review,
      riskId:          risk.id,
    })
    emailReviewSent++
  }
  results.email_review_sent = `${emailReviewSent} emails`

  // 4. Kirim email mitigasi overdue
  const { data: overdues } = await supabase
    .from('avr_v_overdue_mitigations')
    .select('*')

  let emailOverdueSent = 0
  const notifiedOwners = new Set<string>()

  for (const o of overdues ?? []) {
    // Kirim ke risk owner (deduplicate per risk)
    const key = `${o.risk_id}-${o.risk_owner_id}`
    if (o.risk_owner_id && !notifiedOwners.has(key)) {
      notifiedOwners.add(key)
      const { data: owner } = await supabase
        .from('avr_user_profiles').select('full_name, email').eq('id', o.risk_owner_id).single()
      if (owner?.email) {
        await sendEmail(owner.email, 'mitigation_overdue', {
          recipientName: owner.full_name,
          riskCode:      o.risk_code,
          riskTitle:     o.risk_title,
          daysOverdue:   o.days_overdue,
          progressPct:   o.progress_percentage,
          riskId:        o.risk_id,
        })
        emailOverdueSent++
      }
    }
  }
  results.email_overdue_sent = `${emailOverdueSent} emails`

  // 5. Kirim email library expiring (H-7)
  const { data: expiringItems } = await supabase
    .from('avr_risk_library')
    .select('id, judul, created_by')
    .eq('status', 'pending')
    .lt('created_at', new Date(Date.now() - 83 * 86400000).toISOString())

  let emailLibrarySent = 0
  for (const item of expiringItems ?? []) {
    if (!item.created_by) continue
    const { data: creator } = await supabase
      .from('avr_user_profiles').select('full_name, email').eq('id', item.created_by).single()
    if (!creator?.email) continue

    await sendEmail(creator.email, 'library_expiring', {
      recipientName:   creator.full_name,
      riskTitle:       item.judul,
      daysUntilExpire: 7,
      libraryId:       item.id,
    })
    emailLibrarySent++
  }
  results.email_library_sent = `${emailLibrarySent} emails`

  return NextResponse.json({ ok: true, ...results, timestamp: new Date().toISOString() })
}
